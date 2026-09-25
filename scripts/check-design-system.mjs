#!/usr/bin/env node
// Narrow, deterministic design-system guardrails. This checks enforceable contracts; it does not
// claim to measure visual quality. A source line can exempt an intentional literal with:
// design-check-allow: raw-color
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadDirectory } from './lib/content.mjs';
import { CONTACT_PRESENTATION_STATES, contactRouteContract, placeToContact } from './lib/routing.mjs';

const SOURCE_EXTENSIONS = new Set(['.astro', '.css', '.js', '.mjs']);
const extension = path => path.slice(path.lastIndexOf('.'));
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

export function rawColourIssues(siteRoot) {
  const tokenPath = resolve(siteRoot, 'styles/tokens.css');
  const labelRoot = resolve(siteRoot).startsWith(`${resolve(ROOT)}/`) ? ROOT : siteRoot;
  const pattern = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;
  return walk(siteRoot).filter(path => SOURCE_EXTENSIONS.has(extension(path)) && resolve(path) !== tokenPath)
    .flatMap(path => readFileSync(path, 'utf8').split('\n').flatMap((line, index) =>
      pattern.test(line) && !line.includes('design-check-allow: raw-color')
        ? [`${relative(labelRoot, path)}:${index + 1}: move raw colour to site/styles/tokens.css`]
        : []));
}

export function sourceContractIssues(root = ROOT) {
  const issues = [];
  const read = path => readFileSync(join(root, path), 'utf8');
  const badge = read('site/components/StatusBadge.astro');
  const route = read('site/components/ContactRoute.astro');
  const record = read('site/pages/[lang]/[section]/[id]/index.astro');
  const directory = read('site/pages/[lang]/directory/index.astro');
  const path = read('site/pages/[lang]/start/[outcome]/index.astro');

  for (const state of CONTACT_PRESENTATION_STATES) {
    if (!badge.includes(`${state}:`)) issues.push(`StatusBadge is missing the ${state} non-colour symbol`);
  }
  for (const marker of ['state.actionable ?', 'data-contact-action="primary"', 'data-contact-evidence="true"', 'mechanism.href']) {
    if (!route.includes(marker)) issues.push(`ContactRoute is missing required contract marker: ${marker}`);
  }
  if (/<(?:Button|a)[^>]*(?:data-contact-evidence|contact-route-evidence)[^>]*class(?:=|:)[^>]*btn/s.test(route)) {
    issues.push('ContactRoute evidence must not use primary button styling');
  }
  if (!record.includes('<ContactRoute')) issues.push('Record routes must render with ContactRoute');
  if (!directory.includes('<StatusBadge')) issues.push('Directory contact states must render with StatusBadge');
  for (const marker of ['data-actionable="${state.actionable}"', 'data-contact-action="primary"', 'data-contact-evidence="true"']) {
    if (!path.includes(marker)) issues.push(`Guided path contact markup is missing: ${marker}`);
  }
  for (const directoryPath of ['site/pages', 'site/layouts']) {
    const sourceDirectory = join(root, directoryPath);
    if (!existsSync(sourceDirectory)) continue;
    for (const file of walk(sourceDirectory).filter(file => extension(file) === '.astro')) {
      for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        if (/<(?:a|button|p|div)\b[^>]*class="[^"]*\b(?:btn|notice)\b/.test(line) && !line.includes('data-ds-component=')) {
          issues.push(`${relative(root, file)}:${index + 1}: use Button or Notice instead of legacy presentation markup`);
        }
      }
    }
  }
  return issues;
}

export function dataContractIssues(records = loadDirectory()) {
  const issues = [];
  for (const record of records) {
    const contracts = (record.facts?.routes ?? []).map(route => contactRouteContract(record, route));
    for (const contract of contracts) {
      const label = `${contract.recordId}/${contract.routeId}`;
      if (contract.state.actionable) {
        if (!contract.mechanism.value || !contract.mechanism.actionKind) issues.push(`${label}: actionable route lacks a mechanism/action label`);
        if (!contract.audience.length) issues.push(`${label}: actionable route lacks audience information`);
        if (!contract.acceptedSubjects.length) issues.push(`${label}: actionable route lacks accepted-subject information`);
        if (!contract.evidence.url || !contract.evidence.note || !contract.evidence.checkedOn) issues.push(`${label}: actionable route lacks complete evidence`);
      } else if (contract.mechanism.href) {
        issues.push(`${label}: non-actionable route exposes an action href`);
      }
    }
    if (placeToContact(record) && !contracts.some(contract => contract.state.actionable)) {
      issues.push(`${record.id}: published place to contact has no actionable route`);
    }
  }
  return issues;
}

export function checkDesignSystem(root = ROOT) {
  return [
    ...rawColourIssues(join(root, 'site')),
    ...sourceContractIssues(root),
    ...(resolve(root) === resolve(ROOT) ? dataContractIssues() : [])
  ];
}

if (resolve(process.argv[1] ?? '') === resolve(fileURLToPath(import.meta.url))) {
  const issues = checkDesignSystem();
  if (issues.length) {
    console.error(`Design-system check failed (${issues.length}):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(`Design-system check passed: ${CONTACT_PRESENTATION_STATES.length} contact states, source contracts, data contracts, and token-only colours.`);
  }
}
