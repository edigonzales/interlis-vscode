'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const {compact} = require('./fixtures/portable.json');

test('real layout keeps self-loop anchors distinct and cannot publish after invalidation', {timeout: 30000}, async () => {
  const assets = path.resolve('out/diagram');
  const server = http.createServer((request, response) => {
    if (request.url === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end('<link rel="stylesheet" href="/diagram-ui.css"><div id="canvas" class="interlis-canvas" style="width:1000px;height:700px"></div>');
      return;
    }
    const asset = request.url.slice(1);
    if (!/^[a-z.-]+$/.test(asset) || !fs.existsSync(path.join(assets, asset))) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', asset.endsWith('.css') ? 'text/css' : 'text/javascript');
    fs.createReadStream(path.join(assets, asset)).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:' + server.address().port);
    const result = await page.evaluate(async dto => {
      const {DiagramCanvas, ElkLayoutService, defaultInteractiveSettings} = await import('/diagram-ui.js');
      const element = document.getElementById('canvas');
      const workerUrl = new URL('/diagram-layout-worker.js', location.href);
      const worker = new ElkLayoutService(workerUrl);
      let hold = false, release, markHeld;
      const held = new Promise(resolve => { markHeld = resolve; });
      const delayed = {
        async layout(...args) {
          const result = await worker.layout(...args);
          if (hold) await new Promise(resolve => { release = resolve; markHeld(); });
          return result;
        },
        cancel: () => worker.cancel(),
        close: () => worker.close()
      };
      const canvas = new DiagramCanvas(element, {}, workerUrl, delayed);
      try {
        const self = dto.edges.find(edge => edge.label === 'Self');
        const node = dto.nodes.find(node => node.id === self.source.elementId);
        dto.nodes = [node];
        dto.edges = [self];
        const paint = async edgeRouting => {
          if (!await canvas.accept(dto, 'test', {...defaultInteractiveSettings, edgeRouting})) throw Error('diagram not accepted');
          canvas.fit();
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const route = element.querySelector('.sprotty-edge path');
          const box = route.getBBox();
          const start = route.getPointAtLength(0), end = route.getPointAtLength(route.getTotalLength());
          return {width: box.width, height: box.height, separation: Math.hypot(end.x - start.x, end.y - start.y)};
        };
        const orthogonal = await paint('ORTHOGONAL'), polyline = await paint('POLYLINE');
        const bounds = element.getBoundingClientRect(), graph = element.querySelector('svg.sprotty-graph').getBoundingClientRect();
        const graphFillsCanvas = Math.abs(bounds.width - graph.width) < 2 && Math.abs(bounds.height - graph.height) < 2;
        const before = element.querySelector('svg.sprotty-graph').outerHTML;
        hold = true;
        const pending = canvas.accept(structuredClone(dto), 'test');
        await held;
        canvas.invalidate();
        release();
        return {orthogonal, polyline, graphFillsCanvas, accepted: await pending,
          labels: element.textContent, status: element.dataset.status,
          drawingUnchanged: element.querySelector('svg.sprotty-graph').outerHTML === before};
      } finally { canvas.dispose(); }
    }, compact);
    for (const loop of [result.orthogonal, result.polyline]) {
      assert.ok(loop.width > 15 && loop.height > 15 && loop.separation > 15, JSON.stringify(loop));
    }
    assert.equal(result.graphFillsCanvas, true);
    assert.equal(result.accepted, false);
    assert.equal(result.status, 'STALE');
    assert.equal(result.drawingUnchanged, true);
    assert.match(result.labels, /parent/);
    assert.match(result.labels, /children/);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
