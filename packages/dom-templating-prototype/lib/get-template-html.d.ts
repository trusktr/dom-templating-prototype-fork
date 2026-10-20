import type { TemplateResultKind } from './template-result.js';
export declare const boundAttributeSuffix = "$bound$";
export declare const marker = "node-part";
/**
 * Returns an HTML string for the given TemplateStringsArray and result type
 * (HTML or SVG), along with the case-sensitive bound attribute names in
 * template order. The HTML contains comment markers denoting the `ChildPart`s
 * and suffixes on bound attributes denoting the `AttributeParts`.
 *
 * @param strings template strings array
 * @param kind HTML or SVG
 * @return Array containing `[html, attrNames]` (array returned for terseness,
 *     to avoid object fields since this code is shared with non-minified SSR
 *     code)
 */
export declare const getTemplateHtml: (strings: TemplateStringsArray, kind: TemplateResultKind) => {
    html: string;
    attributeNames: ReadonlyArray<string>;
};
//# sourceMappingURL=get-template-html.d.ts.map