import {assert} from 'chai';
import {html, render} from '../index.js';

// Regressions for declarative shadow DOM in a rendered TemplateResult.
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

  test('keeps attribute names, multi-value bindings and expression order before DSD', () => {
    const view = (value: string) =>
      html`<div>
        <p title="light-${value}-${value}" .textContent=${'light ' + value}></p>
        <template shadowrootmode="open">
          <span
            title="shadow-${value}-${value}"
            .textContent=${'shadow ' + value}
          ></span>
        </template>
        <b title=${'after ' + value}>${'after ' + value}</b>
      </div>`;
    render(view('one'), container);
    render(view('two'), container);
    const host = container.querySelector('div')!;
    const light = host.querySelector('p')!;
    const shadow = host.shadowRoot!.querySelector('span')!;
    assert.equal(light.title, 'light-two-two');
    assert.equal(light.textContent, 'light two');
    assert.equal(shadow.title, 'shadow-two-two');
    assert.equal(shadow.textContent, 'shadow two');
    assert.equal(host.querySelector('b')!.title, 'after two');
    assert.equal(host.querySelector('b')!.textContent, 'after two');
  });

  test('updates event, boolean and property bindings inside shadow roots', () => {
    const clicked: string[] = [];
    const view = (value: string, disabled: boolean) =>
      html`<div>
        <template shadowrootmode="open">
          <button
            ?disabled=${disabled}
            @click=${() => clicked.push(value)}
            .title=${value}
          >
            ${value}
          </button>
        </template>
      </div>`;
    render(view('one', false), container);
    const button = container
      .querySelector('div')!
      .shadowRoot!.querySelector('button')!;
    button.click();
    assert.deepEqual(clicked, ['one']);
    render(view('two', true), container);
    assert.isTrue(button.disabled);
    assert.equal(button.title, 'two');
    assert.equal(button.textContent?.trim(), 'two');
    button.click();
    assert.deepEqual(clicked, ['one']);
    render(view('three', false), container);
    button.click();
    assert.deepEqual(clicked, ['one', 'three']);
  });

  test('updates raw-text style bindings inside shadow roots', () => {
    const view = (color: string) =>
      html`<div>
        <template shadowrootmode="open">
          <style>
            p {
              color: ${color};
            }
          </style>
          <p>Styled</p>
        </template>
      </div>`;
    render(view('royalblue'), container);
    const root = container.querySelector('div')!.shadowRoot!;
    const style = root.querySelector('style')!;
    const paragraph = root.querySelector('p')!;
    assert.equal(getComputedStyle(paragraph).color, 'rgb(65, 105, 225)');
    render(view('red'), container);
    assert.strictEqual(root.querySelector('style'), style);
    assert.equal(getComputedStyle(paragraph).color, 'rgb(255, 0, 0)');
  });

  test('never parses interpolated strings as shadow markup', () => {
    const value =
      '<template shadowrootmode="open"><p>Not markup</p></template>';
    render(
      html`<div>
        <template shadowrootmode="open"><p>${value}</p></template>
      </div>`,
      container
    );
    const root = container.querySelector('div')!.shadowRoot!;
    assert.equal(root.querySelector('p')!.textContent, value);
    assert.isNull(root.querySelector('template'));
  });

  test('does not rewrite template-looking text in style content or attributes', () => {
    const view = (value: string) =>
      html`<div data-markup='<template shadowrootmode="open">'>
        <template shadowrootmode="open">
          <style>
            /* <template shadowrootmode="open"> */
          </style>
          <p>${value}</p>
        </template>
      </div>`;
    render(view('one'), container);
    const host = container.querySelector('div')!;
    assert.equal(
      host.getAttribute('data-markup'),
      '<template shadowrootmode="open">'
    );
    const root = host.shadowRoot!;
    assert.equal(
      root.querySelector('style')!.textContent?.trim(),
      '/* <template shadowrootmode="open"> */'
    );
    assert.equal(root.querySelector('p')!.textContent, 'one');
  });

  test('respects DSD flags and explicit clonability', () => {
    render(
      html`<div>
        <template
          shadowrootmode="open"
          shadowrootclonable
          shadowrootdelegatesfocus
          shadowrootserializable
          ><p>${'flags'}</p></template
        >
      </div>`,
      container
    );
    const root = container.querySelector('div')!.shadowRoot!;
    assert.isTrue(root.clonable);
    assert.isTrue(root.delegatesFocus);
    assert.isTrue(root.serializable);
    assert.equal(root.querySelector('p')!.textContent, 'flags');
  });

  test('invalid shadow modes remain ordinary inert templates', () => {
    render(
      html`<div>
        <template shadowrootmode="invalid"><p>Inert</p></template>
      </div>`,
      container
    );
    const host = container.querySelector('div')!;
    assert.isNull(host.shadowRoot);
    assert.equal(
      host.querySelector('template')!.content.querySelector('p')!.textContent,
      'Inert'
    );
  });

  test('rejects closed roots explicitly instead of losing their bindings', () => {
    assert.throws(
      () =>
        render(
          html`<div>
            <template shadowrootmode="closed"><p>${'hidden'}</p></template>
          </div>`,
          container
        ),
      'Closed declarative shadow roots are not supported.'
    );
  });

  test('keeps ordinary templates inert even when their content contains native DSD', () => {
    render(
      html`<template
        ><div>
          <template shadowrootmode="closed"><p>Inert</p></template>
        </div></template
      >`,
      container
    );
    const content = container.querySelector('template')!.content;
    assert.isNull(content.querySelector('div')!.shadowRoot);
    assert.isNull(container.querySelector('div'));
    assert.isNull(
      content.querySelector('template'),
      'native parsing consumes DSD'
    );
  });

  test('preserves duplicate-attribute binding errors inside shadow trees', () => {
    assert.throws(
      () =>
        render(
          html`<div>
            <template shadowrootmode="open"
              ><p title=${'one'} title=${'two'}></p
            ></template>
          </div>`,
          container
        ),
      'Detected duplicate attribute bindings.'
    );
  });

  test('still rejects dynamic content inside ordinary inert templates', () => {
    assert.throws(
      () =>
        render(html`<template><p>${'not active'}</p></template>`, container),
      'Expressions are not supported inside `template` elements.'
    );
  });

  test('rejects bindings hidden inside DSD within an ordinary inert template', () => {
    assert.throws(
      () =>
        render(
          html`<template
            ><div>
              <template shadowrootmode="open">${'hidden'}</template>
            </div></template
          >`,
          container
        ),
      'Expressions are not supported inside `template` elements.'
    );
  });

  test('rejects bindings hidden in an unconsumed second DSD declaration', () => {
    assert.throws(
      () =>
        render(
          html`<div>
            <template shadowrootmode="open"></template>
            <template shadowrootmode="open"
              ><section>
                <template shadowrootmode="open">${'hidden'}</template>
              </section></template
            >
          </div>`,
          container
        ),
      'Expressions are not supported inside `template` elements.'
    );
  });

  test('rejects bindings in DSD declarations on invalid shadow hosts', () => {
    assert.throws(
      () =>
        render(
          html`<a><template shadowrootmode="open">${'hidden'}</template></a>`,
          container
        ),
      'Expressions are not supported inside `template` elements.'
    );
  });

  test('preserves meaningful leading newlines across native parser preprocessing', () => {
    render(
      html`<pre>${'before'}</pre>
        <div>
          <template shadowrootmode="open">
            <pre>

hello</pre
            >
            <textarea>

hello</textarea
            >
            <listing>

hello</listing
            >
          </template>
        </div>`,
      container
    );
    const root = container.querySelector('div')!.shadowRoot!;
    for (const tag of ['pre', 'textarea', 'listing']) {
      assert.equal(root.querySelector(tag)!.textContent, '\nhello');
    }
  });

  test('does not consume literal marker-prefixed attributes', () => {
    render(
      html`<div node-part-id="literal">
        <template shadowrootmode="open"
          ><p node-part-name="literal">${'shadow'}</p></template
        >
      </div>`,
      container
    );
    const host = container.querySelector('div')!;
    assert.equal(host.getAttribute('node-part-id'), 'literal');
    assert.equal(
      host.shadowRoot!.querySelector('p')!.getAttribute('node-part-name'),
      'literal'
    );
  });

  test('ignores unrelated roots created by custom-element constructors during cloning', () => {
    const tag = 'dsd-test-existing-root';
    if (!customElements.get(tag)) {
      customElements.define(
        tag,
        class extends HTMLElement {
          constructor() {
            super();
            const root = this.attachShadow({mode: 'open'});
            root.append(document.createElement('span'));
          }
        }
      );
    }
    const view = (value: string) =>
      html`<dsd-test-existing-root></dsd-test-existing-root>
        <p>${value}</p>`;
    render(view('one'), container);
    const paragraph = container.querySelector('p')!;
    render(view('two'), container);
    assert.strictEqual(container.querySelector('p'), paragraph);
    assert.equal(paragraph.textContent, 'two');
    assert.isNotNull(
      container.querySelector(tag)!.shadowRoot!.querySelector('span')
    );
  });

  test('does not rewrite template-looking script text', () => {
    render(
      html`<div>
        <template shadowrootmode="open"
          ><script type="text/plain">
            const example = '<template shadowrootmode="open">';
          </script>
          <p>${'safe'}</p></template
        >
      </div>`,
      container
    );
    const root = container.querySelector('div')!.shadowRoot!;
    assert.equal(
      root.querySelector('script')!.textContent?.trim(),
      `const example = '<template shadowrootmode="open">';`
    );
    assert.equal(root.querySelector('p')!.textContent, 'safe');
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
