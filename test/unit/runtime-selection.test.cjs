const {test} = require('node:test');
const assert = require('node:assert/strict');
const {selectRuntime} = require('../../scripts/runtime-selection.cjs');
test('selects jlink only at or above 10% compressed VSIX savings', () => {
  assert.equal(selectRuntime(1000, 901).variant, 'full-jre');
  assert.equal(selectRuntime(1000, 900).variant, 'jlink');
  assert.equal(selectRuntime(1000, 899).variant, 'jlink');
  assert.equal(selectRuntime(1000, 1000).variant, 'full-jre');
  assert.equal(selectRuntime(1000, 1100).variant, 'full-jre');
  assert.equal(selectRuntime(101, 91).variant, 'full-jre');
  assert.equal(selectRuntime(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER).variant, 'full-jre');
  for (const size of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => selectRuntime(size, 100));
});
