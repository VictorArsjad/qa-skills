'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const CLI = path.join(__dirname, '..', 'bin', 'qa-skills.js');
const target = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-skills-test-'));

function run(...args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
}

test('list shows the bundled skill', () => {
  const result = run('list');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /create-test-case/);
});

test('add installs SKILL.md and refuses to overwrite', () => {
  const first = run('add', 'create-test-case', '--path', target);
  assert.equal(first.status, 0);
  assert.ok(fs.existsSync(path.join(target, 'create-test-case', 'SKILL.md')));

  const second = run('add', 'create-test-case', '--path', target);
  assert.equal(second.status, 1);
  assert.match(second.stderr, /already exists/);
});

test('update overwrites and remove deletes', () => {
  const updated = run('update', 'create-test-case', '--path', target);
  assert.equal(updated.status, 0);

  const removed = run('remove', 'create-test-case', '--path', target);
  assert.equal(removed.status, 0);
  assert.equal(fs.existsSync(path.join(target, 'create-test-case')), false);
});

test('unknown skill and bad name fail', () => {
  assert.equal(run('add', 'nope', '--path', target).status, 1);
  assert.equal(run('add', '../evil', '--path', target).status, 1);
});
