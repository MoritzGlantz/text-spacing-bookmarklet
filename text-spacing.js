(() => {
  // Clicking the bookmarklet again removes the panel and all overrides.
  if (window.textSpacingBookmarklet) {
    window.textSpacingBookmarklet.close();
    return;
  }

  // The WCAG 2.2 SC 1.4.12 test values are the maximum of each slider.
  const props = [
    { id: 'lh', name: 'Line height', css: 'line-height', unit: '', min: 1, max: 1.5, step: 0.05 },
    { id: 'ps', name: 'Paragraph spacing', css: 'margin-block-end', unit: 'em', min: 0, max: 2, step: 0.25 },
    { id: 'ls', name: 'Letter spacing', css: 'letter-spacing', unit: 'em', min: 0, max: 0.12, step: 0.01 },
    { id: 'ws', name: 'Word spacing', css: 'word-spacing', unit: 'em', min: 0, max: 0.16, step: 0.02 }
  ];
  const state = {};
  props.forEach(p => { state[p.id] = { on: true, value: p.max }; });

  const buildCss = () => {
    const decl = p => `${p.css}:${state[p.id].value}${p.unit}!important`;
    const text = props.filter(p => p.id !== 'ps' && state[p.id].on).map(decl).join(';');
    let css = text ? `*,*::before,*::after{${text}}` : '';
    if (state.ps.on) css += `p{${decl(props[1])}}`;
    return css;
  };

  // One constructed stylesheet per document (main page and same-origin
  // iframes), adopted by the document and every open shadow root in it.
  // Constructed stylesheets are not blocked by a CSP style-src.
  const sheets = new Map();
  const roots = new Set();
  const adopt = (root, doc) => {
    let sheet = sheets.get(doc);
    if (!sheet) {
      sheet = new doc.defaultView.CSSStyleSheet();
      sheets.set(doc, sheet);
    }
    if (!root.adoptedStyleSheets.includes(sheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    }
    roots.add(root);
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) adopt(el.shadowRoot, doc);
      if (el.localName === 'iframe' || el.localName === 'frame') {
        try {
          const d = el.contentDocument;
          if (d && d.documentElement && d.defaultView) adopt(d, d);
        } catch (e) {
          console.warn('Text spacing: could not reach iframe', el.src);
        }
      }
    }
  };

  // Small DOM helper. No innerHTML, so it also works with Trusted Types.
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    el.append(...kids);
    return el;
  };

  const previousFocus = document.activeElement;
  const host = h('div', { id: 'text-spacing-bookmarklet', 'data-pos': 'br' });
  // Closed shadow root: page CSS can't style the panel, and the scan above
  // can't find it, so the panel itself never gets the overrides.
  const shadow = host.attachShadow({ mode: 'closed' });
  const ui = new CSSStyleSheet();
  ui.replaceSync(`
    :host{all:initial!important;display:block!important;position:fixed!important;z-index:2147483647!important;inset:auto 8px 8px auto!important}
    :host([data-pos=bl]){inset:auto auto 8px 8px!important}
    :host([data-pos=tl]){inset:8px auto auto 8px!important}
    :host([data-pos=tr]){inset:8px 8px auto auto!important}
    .p{box-sizing:border-box;width:23em;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;padding:.85em;border:2px solid currentColor;border-radius:.5em;background:#fff;color:#111;font:.875em/1.4 system-ui,sans-serif;letter-spacing:normal;word-spacing:normal;text-align:start;box-shadow:0 4px 16px rgba(0,0,0,.3)}
    .p *{box-sizing:border-box;margin:0;font:inherit;line-height:inherit;letter-spacing:inherit;word-spacing:inherit}
    .head{display:flex;flex-wrap:wrap;align-items:center;gap:.4em}
    .title{margin-inline-end:auto;font-weight:700}
    button{min-height:24px;padding:.15em .6em;border:1px solid currentColor;border-radius:4px;background:transparent;color:inherit;cursor:pointer}
    button:hover{background:rgba(128,128,128,.2)}
    :focus-visible{outline:3px solid #0b57d0;outline-offset:2px}
    .row{margin-top:.85em}
    .top{display:flex;align-items:center;gap:.4em}
    .top label{flex:1}
    .val{font-weight:700;font-variant-numeric:tabular-nums}
    input{accent-color:#0b57d0}
    input[type=checkbox]{width:1.25em;height:1.25em}
    input[type=range]{width:100%;margin-top:.3em}
    .scale{display:flex;justify-content:space-between;font-size:.85em}
    .actions{display:flex;flex-wrap:wrap;gap:.4em;margin-top:.85em}
    .status{min-height:2.8em;margin-top:.6em;font-size:.85em}
    [hidden]{display:none!important}
    @media (prefers-color-scheme:dark){.p{background:#1e1e1e;color:#f2f2f2}:focus-visible{outline-color:#8ab4f8}input{accent-color:#8ab4f8}}
  `);
  shadow.adoptedStyleSheets = [ui];

  const status = h('p', { class: 'status', role: 'status' });
  const syncs = [];

  const apply = () => {
    adopt(document, document);
    const css = buildCss();
    sheets.forEach(s => s.replaceSync(css));
    syncs.forEach(sync => sync());
    const full = props.every(p => state[p.id].on && Number(state[p.id].value) === p.max);
    const text = full
      ? 'Full WCAG 1.4.12 test: all four at the test values.'
      : 'Partial: not the full WCAG 1.4.12 test.';
    if (status.textContent !== text) status.textContent = text;
  };

  const rows = props.map(p => {
    const box = h('input', { type: 'checkbox', id: `${p.id}-on` });
    const range = h('input', {
      type: 'range', id: p.id, min: p.min, max: p.max, step: p.step,
      'aria-label': `${p.name} value`
    });
    // A span, not <output>: <output> is a live region and would announce
    // every value a second time next to the slider's own value.
    const out = h('span', { class: 'val' });
    box.addEventListener('change', () => {
      state[p.id].on = box.checked;
      apply();
    });
    range.addEventListener('input', () => {
      state[p.id].value = range.value;
      state[p.id].on = true;
      apply();
    });
    syncs.push(() => {
      const { on, value } = state[p.id];
      box.checked = on;
      range.value = value;
      range.setAttribute('aria-valuetext', `${Number(value)} times the font size`);
      out.textContent = on ? `${Number(value)}×` : 'off';
    });
    return h('div', { class: 'row' },
      h('div', { class: 'top' }, box, h('label', { for: `${p.id}-on` }, p.name), out),
      range,
      h('div', { class: 'scale', 'aria-hidden': 'true' },
        h('span', {}, `${p.min}×`), h('span', {}, `${p.max}× WCAG`))
    );
  });

  const setAll = on => {
    props.forEach(p => { state[p.id] = { on, value: on ? p.max : state[p.id].value }; });
    apply();
  };

  const corners = ['br', 'bl', 'tl', 'tr'];
  const body = h('div', { id: 'body' },
    ...rows,
    h('div', { class: 'actions' },
      h('button', { type: 'button', onclick: () => setAll(true) }, 'All to WCAG'),
      h('button', { type: 'button', onclick: () => setAll(false) }, 'All off')
    ),
    status
  );
  const toggle = h('button', {
    type: 'button', 'aria-expanded': 'true', 'aria-controls': 'body',
    onclick: () => {
      body.hidden = !body.hidden;
      toggle.setAttribute('aria-expanded', String(!body.hidden));
    }
  }, 'Controls');

  const close = () => {
    const ours = [...sheets.values()];
    roots.forEach(r => {
      try {
        r.adoptedStyleSheets = r.adoptedStyleSheets.filter(s => !ours.includes(s));
      } catch (e) { /* root is gone */ }
    });
    host.remove();
    delete window.textSpacingBookmarklet;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  };

  const panel = h('div', { class: 'p', lang: 'en', role: 'region', 'aria-label': 'Text spacing test, WCAG 1.4.12', tabindex: '-1' },
    h('div', { class: 'head' },
      h('span', { class: 'title' }, 'Text spacing'),
      toggle,
      h('button', {
        type: 'button',
        onclick: () => {
          const next = corners[(corners.indexOf(host.dataset.pos) + 1) % corners.length];
          host.dataset.pos = next;
        }
      }, 'Move'),
      h('button', { type: 'button', onclick: close }, 'Close')
    ),
    body
  );

  shadow.append(panel);
  document.documentElement.append(host);
  window.textSpacingBookmarklet = { close };
  apply();
  panel.focus();
})();
