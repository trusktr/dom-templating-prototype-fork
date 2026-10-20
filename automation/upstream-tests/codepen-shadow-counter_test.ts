import {assert} from 'chai';
import {html, render} from '../index.js';

suite('CodePen declarative shadow DOM counter', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    container.id = 'demo';
    document.body.append(container);
  });

  teardown(() => {
    container.remove();
  });

  test('updates slotted light DOM and styled shadow DOM without replacing nodes', () => {
    let count = 0;
    // Advance the example's interval deterministically without leaving timers.
    function update() {
      render(
        html`
          <div>
            <template shadowrootmode="open">
              <slot></slot>

              <style>
                p {
                  color: royalblue;
                }
              </style>

              <p>Shadow DOM count: ${count}</p>
            </template>

            <p>Light DOM count: ${count}</p>
          </div>
        `,
        container
      );
    }

    update();
    const host = container.querySelector('div')!;
    const root = host.shadowRoot;
    assert.isNotNull(root);
    assert.isTrue(
      root!.clonable,
      'clonability should be implied by the renderer'
    );
    const shadowParagraph = root!.querySelector('p')!;
    const lightParagraph = host.querySelector('p')!;
    const slot = root!.querySelector('slot')!;

    for (count = 0; count <= 3; count++) {
      update();
      assert.strictEqual(container.querySelector('div'), host);
      assert.strictEqual(host.shadowRoot, root);
      assert.strictEqual(root!.querySelector('p'), shadowParagraph);
      assert.strictEqual(host.querySelector('p'), lightParagraph);
      assert.equal(shadowParagraph.textContent, `Shadow DOM count: ${count}`);
      assert.equal(lightParagraph.textContent, `Light DOM count: ${count}`);
      assert.deepEqual(slot.assignedElements(), [lightParagraph]);
      assert.equal(
        getComputedStyle(shadowParagraph).color,
        'rgb(65, 105, 225)'
      );
      assert.notEqual(
        getComputedStyle(lightParagraph).color,
        'rgb(65, 105, 225)'
      );
    }
    assert.isNull(
      host.querySelector('template'),
      'the declaration is consumed'
    );
  });
});
