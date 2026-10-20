import {assert} from 'chai';
import {html, render} from '../index.js';

// Minimal reproductions of declarative shadow DOM in a rendered TemplateResult.
// The linked CodePen could not be retrieved; these are not a copy of its source.
suite('render() with declarative shadow DOM', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  teardown(() => {
    container.remove();
  });

  test('control: renders ordinary light-DOM bindings', () => {
    render(html`<p>Hello, ${'world'}!</p>`, container);
    assert.equal(container.querySelector('p')!.textContent, 'Hello, world!');
  });

  test('control: leaves an ordinary template inert', () => {
    render(
      html`<div>
        <template><span>Inert content</span></template>
      </div>`,
      container
    );
    const host = container.querySelector('div')!;
    assert.isNull(host.shadowRoot);
    assert.equal(
      host.querySelector('template')!.content.querySelector('span')!
        .textContent,
      'Inert content'
    );
  });

  test('creates a shadow root even when the template has no expressions', () => {
    render(
      html`<div>
        <template shadowrootmode="open"><p>Shadow content</p></template>
      </div>`,
      container
    );
    const host = container.querySelector('div')!;
    assert.isNotNull(host.shadowRoot, 'DSD should create a shadow root');
    assert.equal(
      host.shadowRoot!.querySelector('p')!.textContent,
      'Shadow content'
    );
    assert.isNull(
      host.querySelector('template'),
      'DSD template should be consumed'
    );
  });

  test('renders and updates expressions without replacing the host or shadow nodes', () => {
    const view = (value: string) =>
      html`<div>
        <template shadowrootmode="open"
          ><p title=${value}>${value}</p></template
        >
      </div>`;
    render(view('first'), container);
    const host = container.querySelector('div')!;
    assert.isNotNull(host.shadowRoot);
    const root = host.shadowRoot!;
    const paragraph = root.querySelector('p')!;
    assert.equal(paragraph.textContent, 'first');
    assert.equal(paragraph.title, 'first');

    render(view('second'), container);
    assert.strictEqual(container.querySelector('div'), host);
    assert.strictEqual(host.shadowRoot, root);
    assert.strictEqual(root.querySelector('p'), paragraph);
    assert.equal(paragraph.textContent, 'second');
    assert.equal(paragraph.title, 'second');
  });

  test('keeps expression ordering across light DOM and shadow boundaries', () => {
    const view = (value: string) =>
      html`<p>${'before ' + value}</p>
        <div title=${'host ' + value}>
          <template shadowrootmode="open">
            <span title=${'attribute ' + value}>${'shadow ' + value}</span>
          </template>
          <b>${'light ' + value}</b>
        </div>
        <p>${'after ' + value}</p>`;
    render(view('one'), container);
    render(view('two'), container);
    const host = container.querySelector('div')!;
    assert.equal(host.title, 'host two');
    assert.isNotNull(host.shadowRoot);
    const span = host.shadowRoot!.querySelector('span')!;
    assert.equal(span.title, 'attribute two');
    assert.equal(span.textContent, 'shadow two');
    assert.equal(host.querySelector('b')!.textContent, 'light two');
    assert.deepEqual(
      Array.from(container.querySelectorAll('p'), (node) => node.textContent),
      ['before two', 'after two']
    );
  });

  test('creates independent shadow trees when a cached template is cloned twice', () => {
    const view = (value: string) =>
      html`<div>
        <template shadowrootmode="open"><p>${value}</p></template>
      </div>`;
    render(html`${[view('one'), view('two')]}`, container);
    const hosts = container.querySelectorAll('div');
    assert.lengthOf(hosts, 2);
    assert.isNotNull(hosts[0].shadowRoot);
    assert.isNotNull(hosts[1].shadowRoot);
    assert.notStrictEqual(hosts[0].shadowRoot, hosts[1].shadowRoot);
    assert.equal(hosts[0].shadowRoot!.querySelector('p')!.textContent, 'one');
    assert.equal(hosts[1].shadowRoot!.querySelector('p')!.textContent, 'two');
  });

  test('preserves child-part boundaries next to a consumed DSD template', () => {
    const view = (value: string) =>
      html`<div>
        ${'before ' + value}<template shadowrootmode="open"
          ><span>${'shadow ' + value}</span></template
        >${'after ' + value}
      </div>`;
    render(view('one'), container);
    render(view('two'), container);
    const host = container.querySelector('div')!;
    assert.equal(host.textContent?.trim(), 'before twoafter two');
    assert.isNotNull(host.shadowRoot);
    assert.equal(
      host.shadowRoot!.querySelector('span')!.textContent,
      'shadow two'
    );
  });

  test('handles nested declarative shadow roots and updates their bindings', () => {
    const view = (value: string) =>
      html`<div>
        <template shadowrootmode="open">
          <section>
            <template shadowrootmode="open"><p>${value}</p></template>
          </section>
        </template>
      </div>`;
    render(view('one'), container);
    const outer = container.querySelector('div')!.shadowRoot;
    assert.isNotNull(outer);
    const inner = outer!.querySelector('section')!.shadowRoot;
    assert.isNotNull(inner);
    const paragraph = inner!.querySelector('p')!;
    assert.equal(paragraph.textContent, 'one');
    render(view('two'), container);
    assert.strictEqual(inner!.querySelector('p'), paragraph);
    assert.equal(paragraph.textContent, 'two');
  });
});
