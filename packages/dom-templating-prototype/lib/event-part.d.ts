import { SingleAttributePart } from './attribute-part.js';
import { TemplatePart } from './template-part.js';
export declare class EventPart extends SingleAttributePart {
    #private;
    setValue(newListener: unknown): void;
    handleEvent(event: Event): void;
    clone(node: Node): TemplatePart;
}
//# sourceMappingURL=event-part.d.ts.map