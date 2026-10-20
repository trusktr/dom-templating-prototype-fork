import { TemplatePart } from './template-part.js';
// TODO: Make comment parts do something reasonable. Likely they should behave
// like MultiAttributeParts and have static strings and one or more bindings.
export class CommentPart extends TemplatePart {
    node;
    constructor(node) {
        super();
        this.node = node;
    }
    clone(node) {
        return new CommentPart(node);
    }
    setValue(value) {
        value;
    }
    setConnected(_connected) {
        throw new Error('Not implemented: CommentPart.setConnected');
    }
}
//# sourceMappingURL=comment-part.js.map