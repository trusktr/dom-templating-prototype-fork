export const isPrimitive = (value) => value === null || (typeof value != 'object' && typeof value != 'function');
export const isIterable = (value) => Array.isArray(value) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof value?.[Symbol.iterator] === 'function';
// Creates a dynamic marker. We never have to search for these in the DOM.
export const createMarker = () => document.createComment('?node-part');
//# sourceMappingURL=utils.js.map