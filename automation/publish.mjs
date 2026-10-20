import {cpSync, mkdtempSync, readdirSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {commitTree, configureAuth, destination, generated, git, initialize, output, publish, remoteHead} from './git.mjs';

const artifacts = resolve(process.argv[2]);
const provenance = JSON.parse(readFileSync(join(artifacts, 'provenance.json'), 'utf8'));
if (!/^[0-9a-f]{40}$/.test(provenance.sourceSha)) throw new Error('Missing source provenance');
function validateArtifacts(dir) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.isSymbolicLink()) {
      throw new Error(`Refusing unsafe publication path: ${entry.name}`);
    }
    if (entry.isDirectory()) validateArtifacts(join(dir, entry.name));
  }
}
validateArtifacts(artifacts);
configureAuth();
const url = destination();
const dir = mkdtempSync(join(tmpdir(), 'dom-publish-'));
try {
  initialize(dir);
  const old = remoteHead(dir, url, 'build');
  if (old && !generated(dir, old)) throw new Error('build contains unrecognized work; refusing to overwrite it');
  cpSync(artifacts, dir, {recursive: true});
  git(dir, 'add', '--all');
  const sha = commitTree(dir, git(dir, 'write-tree'), old, `Build upstream ${provenance.sourceSha}`);
  output('changed', String(publish(dir, url, 'build', old, sha)));
  output('build_sha', sha);
  const summary = `Build: https://github.com/${process.env.GITHUB_REPOSITORY}/tree/${sha}\n\nSource: ${provenance.sourceSha}\n\nBundle: https://cdn.jsdelivr.net/gh/${process.env.GITHUB_REPOSITORY}@${sha}/dom-templating.js\n`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const {appendFileSync} = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
} finally {
  rmSync(dir, {recursive: true, force: true});
}
