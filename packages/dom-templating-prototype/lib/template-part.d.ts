export declare abstract class TemplatePart {
    abstract clone(node: Node): TemplatePart;
    abstract setValue(value: unknown, directiveIndex?: number): void;
    abstract setConnected(connected: boolean): void;
}
//# sourceMappingURL=template-part.d.ts.map