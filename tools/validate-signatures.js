#!/usr/bin/env node
/**
 * Validates all pattern signatures in lib/signatures/.
 * Run: node tools/validate-signatures.js
 *
 * Checks:
 *   1. Required top-level fields are present and non-empty
 *   2. Each signal has id, description, weight (1–10), required (bool), and check
 *   3. Signal IDs are unique within each signature
 *   4. check.kind is one of the known kinds
 *   5. check fields match the kind's expected schema
 *   6. At least one required:true signal exists (warns if none)
 *   7. patternUrl is a string starting with https://
 */

import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIGS_DIR = join(__dirname, '..', 'lib', 'signatures');

const KNOWN_KINDS = new Set([
  'role-equals',
  'role-in',
  'tag-in',
  'attr-present',
  'attr-absent',
  'has-descendant-role',
  'roving-tabindex',
  'responds-to-key',
  'activation-mutates',
  'peer-group-min',
  'in-tab-order',
  'computed-style',  // Phase 3: checks a CSS computed property value
]);

const RESPONDS_TO_KEY_EXPECTS = new Set([
  'activation',
  'focus-move',
  'close',
  'value-change',
]);

const ACTIVATION_MUTATES_TARGETS = new Set([
  'self',
  'parent',
]);

let totalErrors = 0;
let totalWarnings = 0;

function error(file, msg) {
  console.error(`  ✗ ${msg}`);
  totalErrors++;
}

function warn(file, msg) {
  console.warn(`  ⚠ ${msg}`);
  totalWarnings++;
}

function validateCheck(check, signalId, file) {
  if (!check || typeof check !== 'object') {
    error(file, `signal "${signalId}": check must be an object`);
    return;
  }
  if (!check.kind) {
    error(file, `signal "${signalId}": check.kind is missing`);
    return;
  }
  if (!KNOWN_KINDS.has(check.kind)) {
    error(file, `signal "${signalId}": unknown check.kind "${check.kind}"`);
    return;
  }

  switch (check.kind) {
    case 'role-equals':
      if (!check.role) error(file, `signal "${signalId}": role-equals requires check.role`);
      break;
    case 'role-in':
      if (!Array.isArray(check.roles) || check.roles.length === 0)
        error(file, `signal "${signalId}": role-in requires check.roles (non-empty array)`);
      break;
    case 'tag-in':
      if (!Array.isArray(check.tags) || check.tags.length === 0)
        error(file, `signal "${signalId}": tag-in requires check.tags (non-empty array)`);
      break;
    case 'attr-present':
    case 'attr-absent':
      if (!check.attr) error(file, `signal "${signalId}": ${check.kind} requires check.attr`);
      break;
    case 'has-descendant-role':
      if (!check.role) error(file, `signal "${signalId}": has-descendant-role requires check.role`);
      break;
    case 'responds-to-key':
      if (!check.key) error(file, `signal "${signalId}": responds-to-key requires check.key`);
      if (!check.expect) error(file, `signal "${signalId}": responds-to-key requires check.expect`);
      else if (!RESPONDS_TO_KEY_EXPECTS.has(check.expect))
        error(file, `signal "${signalId}": unknown responds-to-key expect "${check.expect}"`);
      break;
    case 'activation-mutates':
      if (!check.attr) error(file, `signal "${signalId}": activation-mutates requires check.attr`);
      if (!check.target) error(file, `signal "${signalId}": activation-mutates requires check.target`);
      else if (!ACTIVATION_MUTATES_TARGETS.has(check.target))
        error(file, `signal "${signalId}": unknown activation-mutates target "${check.target}"`);
      break;
    case 'peer-group-min':
      if (!check.role) error(file, `signal "${signalId}": peer-group-min requires check.role`);
      if (typeof check.min !== 'number') error(file, `signal "${signalId}": peer-group-min requires check.min (number)`);
      break;
    case 'computed-style':
      if (!check.property) error(file, `signal "${signalId}": computed-style requires check.property`);
      if (!check.value) error(file, `signal "${signalId}": computed-style requires check.value`);
      break;
    case 'roving-tabindex':
    case 'in-tab-order':
      // no extra fields
      break;
  }
}

async function validateFile(filename) {
  if (filename === 'index.js') return;

  const filepath = join(SIGS_DIR, filename);
  let sig;
  try {
    const mod = await import(pathToFileURL(filepath).href);
    sig = mod.default;
  } catch (e) {
    console.error(`  ✗ failed to import: ${e.message}`);
    totalErrors++;
    return;
  }

  // Top-level required fields
  const requiredFields = ['patternName', 'patternUrl', 'keyboardInteractions',
    'requiredRoles', 'requiredAttributes', 'requiredStates', 'commonFailures', 'signals'];
  for (const f of requiredFields) {
    if (sig[f] === undefined || sig[f] === null) {
      error(filename, `missing field "${f}"`);
    }
  }

  if (typeof sig.patternUrl === 'string' && !sig.patternUrl.startsWith('https://')) {
    error(filename, `patternUrl must start with https://`);
  }

  if (!Array.isArray(sig.signals)) {
    error(filename, `signals must be an array`);
    return;
  }

  const seenIds = new Set();
  let hasRequired = false;

  for (const signal of sig.signals) {
    if (!signal.id) { error(filename, `signal missing id`); continue; }

    if (seenIds.has(signal.id)) {
      error(filename, `duplicate signal id "${signal.id}"`);
    }
    seenIds.add(signal.id);

    if (!signal.description) error(filename, `signal "${signal.id}": missing description`);
    if (typeof signal.weight !== 'number' || signal.weight < 1 || signal.weight > 10) {
      error(filename, `signal "${signal.id}": weight must be a number 1–10 (got ${signal.weight})`);
    }
    if (typeof signal.required !== 'boolean') {
      error(filename, `signal "${signal.id}": required must be a boolean`);
    }
    if (signal.required) hasRequired = true;

    validateCheck(signal.check, signal.id, filename);
  }

  if (!hasRequired) {
    warn(filename, `no required:true signals — all failures will be soft`);
  }
}

async function run() {
  const files = readdirSync(SIGS_DIR).filter(f => f.endsWith('.js'));
  console.log(`Validating ${files.length - 1} signature(s) in ${SIGS_DIR}\n`);

  for (const file of files) {
    if (file === 'index.js') continue;
    process.stdout.write(`${file}\n`);
    await validateFile(file);
  }

  console.log('\n' + '─'.repeat(50));
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✓ All signatures valid.');
  } else {
    if (totalErrors > 0) console.error(`✗ ${totalErrors} error(s)`);
    if (totalWarnings > 0) console.warn(`⚠ ${totalWarnings} warning(s)`);
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

run();
