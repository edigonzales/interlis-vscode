const yauzl = require('yauzl');

/** Validate archive paths before handing the VSIX to the native installer. */
function readVSIX(file) {
  return new Promise((resolve, reject) => yauzl.open(file, {lazyEntries: true}, (error, zip) => {
    if (error) return reject(error);
    const paths = new Set();
    let manifest, xml, bytes = 0;
    const fail = error => { zip.close(); reject(error); };
    zip.on('error', fail);
    zip.on('entry', entry => {
      (async () => {
        const name = entry.fileName;
        const key = name.replace(/\/$/, '').toLowerCase();
        bytes += entry.uncompressedSize;
        const type = (entry.externalFileAttributes >>> 16) & 0o170000;
        if ((!name.startsWith('extension/') && !['[Content_Types].xml', 'extension.vsixmanifest'].includes(name)) ||
            name.includes('\\') || name.includes(':') || name.split('/').includes('..') ||
            paths.has(key) || paths.size >= 5000 || bytes > 600 * 1024 * 1024 ||
            ![0, 0o040000, 0o100000].includes(type)) throw Error('Unsafe or excessive VSIX entry: ' + name);
        paths.add(key);
        if (name === 'extension/package.json' || name === 'extension.vsixmanifest') {
          if (entry.uncompressedSize > 1024 * 1024) throw Error('Excessive VSIX metadata');
          const stream = await new Promise((yes, no) => zip.openReadStream(entry, (err, input) => err ? no(err) : yes(input)));
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          const text = Buffer.concat(chunks).toString('utf8');
          if (name === 'extension/package.json') manifest = JSON.parse(text);
          else xml = text;
        }
        zip.readEntry();
      })().catch(fail);
    });
    zip.on('end', () => manifest && xml ? resolve({manifest, xml}) : reject(Error('Missing VSIX metadata')));
    zip.readEntry();
  }));
}

module.exports = {readVSIX};
