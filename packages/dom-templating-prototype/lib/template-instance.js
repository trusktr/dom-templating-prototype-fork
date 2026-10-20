import { MultiAttributePart } from './attribute-part.js';
export class TemplateInstance {
    template;
    parts;
    constructor(template, parts) {
        this.template = template;
        this.parts = parts;
    }
    update(values) {
        let i = 0;
        for (const part of this.parts) {
            if (part instanceof MultiAttributePart) {
                const end = i + part.strings.length - 1;
                part.setValue(values.slice(i, end));
                i = end;
            }
            else {
                part.setValue(values[i]);
                i++;
            }
        }
    }
    setConnected(connected) {
        for (const part of this.parts) {
            part.setConnected(connected);
        }
    }
}
//# sourceMappingURL=template-instance.js.map