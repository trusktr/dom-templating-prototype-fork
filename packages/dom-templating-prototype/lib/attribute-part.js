import { Directive, evaluateWithDirectives } from './directive.js';
import { noChange, nothing } from './sentinels.js';
import { TemplatePart } from './template-part.js';
import { isPrimitive } from './utils.js';
/**
 * A part that represents an attribute binding with a single value - that is a
 * value that controls the entire attribute value, rather than an interpolation
 * with multiple values and static strings.
 */
export class SingleAttributePart extends TemplatePart {
    element;
    name;
    #committedValue;
    #directives = [];
    constructor(node, name, strings) {
        super();
        if (strings !== undefined &&
            !(strings.length === 2 && strings[0] === '' && strings[1] === '')) {
            throw new Error('Invalid strings for SingleAttributePart');
        }
        this.element = node;
        this.name = name;
        this.#committedValue = nothing;
    }
    setValue(value) {
        value = evaluateWithDirectives(value, this, this.#directives);
        if (!isPrimitive(value) ||
            (value !== this.#committedValue && value !== noChange)) {
            this.#committedValue = value;
            this.commitValue(value);
        }
    }
    setConnected(connected) {
        for (const directive of this.#directives) {
            if (connected) {
                directive.connectedCallback?.();
            }
            else {
                directive.disconnectedCallback?.();
            }
        }
    }
    commitValue(value) {
        if (value === nothing) {
            this.element.removeAttribute(this.name);
        }
        else {
            this.element.setAttribute(this.name, (value ?? ''));
        }
    }
    clone(node) {
        return new SingleAttributePart(node, this.name);
    }
}
/**
 * A part that represents an attribute binding with multiple values - that is a
 * binding that interpolates between multiple values and static strings.
 */
export class MultiAttributePart extends TemplatePart {
    element;
    name;
    strings;
    #childParts;
    constructor(node, name, strings) {
        super();
        if (strings.length === 2 && strings[0] === '' && strings[1] === '') {
            throw new Error('Invalid strings for MultiAttributePart');
        }
        this.element = node;
        this.name = name;
        this.strings = strings;
        this.#childParts = Array.from({ length: strings.length - 1 }, (_, i) => new PartialAttributePart(this, i));
    }
    setValue(values) {
        const strings = this.strings;
        let change = false;
        let value = strings[0];
        for (let i = 0; i < values.length; i++) {
            const childPart = this.#childParts[i];
            const childChanged = childPart._setValue(values[i]);
            change ||= childChanged;
            const v = childPart.getValue();
            if (v === nothing) {
                value = nothing;
            }
            else if (value !== nothing) {
                value += (v ?? '') + strings[i + 1];
            }
        }
        if (change) {
            this.commitValue(value);
        }
    }
    setConnected(connected) {
        for (const child of this.#childParts) {
            child.setConnected(connected);
        }
    }
    commitValue(value) {
        if (value === nothing) {
            this.element.removeAttribute(this.name);
        }
        else {
            this.element.setAttribute(this.name, (value ?? ''));
        }
    }
    clone(node) {
        return new MultiAttributePart(node, this.name, this.strings);
    }
}
export class PartialAttributePart extends TemplatePart {
    #parent;
    #index;
    #committedValue = new String();
    #directives = [];
    constructor(parent, index) {
        super();
        this.#parent = parent;
        this.#index = index;
    }
    get name() {
        return this.#parent.name;
    }
    setValue(value) {
        // TODO: Do this more efficiently by only updating the value at the index
        // inside AttributePart.
        const newValues = Array.from({ length: this.#parent.strings.length - 1 }, () => noChange);
        newValues[this.#index] = value;
        this.#parent.setValue(newValues);
    }
    setConnected(connected) {
        for (const directive of this.#directives) {
            if (connected) {
                directive.connectedCallback?.();
            }
            else {
                directive.disconnectedCallback?.();
            }
        }
    }
    /** @internal */
    _setValue(value) {
        value = evaluateWithDirectives(value, this, this.#directives);
        const changed = !isPrimitive(value) ||
            (value !== this.#committedValue && value !== noChange);
        if (changed) {
            this.#committedValue = value;
        }
        return changed;
    }
    getValue() {
        return this.#committedValue;
    }
    clone(_node) {
        throw new Error('PartialAttributePart cannot be cloned');
    }
}
//# sourceMappingURL=attribute-part.js.map