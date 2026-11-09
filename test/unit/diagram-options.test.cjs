'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readDiagramDefaults} = require('../../build/diagram-options.cjs');
const settings = require('../../package.json').contributes.configuration.properties;

test('host defaults agree with the VS Code manifest', () => {
 const observed = [];
 const defaults = readDiagramDefaults({
  get(key, fallback) {
   observed.push(key);
   assert.equal(fallback, settings['interlisGuru.' + key].default, key);
   return fallback;
  }
 });
 assert.equal(observed.length, Object.keys(defaults.settings).length + 1);
 assert.equal(defaults.settings.direction, 'RIGHT');
 assert.equal(defaults.association, 'ENTITY');
});

test('a reset can read current defaults without changing another panel or configuration', () => {
 const values = new Map([['diagram.direction','DOWN'],['diagram.associationPresentation','COMPACT_BINARY']]);
 const configuration = {get: (key, fallback) => values.get(key) ?? fallback};
 const existing = readDiagramDefaults(configuration);
 values.set('diagram.direction','LEFT');
 values.set('diagram.deemphasizeAbstractTypes',false);
 const reset = readDiagramDefaults(configuration);
 assert.equal(existing.settings.direction,'DOWN');
 assert.equal(existing.settings.deemphasizeAbstractTypes,true);
 assert.equal(reset.settings.direction,'LEFT');
 assert.equal(reset.settings.deemphasizeAbstractTypes,false);
 assert.equal(reset.association,'COMPACT_BINARY');
 assert.equal(values.size,3);
});
