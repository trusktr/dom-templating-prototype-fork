import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {resolve, sep} from 'node:path';

const source = resolve(process.argv[2]);
const out = resolve(process.argv[3]);
const require = createRequire(resolve(source, 'package.json'));
const {chromium} = require('playwright');
const server = createServer(async (req, res) => {
  try {
    const path = resolve(out, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(out + sep)) throw new Error('Invalid path');
    res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/example.html`);
  await page.waitForFunction(() => document.querySelector('#demo p')?.textContent === 'Hello, CodePen!');
  for (const path of ['./dom-templating.js', './packages/dom-templating-prototype/index.js']) {
    const result = await page.evaluate(async (path) => {
      const api = await import(path);
      const container = document.createElement('div');
      document.body.append(container);
      const template = (name) => api.html`<p>Hello, ${name}!</p>`;
      api.render(template('browser'), container);
      const first = container.firstElementChild;
      api.render(template('updated'), container);
      return {
        exports: Object.keys(api).sort(),
        text: container.textContent,
        reused: first === container.firstElementChild,
      };
    }, path);
    assert.deepEqual(result.exports, ['DOMTemplate', 'html', 'mathml', 'render', 'svg']);
    assert.equal(result.text, 'Hello, updated!');
    assert.equal(result.reused, true);
  }
  assert.deepEqual(errors, []);
  console.log('Chromium smoke passed: example, bundled/unbundled exports, rendering and updates');
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
