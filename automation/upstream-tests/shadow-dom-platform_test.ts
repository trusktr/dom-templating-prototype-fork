import {assert} from 'chai';

// Platform checks for evaluating parser-only fixes, separate from render tests.
suite('declarative shadow DOM platform prerequisites', () => {
  const markup =
    '<div><template shadowrootmode="open"><span>shadow</span></template></div>';

  test('innerHTML does not activate declarative shadow roots', () => {
    const template = document.createElement('template');
    template.innerHTML = markup;
    assert.isNull(template.content.querySelector('div')!.shadowRoot);
    assert.isNotNull(template.content.querySelector('template'));
  });

  test('setHTMLUnsafe activates DSD, but importNode drops non-clonable roots', () => {
    const template = document.createElement('template');
    template.setHTMLUnsafe(markup);
    const host = template.content.querySelector('div')!;
    assert.equal(host.shadowRoot!.textContent, 'shadow');
    assert.isNull(host.querySelector('template'));
    const clone = document.importNode(template.content, true);
    assert.isNull(clone.querySelector('div')!.shadowRoot);
  });

  test('clonable roots survive importNode but TreeWalker does not enter them', () => {
    const template = document.createElement('template');
    template.setHTMLUnsafe(
      markup.replace(
        'shadowrootmode="open"',
        'shadowrootmode="open" shadowrootclonable'
      )
    );
    const clone = document.importNode(template.content, true);
    assert.equal(clone.querySelector('div')!.shadowRoot!.textContent, 'shadow');
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
    );
    const visited: Node[] = [];
    let node: Node | null;
    while ((node = walker.nextNode()) !== null) visited.push(node);
    assert.lengthOf(visited, 1, 'Only the light-DOM host is visited');
    assert.strictEqual(visited[0], clone.querySelector('div'));
  });
});
