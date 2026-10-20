import { SingleAttributePart } from './attribute-part.js';
import { nothing } from './sentinels.js';
import { TemplatePart } from './template-part.js';
export class BooleanAttributePart extends SingleAttributePart {
    commitValue(value) {
        this.element.toggleAttribute(this.name, !!value && value !== nothing);
    }
    clone(node) {
        return new BooleanAttributePart(node, this.name);
    }
}
//# sourceMappingURL=boolean-attribute-part.js.map