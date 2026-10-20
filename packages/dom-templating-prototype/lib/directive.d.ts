import type { TemplatePart } from './template-part.js';
export interface DirectiveClass {
    new (part: TemplatePart, index: number): Directive;
}
/**
 * This utility type extracts the signature of a directive class's update()
 * method so we can use it for the type of the generated directive function.
 */
export type DirectiveParameters<C extends Directive> = Parameters<C['update']>;
/**
 * The return type of a directive function. Directive functions created with
 * `makeDirective()` do not instantiate the directive class directly, but
 * return a DirectiveResult object that captures the function arguments.
 *
 * The directive class is instantiated later by the template engine when
 * the directive is applied to a template part, or reused when the
 * template is re-applied to a part that already has a directive instance of the
 * same class.
 *
 * DirectiveResults may be nested, meaning that when they're evaluated by
 * evaluateWithDirectives() they evaluate to another DirectiveResult, allowing
 * for a chain of directives to be applied to a single template part. Each
 * directive in the chain is preserved in the `directives` array of the part.
 */
export declare class DirectiveResult<C extends DirectiveClass = DirectiveClass> {
    readonly directiveClass: C;
    /**
     * The values passed to the directive function invocation.
     */
    readonly values: DirectiveParameters<InstanceType<C>>;
    constructor(directiveClass: C, values: DirectiveParameters<InstanceType<C>>);
}
/**
 * Base class for custom directives.
 */
export declare abstract class Directive {
    readonly part: TemplatePart;
    readonly index: number;
    constructor(part: TemplatePart, index: number);
    abstract update(...props: Array<unknown>): unknown;
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    /**
     * Sets the value of the directive and the part its attached to.
     *
     * Directives should only call this method asynchronously, outside of the
     * directive's `update()` call, since `setPart()` will overwrite the value
     * provided by outer directives. Prefer returning a value from `update()`
     * that will be passed to the next directive in the chain.
     */
    setValue(value: unknown): void;
}
/**
 * Creates a directive function from a Directive class. This function has the
 * same parameters as the directive class's `update()` method.
 */
export declare const makeDirective: <C extends DirectiveClass>(c: C) => (...values: DirectiveParameters<InstanceType<C>>) => DirectiveResult<C>;
/**
 * Evaluates a value, which may be a DirectiveResult, and updates the given
 * directive chain accordingly.
 *
 * @param value
 * @param part
 * @param directives The *mutable* array of directives that are currently
 *   attached to the part. This array is updated in place to reflect the
 *   current state of the directive chain. Directive instances that are no
 *   longer needed are removed from this array.
 * @param index
 * @param fromDirective
 * @returns
 */
export declare const evaluateWithDirectives: (value: unknown, part: TemplatePart, directives: Array<Directive>, index?: number, fromDirective?: boolean) => unknown;
//# sourceMappingURL=directive.d.ts.map