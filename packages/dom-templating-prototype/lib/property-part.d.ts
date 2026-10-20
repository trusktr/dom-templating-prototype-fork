import { MultiAttributePart, SingleAttributePart } from './attribute-part.js';
import { TemplatePart } from './template-part.js';
export declare class MultiPropertyPart extends MultiAttributePart {
    protected commitValue(value: unknown): void;
    clone(node: Node): TemplatePart;
}
export declare class SinglePropertyPart extends SingleAttributePart {
    protected commitValue(value: unknown): void;
    clone(node: Node): TemplatePart;
}
//# sourceMappingURL=property-part.d.ts.map