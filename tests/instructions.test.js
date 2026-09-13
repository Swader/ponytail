const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getPonytailInstructions } = require('../hooks/ponytail-instructions');

const skillPath = path.resolve(__dirname, '../skills/ponytail/SKILL.md');
const modes = ['lite', 'full', 'ultra'];

function checkSharedContract(text, mode) {
  assert.match(text, new RegExp(`^PONYTAIL MODE ACTIVE — level: ${mode}\\n`));
  for (const phrase of [
    'every requested behavior',
    'one independent review',
    'relevant validation',
    'remaining risks or limits',
    'smallest meaningful check',
    "repository's existing test conventions",
    'input validation at trust boundaries',
    'prevents data loss',
    'security',
    'accessibility',
    'active host\'s mode and lifetime',
    'Keep its selected level and persistence',
    'standalone skill use without a persistent host mode',
  ]) {
    assert.ok(text.includes(phrase), `missing instruction contract: ${phrase}`);
  }
  assert.doesNotMatch(text, /Code first|at most three short lines|Ship the lazy version|No frameworks, no fixtures/);
}

test('emitted instructions preserve the active mode and complete-delivery rules', () => {
  for (const mode of modes) {
    const text = getPonytailInstructions(mode);
    checkSharedContract(text, mode);
    assert.doesNotMatch(text, /argument-hint:|metadata:/);
    const tableModes = [...text.matchAll(/^\| \*\*(lite|full|ultra)\*\* \|/gm)].map((match) => match[1]);
    const exampleModes = [...text.matchAll(/^- (lite|full|ultra): "/gm)].map((match) => match[1]);
    assert.deepEqual(tableModes, [mode]);
    assert.deepEqual(exampleModes, [mode]);
  }
});

test('an unavailable skill preserves those rules in emitted fallback instructions', (t) => {
  const readFileSync = fs.readFileSync;
  t.mock.method(fs, 'readFileSync', function (file, ...args) {
    if (path.resolve(String(file)) === skillPath) throw new Error('fixture: skill unavailable');
    return readFileSync.call(this, file, ...args);
  });
  for (const mode of modes) checkSharedContract(getPonytailInstructions(mode), mode);
});
