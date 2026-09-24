#!/usr/bin/env node
// Build the expiry contract consumed by server.mjs. Static HTML is safe only until the first
// contact route or named office-holder embedded in it reaches its deterministic review horizon.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, loadDirectory } from './lib/content.mjs';
import { builtLanguages } from './build-redirects.mjs';
import { contactValidThrough, eligibleContactRoute, isCurrentSeat, seatValidThrough } from './lib/routing.mjs';

const earliest = values => values.filter(Boolean).sort()[0] ?? null;

export function validityManifest(records = loadDirectory(), languages = builtLanguages(), generatedOn = new Date().toISOString().slice(0, 10)) {
  const contactDates = [];
  const seatDates = [];
  const recordDates = new Map();

  for (const record of records) {
    const dates = [];
    for (const route of record.facts?.routes ?? []) {
      if (!eligibleContactRoute(record, route, generatedOn)) continue;
      const date = contactValidThrough(route);
      contactDates.push(date);
      dates.push(date);
    }
    for (const seat of record.facts?.seats ?? []) {
      if (!isCurrentSeat(seat, generatedOn)) continue;
      const date = seatValidThrough(seat);
      seatDates.push(date);
      dates.push(date);
    }
    const validThrough = earliest(dates);
    if (validThrough) recordDates.set(`${record._section}/${record.id}`, validThrough);
  }

  const contactValid = earliest(contactDates);
  const recommendationValid = earliest([...contactDates, ...seatDates]);
  const paths = {};
  for (const lang of languages) for (const [record, date] of recordDates) paths[`/${lang}/${record}/`] = date;

  return {
    version: 1,
    generated_on: generatedOn,
    contact_valid_through: contactValid,
    recommendation_valid_through: recommendationValid,
    paths
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const out = valueAfter('--out') ?? join(ROOT, 'dist', 'directory-validity.json');
  const manifest = validityManifest();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${out}: recommendations valid through ${manifest.recommendation_valid_through}; contact data through ${manifest.contact_valid_through}`);
}
