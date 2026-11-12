# Text Spacing Bookmarklet

A bookmarklet to test [WCAG 2.2 success criterion 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).

It opens a small panel with all four properties set to the WCAG test values:

| Property | WCAG value |
| --- | --- |
| Line height | 1.5 × font size |
| Paragraph spacing | 2 × font size |
| Letter spacing | 0.12 × font size |
| Word spacing | 0.16 × font size |

Each property has a checkbox and a slider from 0 up to the WCAG value, so you can find out which property breaks a layout. The styles also reach same-origin iframes and open shadow roots. Click the bookmarklet again to remove everything.

## Install

Drag the button from the [blog post](https://moritzglantz.de/blog/posts/text-spacing-bookmarklet-wcag-1-4-12/) to your bookmarks bar.

Or create a bookmark yourself and paste the contents of [`bookmarklet.txt`](bookmarklet.txt) as its URL.

## Build

`text-spacing.js` is the readable source. After changing it, run:

```sh
node build.mjs
```

This removes comments and indentation, URL-encodes the code and writes the result to `bookmarklet.txt`.

## Limitations

- Bookmarklets don’t run on browser pages like `chrome://`, in the built-in PDF viewer or in extension stores.
- Every page load resets it.
- Cross-origin iframes and closed shadow roots can’t be reached.
- Inline styles with `!important` win over the bookmarklet.

## Credits

Inspired by [Steve Faulkner’s text spacing bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html) and the [Text Spacing Editor](https://github.com/actum/text-spacing-editor) extension by Actum.
