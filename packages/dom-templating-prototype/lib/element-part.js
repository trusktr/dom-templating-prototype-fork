import { Directive, evaluateWithDirectives } from './directive.js';
import { TemplatePart } from './template-part.js';
export class ElementPart extends TemplatePart {
    element;
    #directives = [];
    constructor(element) {
        super();
        this.element = element;
    }
    clone(node) {
        return new ElementPart(node);
    }
    setValue(value) {
        evaluateWithDirectives(value, this, this.#directives);
    }
    setConnected(connected) {
        for (const directive of this.#directives) {
            if (connected) {
                directive.connectedCallback?.();
            }
            else {
                directive.disconnectedCallback?.();
            }
        }
    }
}
//# sourceMappingURL=element-part.js.map