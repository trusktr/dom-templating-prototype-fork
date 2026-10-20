# Browser build of the DOM Templating prototype

Generated from [Justin Fagnani's upstream repository](https://github.com/justinfagnani/dom-templating-api-proposal).
See `provenance.json` for the exact upstream and automation commits and tool versions.
The templating implementation derives from Google's lit-html. Its original
BSD-3-Clause license is reproduced in `LICENSE`, not the fork's initial MIT license.
Scheduler output retains upstream metadata and notices; upstream supplies no
separate scheduler LICENSE. No new licensing grant is asserted for that package.

**Experimental demonstration only: upstream explicitly says this is not a
polyfill and is not intended for production use.** Use a modern browser
(the upstream compilation target is ES2024). No globals are patched.

## CodePen

Paste this into CodePen's HTML panel (no transpiler or import map needed):

```html
<div id="demo"></div>
<script type="module">
  import {html, render} from 'https://cdn.jsdelivr.net/gh/trusktr/dom-templating-prototype-fork@build/dom-templating.js';
  render(html`<p>Hello, ${'CodePen'}!</p>`, document.querySelector('#demo'));
</script>
```

Exports are `html`, `svg`, `mathml`, `render`, and `DOMTemplate` (containing the
three template tag functions). The bundle is self-contained ESM with no external
imports. `example.html` is the equivalent local example; serve this directory
with an HTTP server, not `file://`.

- Bundle: https://cdn.jsdelivr.net/gh/trusktr/dom-templating-prototype-fork@build/dom-templating.js
- Unbundled entry: https://cdn.jsdelivr.net/gh/trusktr/dom-templating-prototype-fork@build/packages/dom-templating-prototype/index.js
- Provenance: https://cdn.jsdelivr.net/gh/trusktr/dom-templating-prototype-fork@build/provenance.json
- Scheduler: `packages/dom-scheduler-prototype/index.js`
- Declarations, maps, corresponding sources, original package metadata, READMEs,
  and notices are retained alongside the unbundled modules.

For a reproducible URL replace `@build` with the **full build commit SHA** shown
in the successful workflow summary or the GitHub build branch history. Do not
substitute `sourceSha`: that SHA identifies upstream, not these generated files.
Branch URLs are CDN-cached and may lag a successful publication. Commit-pinned
URLs are immutable; use a new commit URL to observe an update.

`build` is generated and must not be edited by hand. Publication happens only
after compilation, upstream browser tests, packaging checks, and Chromium smoke
tests succeed. A failed run leaves the previous successful build intact.
