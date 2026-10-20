import { MultiAttributePart, SingleAttributePart } from './attribute-part.js';
import { nothing } from './sentinels.js';
import { TemplatePart } from './template-part.js';
export class MultiPropertyPart extends MultiAttributePart {
    commitValue(value) {
        this.element[this.name] = value === nothing ? undefined : value;
    }
    clone(node) {
        return new MultiPropertyPart(node, this.name, this.strings);
    }
}
export class SinglePropertyPart extends SingleAttributePart {
    commitValue(value) {
        this.element[this.name] = value === nothing ? undefined : value;
    }
    clone(node) {
        return new SinglePropertyPart(node, this.name);
    }
}
//# sourceMappingURL=property-part.js.map