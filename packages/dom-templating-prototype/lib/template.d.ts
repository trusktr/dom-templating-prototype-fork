import { TemplateInstance } from './template-instance.js';
import type { TemplatePart } from './template-part.js';
import { TemplateResult } from './template-result.js';
export declare const getTemplate: (result: TemplateResult) => Template;
export declare class Template {
    element: HTMLTemplateElement;
    parts: Array<{
        part: TemplatePart;
        index: number;
    }>;
    constructor(templateResult: TemplateResult);
    clone(): {
        instance: TemplateInstance;
        fragment: DocumentFragment;
    };
}
//# sourceMappingURL=template.d.ts.map