#!/usr/bin/env node
// Scores facilitator-coded comprehension observations. It never infers or invents participant
// answers: each answer is coded true/false using docs/design-system-comprehension-test.md.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIMENSIONS = ['recipient', 'accepted_content', 'eligibility', 'availability', 'contact_action', 'evidence_link', 'unavailable_reason'];

export function scoreComprehension(input) {
  const errors = [];
  if (!Array.isArray(input?.participants) || !input.participants.length) errors.push('participants must be a non-empty array');
  const participants = Array.isArray(input?.participants) ? input.participants : [];
  const ids = new Set();
  for (const [index, participant] of participants.entries()) {
    const label = participant?.id || `participant ${index + 1}`;
    if (!participant?.id || typeof participant.id !== 'string') errors.push(`${label}: id is required`);
    else if (ids.has(participant.id)) errors.push(`${label}: id must be unique`);
    else ids.add(participant.id);
    for (const dimension of DIMENSIONS) {
      if (typeof participant?.[dimension] !== 'boolean') errors.push(`${label}: ${dimension} must be true or false`);
    }
    if (typeof participant?.reference_only_mistaken_for_action !== 'boolean') errors.push(`${label}: reference_only_mistaken_for_action must be true or false`);
  }
  if (errors.length) return { valid: false, errors };

  const dimensionRates = Object.fromEntries(DIMENSIONS.map(dimension => [
    dimension,
    participants.filter(participant => participant[dimension]).length / participants.length
  ]));
  const actionEvidenceCorrect = participants.reduce((sum, participant) => sum + Number(participant.contact_action) + Number(participant.evidence_link), 0);
  const actionEvidenceTotal = participants.length * 2;
  const actionEvidenceAccuracy = actionEvidenceCorrect / actionEvidenceTotal;
  const referenceOnlyMistakes = participants.filter(participant => participant.reference_only_mistaken_for_action).length;
  const enoughParticipants = participants.length >= 5;
  const targetMet = enoughParticipants && actionEvidenceAccuracy >= 0.9 && referenceOnlyMistakes === 0;
  return {
    valid: true,
    participantCount: participants.length,
    enoughParticipants,
    dimensionRates,
    actionEvidenceAccuracy,
    referenceOnlyMistakes,
    targetMet,
    status: !enoughParticipants ? 'insufficient_participants' : targetMet ? 'target_met' : 'target_not_met'
  };
}

if (resolve(process.argv[1] ?? '') === resolve(fileURLToPath(import.meta.url))) {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node scripts/score-contact-comprehension.mjs <results.json>');
    process.exit(1);
  }
  const result = scoreComprehension(JSON.parse(readFileSync(resolve(path), 'utf8')));
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid || !result.targetMet) process.exitCode = 1;
}
