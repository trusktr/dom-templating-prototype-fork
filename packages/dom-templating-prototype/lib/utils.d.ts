export type Primitive = null | undefined | boolean | number | string | symbol | bigint;
export declare const isPrimitive: (value: unknown) => value is Primitive;
export declare const isIterable: (value: unknown) => value is Iterable<unknown>;
export declare const createMarker: () => Comment;
//# sourceMappingURL=utils.d.ts.map