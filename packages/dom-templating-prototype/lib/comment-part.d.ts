import { TemplatePart } from './template-part.js';
export declare class CommentPart extends TemplatePart {
    readonly node: Comment;
    constructor(node: Comment);
    clone(node: Node): TemplatePart;
    setValue(value: unknown): void;
    setConnected(_connected: boolean): void;
}
//# sourceMappingURL=comment-part.d.ts.map