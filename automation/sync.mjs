import {cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {commitTree, configureAuth, controlBranch, destination, generated, git, initialMain, initialize, output, publish, upstream} from './git.mjs';

const control = resolve(import.meta.dirname, '..');
configureAuth();
const url = destination();
const dir = mkdtempSync(join(tmpdir(), 'dom-sync-'));
try {
  initialize(dir);
  const head = git(dir, 'ls-remote', '--symref', upstream, 'HEAD');
  const branch = /^ref: refs\/heads\/(.+)\tHEAD$/m.exec(head)?.[1];
  const sha = /^([0-9a-f]{40})\tHEAD$/m.exec(head)?.[1];
  if (!branch || !sha) throw new Error('Unable to discover upstream default branch');
  git(dir, 'fetch', '--quiet', '--no-tags', upstream, `refs/heads/${branch}`);
  if (git(dir, 'rev-parse', 'FETCH_HEAD') !== sha) throw new Error('Upstream moved while fetching; retry');
  git(dir, 'checkout', '--quiet', '--detach', sha);
  const old = remoteHeadChecked();
  const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`, {
    headers: {
      Authorization: ['Bearer', process.env.GH_TOKEN].join(' '),
      Accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok) throw new Error(`Cannot read default branch: HTTP ${response.status}`);
  const {default_branch: defaultBranch} = await response.json();
  if (![controlBranch, 'main'].includes(defaultBranch)) throw new Error(`Unsupported default branch: ${defaultBranch}`);
  let target = sha;
  if (defaultBranch === 'main') {
    // Retain upstream workflow text, but do not execute it with fork permissions.
    if (existsSync(join(dir, '.github/workflows'))) {
      if (existsSync(join(dir, '.github/upstream-workflows'))) throw new Error('Overlay path collides with upstream');
      renameSync(join(dir, '.github/workflows'), join(dir, '.github/upstream-workflows'));
    }
    for (const path of ['automation', '.github/workflows/sync-build.yml']) {
      if (existsSync(join(dir, path))) throw new Error(`Overlay path collides with upstream: ${path}`);
      mkdirSync(join(dir, path, '..'), {recursive: true});
      cpSync(join(control, path), join(dir, path), {
        recursive: true,
        filter: (src) => !src.split('/').includes('node_modules'),
      });
    }
    if (existsSync(join(dir, 'AUTOMATION.md')) || existsSync(join(dir, '.automation-state.json'))) {
      throw new Error('Overlay metadata collides with upstream');
    }
    cpSync(join(control, 'README.md'), join(dir, 'AUTOMATION.md'));
    writeFileSync(join(dir, '.automation-state.json'), JSON.stringify({
      upstream, sourceSha: sha, controlSha: git(control, 'rev-parse', 'HEAD'),
    }, null, 2) + '\n');
    git(dir, 'add', '--all');
    target = commitTree(dir, git(dir, 'write-tree'), old || sha, `Sync upstream ${sha}`);
  }
  const changed = publish(dir, url, 'main', old, target);
  output('source_sha', sha);
  output('source_branch', branch);
  output('main_sha', target);
  output('mode', defaultBranch === 'main' ? 'automation-overlay' : 'exact-mirror');
  output('changed', String(changed));

  function remoteHeadChecked() {
    const listing = git(dir, 'ls-remote', '--heads', url, 'refs/heads/main');
    if (!listing) return '';
    const oldSha = listing.split(/\s+/)[0];
    git(dir, 'fetch', '--quiet', '--no-tags', url, 'refs/heads/main');
    if (git(dir, 'rev-parse', 'FETCH_HEAD') !== oldSha) throw new Error('main moved while fetching; retry');
    if (oldSha === initialMain || generated(dir, oldSha)) return oldSha;
    // Exact upstream mirrors are safe to advance; user commits are not.
    try {
      git(dir, 'merge-base', '--is-ancestor', oldSha, sha);
      return oldSha;
    } catch {
      throw new Error('main contains unrecognized work; refusing to overwrite it');
    }
  }
} finally {
  rmSync(dir, {recursive: true, force: true});
}
