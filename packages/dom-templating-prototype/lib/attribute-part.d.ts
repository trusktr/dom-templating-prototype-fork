import { TemplatePart } from './template-part.js';
/**
 * A part that represents an attribute binding with a single value - that is a
 * value that controls the entire attribute value, rather than an interpolation
 * with multiple values and static strings.
 */
export declare class SingleAttributePart extends TemplatePart {
    #private;
    readonly element: Element;
    readonly name: string;
    constructor(node: Element, name: string, strings?: ReadonlyArray<string>);
    setValue(value: unknown): void;
    setConnected(connected: boolean): void;
    protected commitValue(value: unknown): void;
    clone(node: Node): TemplatePart;
}
/**
 * A part that represents an attribute binding with multiple values - that is a
 * binding that interpolates between multiple values and static strings.
 */
export declare class MultiAttributePart extends TemplatePart {
    #private;
    readonly element: Element;
    readonly name: string;
    readonly strings: ReadonlyArray<string>;
    constructor(node: Element, name: string, strings: ReadonlyArray<string>);
    setValue(values: ReadonlyArray<unknown>): void;
    setConnected(connected: boolean): void;
    protected commitValue(value: unknown): void;
    clone(node: Node): TemplatePart;
}
export declare class PartialAttributePart extends TemplatePart {
    #private;
    constructor(parent: MultiAttributePart, index: number);
    get name(): string;
    setValue(value: unknown): void;
    setConnected(connected: boolean): void;
    getValue(): unknown;
    clone(_node: Node): TemplatePart;
}
//# sourceMappingURL=attribute-part.d.ts.map