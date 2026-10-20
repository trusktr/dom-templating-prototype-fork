# DOM Templating prototype: source sync and browser builds

Upstream: https://github.com/justinfagnani/dom-templating-api-proposal

This repository builds `packages/dom-templating-prototype` from the **entire
upstream monorepo**, retaining workspace dependencies and the root npm lockfile.
The original reference was `1fb12bf503d6abbac3fe7fd8bd8aff064e3b593f`; every run
discovers upstream's current default branch and pins one fetched commit.

## Branch ownership

- **`copilot/main` is the automation/control branch.** Edit the workflow, tooling,
  or documentation here, never on generated branches. It is intentionally named
  after the task's existing working branch to avoid an extra bootstrap branch.
- **`main` is generated source.** If the control branch is the repository default,
  it is an exact upstream mirror, including upstream history.
- **`build` is generated browser output**, published only on successful validation.
  Its root `dom-templating.js` is self-contained browser ESM. Unbundled modules,
  scheduler output, declarations, maps, corresponding TS sources and notices are
  under `packages/`. No dependencies, compiler tests, or caches are published.

### Default-branch fallback

The preferred configuration is repository **Settings → General → Default branch
→ `copilot/main`**. This requires repository administration permission; the
workflow's deliberately restricted `GITHUB_TOKEN` does not have it. No PAT is
needed for normal operation. This environment's `gh` is unauthenticated, and its
available repository tools do not expose a default-branch update operation.

When the default remains `main`, the workflow uses a small, explicit overlay so
GitHub can still discover the daily schedule and manual trigger on the default
branch. `main` retains upstream's complete source, root lockfile, and README, plus:

- `automation/` (excluding installed dependencies);
- `.github/workflows/sync-build.yml`;
- `AUTOMATION.md` (this document) and `.automation-state.json`.

Upstream workflow files are retained verbatim under `.github/upstream-workflows/`
instead of being executable Actions workflows. This prevents upstream CI from
gaining write authority in the fork. In exact-mirror mode upstream workflows
remain untouched, but token-generated main pushes do not trigger them; fork
workflow token defaults should stay read-only. No automation executes upstream
workflows. The build job alone executes upstream build/test scripts with read-only
permissions, no persisted checkout credentials, and no publication token.

After switching the default branch, manually run the workflow: the next source
sync removes the overlay and publishes the exact upstream commit. The workflow
always checks out control code from `copilot/main`, then pins that control commit
for the other jobs; it never executes automation from the upstream source.

**Exact-mirror permission caveat:** GitHub may reject a `GITHUB_TOKEN` push that
introduces or changes upstream `.github/workflows/*` files unless identical
workflow paths/content already exist in this repository. `contents: write` does
not grant Workflows administration. Such a rejection fails the sync without
changing `main`; do not add a personal token to work around it. Keep the default
on `main` and use overlay mode if that restriction applies. An exact mirror with
arbitrary future upstream workflow changes cannot be guaranteed using only
`GITHUB_TOKEN`.

## Automation

Workflow: [Sync upstream and publish browser build](https://github.com/trusktr/dom-templating-prototype-fork/actions/workflows/sync-build.yml)

- Daily at **06:23 UTC**, manually using **Run workflow**, and on control-branch
  automation/documentation pushes (including initial bootstrap).
- Three explicitly connected jobs: sync, read-only build/test, publish.
  Publication uses only `GITHUB_TOKEN` with job-local `contents: write`.
- A shared concurrency group serializes publication; fetch/compile/test failures
  fail the run, with sensible job timeouts. No personal secrets are required.
- An upstream discovery/fetch failure never changes `main`. A compilation,
  browser test, or packaging failure may leave `main` advanced, but **never changes
  `build`**. Read the failed job logs for the exact failure.
- Branch updates use explicit force-with-lease against the observed remote SHA.
  Only the verified initial main commit, upstream ancestors, or marked automation
  commits may be replaced; an unrecognized branch tip fails closed. Generated
  branches must not contain user work. Do not rewrite this control branch.
- Identical trees are not committed again. Provenance is deterministic (no
  per-run timestamp): upstream URL/branch/SHA, control SHA, Node and esbuild versions.
  A tooling/runtime update may legitimately create a new build.
- Bootstrap does not rely on token-generated pushes triggering Actions. A control
  push starts sync, build and publication in the **same workflow run**.

The workflow must be enabled in repository Actions settings. If a control push
does not start it (for example, a platform suppresses automation-authored pushes),
an administrator must make the control branch the default, then use **Run
workflow**. Until one successful run, `main`/`build` are not initialized by this
code's mere presence. Exact execution status is reported separately; do not
interpret this document as evidence of a completed publication.

Copilot-authored workflow changes can additionally require a human's
**Approve and run** in Actions. The initial bootstrap push produced run
[`39350368927`](https://github.com/trusktr/dom-templating-prototype-fork/actions/runs/39350368927)
with conclusion **`action_required`** and **zero jobs**. This is not a compilation
failure or a successful publication; approval is outside the workflow token's
authority. Approve the latest run rather than rerunning an older code revision.

## Browser / CodePen

See [the distribution documentation](automation/BUILD-README.md) for a complete
HTML example and caching/immutable-URL guidance.

Bundle after a successful publication:
https://cdn.jsdelivr.net/gh/trusktr/dom-templating-prototype-fork@build/dom-templating.js

Verified API: `html`, `svg`, `mathml`, `render`, `DOMTemplate`.
This is **experimental, not a production polyfill**, as upstream explicitly notes.

## Reproduce validation locally

Use Node 24 (CI pins 24.22.0 to keep provenance stable across runners). Fetch
upstream into a separate source checkout and select one SHA.
From the control checkout run `npm ci --prefix automation` and
`npm test --prefix automation`. In the upstream root run `npm ci --ignore-scripts`,
then `npm run build --workspace=packages/dom-scheduler-prototype` and
`npm run build --workspace=packages/dom-templating-prototype`.
Install Chromium with `npx --no-install playwright install chromium`; run
`npm test --workspace=packages/dom-scheduler-prototype` and
`npm test --workspace=packages/dom-templating-prototype`.

Set `SOURCE_SHA`, `SOURCE_BRANCH`, and `CONTROL_SHA` to the selected commits/branch;
run `node automation/build.mjs /absolute/source /absolute/output`, then
`node automation/smoke.mjs /absolute/source /absolute/output`.
The workflow runs these same steps on Ubuntu, adding Chromium system dependencies.

The upstream lockfile currently includes known audit findings in development/test
dependencies. It is preserved, not silently rewritten; build jobs are isolated
from publishing credentials and none of those dependencies are shipped. The
control toolchain is separately pinned in `automation/package-lock.json`.

## Declarative Shadow DOM investigation

The upstream-style tests in `automation/upstream-tests/` reproduce declarative
shadow DOM in a `TemplateResult`. They are deliberately **not included in the
daily publishing gate**: six rendering expectations currently fail upstream.
They are assets for an upstream fix, not a local runtime patch or a changed
browser build. Copy them into upstream's
`packages/dom-templating-prototype/src/test/` when preparing that change.

The reported example is https://codepen.io/trusktr/pen/rayKaWB. CodePen could not
be reached from the sandbox (DNS resolution failed), so these are minimal,
independent reproductions, **not a verified reproduction of the Pen's exact
source**. The Pen's HTML/JS is still needed to confirm any example-specific issue.

### Reproduced against upstream `1fb12bf503d6abbac3fe7fd8bd8aff064e3b593f`

- Unmodified upstream plus both fixtures: **181 passed, 6 failed, 4 skipped**.
  The existing templating tests account for 176 passes and all four skips;
  the fixtures add two passing rendering controls, three passing native-platform
  controls, and six failing DSD cases.
- Static `<template shadowrootmode="open">` content remains inert: no shadow root.
- Interpolated shadow content throws an error saying expressions are not supported
  inside `template` elements.
- Changing only `el.innerHTML = …` to `el.setHTMLUnsafe(…)` in a temporary source
  checkout still gives **181 passed, 6 failed, 4 skipped**. Some failures change:
  shadow attributes produce a misleading duplicate-binding error, and adjacent
  expressions can render into the wrong position. This experiment was discarded,
  not shipped as a fix.

The three native-platform tests independently confirm that `innerHTML` does not
activate DSD, `setHTMLUnsafe` does, `document.importNode(..., true)` drops a
non-clonable shadow root, and a normal `TreeWalker` does not enter even a clonable
shadow root. These results were actually executed in Playwright Chromium 141.

### Required upstream change

The relevant file is upstream
`packages/dom-templating-prototype/src/lib/template.ts`:

1. **Parsing/instantiation** (line 75): support DSD creation instead of relying
   solely on `innerHTML`. Native parsing is one option; explicitly instantiating
   DSD from the inert template tree for each clone is another. Preserve ordinary
   inert templates, validate modes/hosts, and define closed-root and DSD flag
   behavior. This is feature work, not just a parser API substitution.
2. **Binding preparation** (lines 89–103): remove the blanket rejection only for
   supported DSD content and discover its child/attribute bindings. Ordinary
   `<template>` expression semantics should not accidentally change.
3. **Binding coordinates and cloning** (lines 218–243): preparation and cloning
   must use the same shadow-aware mapping, preserve expression order from the
   source, and create fresh shadow trees for every instance. Simply visiting all
   shadow roots before light children can reorder expressions around the DSD
   template's original position. Do not require authors to add
   `shadowrootclonable` just to make the renderer work.
4. **Part boundaries** (`src/lib/child-part.ts`, `clone()`): consuming a DSD
   template must not invalidate a preceding child part's `endNode` (currently
   captured as `node.nextSibling`). Resolve/remap boundaries if activation moves
   or removes nodes. Updates must keep the host, root, and bound nodes stable.

The regression covers static DSD, dynamic text/attributes and identity on update,
mixed light/shadow expression order, repeated cached-template instances, adjacent
child-part boundaries, and nested roots. An upstream implementation should also
cover closed roots, DSD flags, invalid modes/hosts, and existing custom-element
roots before being considered complete. No production fix or upstream PR is
included in this investigation.

### Run the regression

Use a disposable upstream checkout at the SHA above and the existing upstream
toolchain. With `CONTROL` and `SOURCE` set to **absolute paths** to the control and
disposable source checkouts:

```sh
cp "$CONTROL"/automation/upstream-tests/*_test.ts \
  "$SOURCE"/packages/dom-templating-prototype/src/test/
cd "$SOURCE"
npm ci --ignore-scripts
npx --no-install playwright install chromium
npm test --workspace=packages/dom-templating-prototype
```

The test command also compiles the TypeScript fixtures using upstream's existing
build script. Exit status 1 with the six failures above is the expected current
result; do not weaken those assertions to turn unsupported behavior into a pass.
To run only the passing platform controls after compilation:

```sh
cd "$SOURCE/packages/dom-templating-prototype"
../../node_modules/.bin/wtr test/shadow-dom-platform_test.js
```

## Attribution and licensing

Justin Fagnani's DOM Templating prototype derives from Google's lit-html.
Its **BSD-3-Clause** license, copyright notices, package README and source comments
are preserved in the distribution. Scheduler metadata/notices are preserved;
upstream provides no separate scheduler license, and this fork does not invent one.
The initial destination `LICENSE` (MIT, Joe Pea) applies only to the fork's own
automation contributions; it does **not** relicense upstream code. Generated
`main` receives upstream licensing as-is, and `build/LICENSE` reproduces the
templating package's actual BSD license.
