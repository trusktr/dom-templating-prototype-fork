import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';

export const upstream = 'https://github.com/justinfagnani/dom-templating-api-proposal.git';
export const controlBranch = 'copilot/main';
export const initialMain = 'c9a5a1d3ad3d19fb369ce87b506a58210fdfdaf3';
export const marker = 'Generated-by: dom-templating-sync';

export function git(cwd, ...args) {
  return execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
}

export function configureAuth() {
  if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN is required for publication');
  process.env.GIT_CONFIG_COUNT = '1';
  process.env.GIT_CONFIG_KEY_0 = 'http.https://github.com/.extraheader';
  process.env.GIT_CONFIG_VALUE_0 = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString('base64')}`;
}

export function initialize(dir) {
  git(dir, 'init', '--quiet');
  git(dir, 'config', 'user.name', 'github-actions[bot]');
  git(dir, 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
}

export function destination() {
  if (process.env.GITHUB_REPOSITORY !== 'trusktr/dom-templating-prototype-fork') {
    throw new Error('Refusing to publish outside the configured destination');
  }
  return `https://github.com/${process.env.GITHUB_REPOSITORY}.git`;
}

export function remoteHead(dir, url, branch) {
  const result = git(dir, 'ls-remote', '--heads', url, `refs/heads/${branch}`);
  if (!result) return '';
  const sha = result.split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('Invalid remote SHA');
  git(dir, 'fetch', '--quiet', '--no-tags', url, `refs/heads/${branch}`);
  if (git(dir, 'rev-parse', 'FETCH_HEAD') !== sha) throw new Error('Remote changed while fetching; retry');
  return sha;
}

export function generated(dir, sha) {
  return git(dir, 'show', '-s', '--format=%B', sha).split('\n').includes(marker)
    && git(dir, 'show', '-s', '--format=%an', sha) === 'github-actions[bot]';
}

export function publish(dir, url, branch, old, sha) {
  if (old === sha) return false;
  git(dir, 'push', '--porcelain', `--force-with-lease=refs/heads/${branch}:${old}`, url, `${sha}:refs/heads/${branch}`);
  return true;
}

export function commitTree(dir, tree, parent, subject) {
  if (parent && git(dir, 'rev-parse', `${parent}^{tree}`) === tree) return parent;
  return git(dir, 'commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', `${subject}\n\n${marker}`);
}

export function output(name, value) {
  console.log(`${name}=${value}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
