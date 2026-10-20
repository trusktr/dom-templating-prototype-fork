export const html = (strings, ...values) => new TemplateResult('html', strings, values);
export const svg = (strings, ...values) => new TemplateResult('svg', strings, values);
export const mathml = (strings, ...values) => new TemplateResult('mathml', strings, values);
export class TemplateResult {
    static HTML_RESULT = 'html';
    static SVG_RESULT = 'svg';
    static MATHML_RESULT = 'mathml';
    kind;
    strings;
    values;
    constructor(kind, strings, values) {
        this.kind = kind;
        this.strings = strings;
        this.values = values;
    }
}
//# sourceMappingURL=template-result.js.map