import type { TemplatePart } from './template-part.js';
import type { Template } from './template.js';
export declare class TemplateInstance {
    readonly template: Template;
    readonly parts: Array<TemplatePart>;
    constructor(template: Template, parts: Array<TemplatePart>);
    update(values: ReadonlyArray<unknown>): void;
    setConnected(connected: boolean): void;
}
//# sourceMappingURL=template-instance.d.ts.map