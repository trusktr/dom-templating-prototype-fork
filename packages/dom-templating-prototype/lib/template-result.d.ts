export declare const html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
export declare const svg: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
export declare const mathml: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
export type TemplateResultKind = 'html' | 'svg' | 'mathml';
export declare class TemplateResult {
    static readonly HTML_RESULT = "html";
    static readonly SVG_RESULT = "svg";
    static readonly MATHML_RESULT = "mathml";
    readonly kind: TemplateResultKind;
    readonly strings: TemplateStringsArray;
    readonly values: ReadonlyArray<unknown>;
    constructor(kind: TemplateResultKind, strings: TemplateStringsArray, values: ReadonlyArray<unknown>);
}
//# sourceMappingURL=template-result.d.ts.map