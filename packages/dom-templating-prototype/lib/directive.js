import { noChange } from './sentinels.js';
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
export class DirectiveResult {
    directiveClass;
    /**
     * The values passed to the directive function invocation.
     */
    values;
    constructor(directiveClass, values) {
        this.directiveClass = directiveClass;
        this.values = values;
    }
}
/**
 * Base class for custom directives.
 */
export class Directive {
    part;
    index;
    constructor(part, index) {
        this.part = part;
        this.index = index;
    }
    /**
     * Sets the value of the directive and the part its attached to.
     *
     * Directives should only call this method asynchronously, outside of the
     * directive's `update()` call, since `setPart()` will overwrite the value
     * provided by outer directives. Prefer returning a value from `update()`
     * that will be passed to the next directive in the chain.
     */
    setValue(value) {
        // TODO: Parts should delegate the ability to call setValue() to the
        // directive, so that the part can revoke the ability when the directive
        // is disconnected. They can do this by passing a callback to the
        // directive constructor, which the directive can call to set the value.
        this.part.setValue(value, this.index);
    }
}
/**
 * Creates a directive function from a Directive class. This function has the
 * same parameters as the directive class's `update()` method.
 */
export const makeDirective = (c) => (...values) => new DirectiveResult(c, values);
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
export const evaluateWithDirectives = (value, part, directives, index = 0, fromDirective // TODO: remove this parameter
) => {
    // Bail early if the value is explicitly noChange. Note, this means any
    // nested directive is still attached and is not run.
    if (value === noChange) {
        return value;
    }
    if (value instanceof DirectiveResult || fromDirective) {
        // If fromDirective is true, we just assume that the call is from the
        // directive at `index`. This is dangerous and we should refactor the
        // part / directive interface to avoid this.
        let directive = directives[index];
        if (value instanceof DirectiveResult) {
            if (directive === undefined ||
                !(directive.constructor === value.directiveClass)) {
                // If the directive is not the same as the previous one, we need to
                // create a new directive instance.
                // First, if the current directive is already defined, we need to
                // disconnect it before replacing it.
                directive?.disconnectedCallback?.();
                directive = directives[index] =
                    new value.directiveClass(part, index);
                directive.connectedCallback?.();
            }
            value = directive.update(...value.values);
        }
        value = evaluateWithDirectives(value, part, directives, index + 1);
    }
    else {
        for (let i = index; i < directives.length; i++) {
            const directive = directives[i];
            directive.disconnectedCallback?.();
        }
        directives.length = index;
    }
    return value;
};
//# sourceMappingURL=directive.js.map