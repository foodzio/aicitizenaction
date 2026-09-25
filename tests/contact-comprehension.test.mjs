import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIMENSIONS, scoreComprehension } from '../scripts/score-contact-comprehension.mjs';

const participant = (id, overrides = {}) => Object.fromEntries([
  ['id', id], ...DIMENSIONS.map(dimension => [dimension, true]),
  ['reference_only_mistaken_for_action', false], ...Object.entries(overrides)
]);

test('comprehension scoring requires five real coded participants and both targets', () => {
  const four = scoreComprehension({ participants: [1, 2, 3, 4].map(i => participant(`P0${i}`)) });
  assert.equal(four.status, 'insufficient_participants');
  assert.equal(four.targetMet, false);

  const passing = scoreComprehension({ participants: [1, 2, 3, 4, 5].map(i => participant(`P0${i}`)) });
  assert.equal(passing.actionEvidenceAccuracy, 1);
  assert.equal(passing.referenceOnlyMistakes, 0);
  assert.equal(passing.status, 'target_met');

  const mistaken = scoreComprehension({ participants: [1, 2, 3, 4, 5].map(i => participant(`P0${i}`, i === 1 ? { reference_only_mistaken_for_action: true } : {})) });
  assert.equal(mistaken.status, 'target_not_met');
});

test('comprehension scoring rejects missing, non-boolean and duplicate observations', () => {
  const invalid = scoreComprehension({ participants: [participant('P01'), { ...participant('P01'), evidence_link: 'yes' }] });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes('unique')));
  assert.ok(invalid.errors.some(error => error.includes('evidence_link')));
});

test('ninety percent action/evidence accuracy is inclusive', () => {
  const participants = Array.from({ length: 10 }, (_, index) => participant(`P${String(index + 1).padStart(2, '0')}`, index === 0 ? { evidence_link: false, contact_action: false } : {}));
  const result = scoreComprehension({ participants });
  assert.equal(result.actionEvidenceAccuracy, 0.9);
  assert.equal(result.targetMet, true);
});
