import { TemplatePart } from './template-part.js';
export declare class ChildPart extends TemplatePart {
    #private;
    /**
     * The part's leading marker node, if any. See `.parentNode` for more
     * information.
     */
    readonly startNode: ChildNode;
    /**
     * The part's trailing marker node, if any. See `.parentNode` for more
     * information.
     */
    readonly endNode: ChildNode | null;
    constructor(startNode: ChildNode, endNode?: ChildNode | null);
    /**
     * The parent node into which the part renders its content.
     *
     * A ChildPart's content consists of a range of adjacent child nodes of
     * `.parentNode`, possibly bordered by 'marker nodes' (`.startNode` and
     * `.endNode`).
     *
     * - If both `.startNode` and `.endNode` are non-null, then the part's content
     * consists of all siblings between `.startNode` and `.endNode`, exclusively.
     *
     * - If `.startNode` is non-null but `.endNode` is null, then the part's
     * content consists of all siblings following `.startNode`, up to and
     * including the last child of `.parentNode`. If `.endNode` is non-null, then
     * `.startNode` will always be non-null.
     *
     * - If both `.endNode` and `.startNode` are null, then the part's content
     * consists of all child nodes of `.parentNode`.
     */
    get parentNode(): Node;
    setValue(value: unknown, directiveIndex?: number): void;
    setConnected(connected: boolean): void;
    clone(node: Node): ChildPart;
}
//# sourceMappingURL=child-part.d.ts.map