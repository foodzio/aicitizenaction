// Each check in scripts/validate.mjs must catch the failure it exists for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tree, validate, body } from './helpers.mjs';

const P = 'content/bodies/us/federal/us-test-committee.yml';
const has = (r, text) => r.errors.some(e => e.msg.includes(text));

test('a valid record passes', () => {
  const r = validate(tree({ [P]: body() }));
  assert.deepEqual(r.errors, []);
});

test('an unknown vocabulary value fails', () => {
  const b = body(); b.facts.routes[0].type = 'carrier-pigeon';
  assert.ok(has(validate(tree({ [P]: b })), 'not in schema/vocab/route-types.yml'));
});

test('a route marked verified with no value fails', () => {
  const b = body(); b.facts.routes[0].value = null;
  assert.ok(has(validate(tree({ [P]: b })), 'verified true but has no value'));
});

test('verification has no default: a route without `verified` fails', () => {
  const b = body(); delete b.facts.routes[0].verified;
  assert.ok(has(validate(tree({ [P]: b })), "must have required property 'verified'"));
});

test('a record with neither sources nor an unsourced reason fails', () => {
  const b = body(); delete b.meta.sources;
  const r = validate(tree({ [P]: b }));
  assert.equal(r.code, 1);
});

test('a malformed URL in sources fails', () => {
  const b = body(); b.meta.sources = [{ url: 'example.org' }];
  assert.equal(validate(tree({ [P]: b })).code, 1);
});

test('dates: future verified_on and review_by before verified_on fail', () => {
  const b = body(); b.meta.verified_on = '2099-01-01'; b.meta.review_by = '2098-01-01';
  const r = validate(tree({ [P]: b }));
  assert.ok(has(r, 'meta.verified_on is in the future'));
  assert.ok(has(r, 'review_by is before'));
});

test('duplicate ids fail', () => {
  const r = validate(tree({ [P]: body(), 'content/bodies/us/federal/x/us-test-committee.yml': body() }));
  assert.ok(has(r, 'duplicate id'));
});

test('file name must match id, and path must match geography', () => {
  const r = validate(tree({ 'content/bodies/gb/other-name.yml': body() }));
  assert.ok(has(r, 'file name must be'));
  assert.ok(has(r, 'does not match geo'));
});

test('a type in the wrong folder fails', () => {
  const r = validate(tree({ 'content/orgs/us/federal/us-test-committee.yml': body() }));
  assert.equal(r.code, 1);
});

test('filled routing fields must not still be marked needs_research, and need a vocabulary', () => {
  const b = body(); b.facts.powers = ['compel']; b.meta.needs_research = ['powers'];
  const r = validate(tree({ [P]: b }));
  assert.ok(has(r, 'still listed in meta.needs_research'));
});

test('route strings must match a route', () => {
  const b = body(); b.strings.routes.ghost = { label: 'x' };
  assert.ok(has(validate(tree({ [P]: b })), 'has no matching route'));
});

test('invalid owner handle fails (a bare @ was the original YAML bug)', () => {
  const b = body(); b.meta.owners = ['geo-us'];
  assert.equal(validate(tree({ [P]: b })).code, 1);
});

test('an overdue record is a warning, not an error', () => {
  const b = body(); b.meta.review_by = '2026-09-23'; b.meta.verified_on = '2026-01-01';
  const r = validate(tree({ [P]: { ...b } }));
  assert.equal(r.code, 0);
});

test('a reviewed open contact route requires evidence, audience and subjects', () => {
  const b = body();
  b.facts.routes[0] = {
    id: 'contact', type: 'form', value: 'https://example.org/report', verified: true, verified_on: '2026-09-22',
    contact: { status: 'open', directness: 'direct', review: 'reviewed' }
  };
  const r = validate(tree({ [P]: b }));
  assert.ok(has(r, 'needs evidence_url'));
  assert.ok(has(r, 'needs eligible_users'));
  assert.ok(has(r, 'needs accepted_subjects'));
});

test('a reviewed limited contact route requires restrictions', () => {
  const b = body();
  b.facts.routes[0] = {
    id: 'contact', type: 'form', value: 'https://example.org/report', verified: true, verified_on: '2026-09-22',
    contact: {
      status: 'limited', directness: 'direct', review: 'reviewed', eligible_users: ['employees'],
      accepted_subjects: ['ai-safety'], evidence_url: 'https://example.org/policy', evidence_note: 'Employees may report.', checked_on: '2026-09-22'
    }
  };
  assert.ok(has(validate(tree({ [P]: b })), 'needs restrictions'));
});
