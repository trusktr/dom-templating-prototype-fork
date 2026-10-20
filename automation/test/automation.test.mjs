import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {test} from 'node:test';
import {commitTree, destination, generated, git, initialize, publish, remoteHead} from '../git.mjs';

const control = resolve(import.meta.dirname, '../..');
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'dom-test-'));
  try {
    initialize(dir);
    fn(dir);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

test('deterministic tree publication is a no-op for identical output', () => fixture((dir) => {
  writeFileSync(join(dir, 'index.js'), 'export const value = 1;\n');
  git(dir, 'add', '.');
  const tree = git(dir, 'write-tree');
  const first = commitTree(dir, tree, '', 'Initial build');
  assert.equal(generated(dir, first), true);
  assert.equal(commitTree(dir, tree, first, 'Another run'), first);
  // A no-op does not even contact a remote.
  assert.equal(publish(dir, '/nonexistent-remote', 'build', first, first), false);
  writeFileSync(join(dir, 'index.js'), 'export const value = 2;\n');
  git(dir, 'add', '.');
  const second = commitTree(dir, git(dir, 'write-tree'), first, 'Changed output');
  assert.notEqual(second, first);
  assert.equal(git(dir, 'rev-parse', `${second}^`), first);
}));

test('ordinary user commits are not recognized as generated', () => fixture((dir) => {
  writeFileSync(join(dir, 'user.txt'), 'Preserve me');
  git(dir, 'add', '.');
  const sha = git(dir, 'commit-tree', git(dir, 'write-tree'), '-m', 'User work');
  assert.equal(generated(dir, sha), false);
}));

test('remote failure is not mistaken for an empty branch', () => fixture((dir) => {
  assert.throws(() => remoteHead(dir, '/nonexistent-remote', 'main'));
}));

test('destination guard refuses to publish to another repository', () => {
  const previous = process.env.GITHUB_REPOSITORY;
  try {
    process.env.GITHUB_REPOSITORY = 'somewhere/else';
    assert.throws(destination, /Refusing/);
  } finally {
    if (previous === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = previous;
  }
});

test('missing publishing credentials fail closed before branch changes', () => {
  const env = {...process.env};
  delete env.GH_TOKEN;
  const result = spawnSync(process.execPath, [join(control, 'automation/sync.mjs')], {env, encoding: 'utf8'});
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /GH_TOKEN is required/);
});

test('invalid build input fails without deleting last successful output', () => fixture((dir) => {
  writeFileSync(join(dir, 'last-success.txt'), 'keep');
  const env = {...process.env, SOURCE_SHA: 'invalid'};
  const result = spawnSync(process.execPath, [
    join(control, 'automation/build.mjs'), '/nonexistent-source', dir,
  ], {env, encoding: 'utf8'});
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SOURCE_SHA must/);
  assert.equal(readFileSync(join(dir, 'last-success.txt'), 'utf8'), 'keep');
}));

test('publication rejects artifact paths that could overwrite Git configuration', () => fixture((dir) => {
  writeFileSync(join(dir, 'provenance.json'), JSON.stringify({sourceSha: 'a'.repeat(40)}));
  const result = spawnSync(process.execPath, [join(control, 'automation/publish.mjs'), dir], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing unsafe publication path: \.git/);
}));

test('workflow has safe structure and explicit job dependencies', () => {
  const workflow = readFileSync(join(control, '.github/workflows/sync-build.yml'), 'utf8');
  // Use the system YAML parser when available, without introducing a dependency.
  const parsed = JSON.parse(execFileSync('python3', ['-c',
    'import sys,json,yaml; print(json.dumps(yaml.safe_load(sys.stdin)))',
  ], {input: workflow, encoding: 'utf8'}));
  const triggers = parsed.on ?? parsed.true; // YAML 1.1 treats "on" as boolean.
  assert.deepEqual(Object.keys(triggers).sort(), ['push', 'schedule', 'workflow_dispatch']);
  assert.equal(parsed.permissions.contents, 'read');
  assert.equal(parsed.concurrency['cancel-in-progress'], false);
  assert.equal(parsed.jobs.build.needs, 'sync');
  assert.deepEqual(parsed.jobs.publish.needs, ['sync', 'build']);
  assert.equal(parsed.jobs.build.permissions.contents, 'read');
  assert.equal(parsed.jobs.build.steps.find((step) => step.uses?.startsWith('actions/setup-node@')).with['package-manager-cache'], false);
  for (const job of Object.values(parsed.jobs)) {
    assert.ok(job['timeout-minutes'] > 0);
    for (const step of job.steps) {
      if (step.uses?.startsWith('actions/checkout@')) {
        assert.equal(step.with['persist-credentials'], false);
        assert.ok(step.with.ref);
        assert.ok(step.with.path);
      }
    }
  }
});
