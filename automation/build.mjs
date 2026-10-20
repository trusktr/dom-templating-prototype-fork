import {build} from 'esbuild';
import {cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {git, upstream} from './git.mjs';

const source = resolve(process.argv[2]);
const out = resolve(process.argv[3]);
const control = resolve(import.meta.dirname, '..');
if (out === source || source.startsWith(out + '/') || out.startsWith(source + '/')) {
  throw new Error('Output must not overlap the source checkout');
}
for (const name of ['SOURCE_SHA', 'CONTROL_SHA']) {
  if (!/^[0-9a-f]{40}$/.test(process.env[name] ?? '')) throw new Error(`${name} must be a full commit SHA`);
}
if (existsSync(join(source, '.git')) && git(source, 'rev-parse', 'HEAD') !== process.env.SOURCE_SHA) {
  throw new Error('Source checkout does not match SOURCE_SHA');
}
rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
const packages = ['dom-templating-prototype', 'dom-scheduler-prototype'];
for (const name of packages) {
  const from = join(source, 'packages', name);
  const to = join(out, 'packages', name);
  mkdirSync(to, {recursive: true});
  // Explicitly exclude compiler-generated tests and test-runner configuration.
  for (const entry of ['index.js', 'index.js.map', 'index.d.ts', 'index.d.ts.map', 'lib']) {
    if (existsSync(join(from, entry))) cpSync(join(from, entry), join(to, entry), {recursive: true});
  }
  for (const entry of ['package.json', 'README.md', 'LICENSE']) {
    if (existsSync(join(from, entry))) cpSync(join(from, entry), join(to, entry));
  }
  // Include corresponding TS sources so declaration/source maps remain useful.
  for (const entry of ['index.ts', 'lib']) {
    if (existsSync(join(from, 'src', entry))) {
      mkdirSync(join(to, 'src'), {recursive: true});
      cpSync(join(from, 'src', entry), join(to, 'src', entry), {recursive: true});
    }
  }
  if (!existsSync(join(to, 'index.js'))) throw new Error(`${name} has not been compiled`);
  // Fail closed on newly introduced bare imports or missing relative modules.
  await build({entryPoints: [join(to, 'index.js')], bundle: true, platform: 'browser', write: false});
}
const license = readFileSync(join(source, 'packages/dom-templating-prototype/LICENSE'), 'utf8');
writeFileSync(join(out, 'LICENSE'), license);
const result = await build({
  entryPoints: [join(out, 'packages/dom-templating-prototype/index.js')],
  outfile: join(out, 'dom-templating.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2024',
  sourcemap: true,
  sourcesContent: true,
  legalComments: 'inline',
  banner: {js: '/* DOM Templating prototype: Justin Fagnani; derived from Google LLC lit-html.\n * BSD-3-Clause: see the accompanying LICENSE and upstream README. */'},
  metafile: true,
});
for (const artifact of Object.values(result.metafile.outputs)) {
  if (artifact.imports.length) throw new Error('Bundle contains unresolved imports');
}
writeFileSync(join(out, 'package.json'), JSON.stringify({private: true, type: 'module'}, null, 2) + '\n');
cpSync(join(control, 'automation/example.html'), join(out, 'example.html'));
cpSync(join(control, 'automation/BUILD-README.md'), join(out, 'README.md'));
const provenance = {
  upstream,
  sourceSha: process.env.SOURCE_SHA,
  sourceBranch: process.env.SOURCE_BRANCH,
  controlSha: process.env.CONTROL_SHA,
  node: process.version,
  esbuild: JSON.parse(readFileSync(join(control, 'automation/node_modules/esbuild/package.json'))).version,
  packages,
};
writeFileSync(join(out, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
const forbidden = /^(node_modules|test|\.git|\.wireit|\.tsbuildinfo|web-test-runner\.config.*)$/;
function validate(dir) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (forbidden.test(entry.name) || entry.isSymbolicLink()) throw new Error(`Unexpected build output: ${entry.name}`);
    if (entry.isDirectory()) validate(join(dir, entry.name));
  }
}
validate(out);
console.log(`Validated browser distribution for ${provenance.sourceSha}`);
