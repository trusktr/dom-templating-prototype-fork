import { SingleAttributePart } from './attribute-part.js';
import { evaluateWithDirectives } from './directive.js';
import { noChange, nothing } from './sentinels.js';
import { TemplatePart } from './template-part.js';
export class EventPart extends SingleAttributePart {
    #committedValue = nothing;
    #directives = [];
    setValue(newListener) {
        if (newListener === noChange) {
            return;
        }
        newListener =
            evaluateWithDirectives(newListener, this, this.#directives) ?? nothing;
        const oldListener = this.#committedValue;
        // If the new value is nothing or any options change we have to remove the
        // part as a listener.
        const shouldRemoveListener = (newListener === nothing && oldListener !== nothing) ||
            newListener.capture !==
                oldListener.capture ||
            newListener.once !==
                oldListener.once ||
            newListener.passive !==
                oldListener.passive;
        // If the new value is not nothing and we removed the listener, we have
        // to add the part as a listener.
        const shouldAddListener = newListener !== nothing &&
            (oldListener === nothing || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.name, this, oldListener);
        }
        if (shouldAddListener) {
            this.element.addEventListener(this.name, this, newListener);
        }
        this.#committedValue = newListener;
    }
    handleEvent(event) {
        let host = this.element;
        const rootNode = this.element.getRootNode();
        if (rootNode instanceof ShadowRoot) {
            host = rootNode.host;
        }
        if (typeof this.#committedValue === 'function') {
            this.#committedValue.call(host, event);
        }
        else {
            this.#committedValue.handleEvent(event);
        }
    }
    clone(node) {
        return new EventPart(node, this.name);
    }
}
//# sourceMappingURL=event-part.js.map