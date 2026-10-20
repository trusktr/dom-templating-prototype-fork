import { TemplatePart } from './template-part.js';
export declare class ElementPart extends TemplatePart {
    #private;
    readonly element: Element;
    constructor(element: Element);
    clone(node: Node): TemplatePart;
    setValue(value: unknown): void;
    setConnected(connected: boolean): void;
}
//# sourceMappingURL=element-part.d.ts.map