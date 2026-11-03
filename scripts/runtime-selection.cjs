const fs = require('node:fs');

// Integer arithmetic keeps the inclusive 10% boundary independent of rounding.
function selectRuntime(fullJreBytes, jlinkBytes) {
  for (const size of [fullJreBytes, jlinkBytes]) {
    if (!Number.isSafeInteger(size) || size <= 0) throw Error('VSIX size must be a positive safe integer');
  }
  return {
    fullJreBytes, jlinkBytes, savings: 1 - jlinkBytes / fullJreBytes,
    variant: BigInt(jlinkBytes) * 10n <= BigInt(fullJreBytes) * 9n ? 'jlink' : 'full-jre',
  };
}

function directoryBytes(root) {
  return fs.readdirSync(root, {withFileTypes: true}).reduce((total, entry) => {
    const file = require('node:path').join(root, entry.name);
    return total + (entry.isDirectory() ? directoryBytes(file) : fs.statSync(file).size);
  }, 0);
}

module.exports = {selectRuntime, directoryBytes};
