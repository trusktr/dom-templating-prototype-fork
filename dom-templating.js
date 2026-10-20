/* DOM Templating prototype: Justin Fagnani; derived from Google LLC lit-html.
 * BSD-3-Clause: see the accompanying LICENSE and upstream README. */

// output/packages/dom-templating-prototype/lib/template-result.js
var html = (strings, ...values) => new TemplateResult("html", strings, values);
var svg = (strings, ...values) => new TemplateResult("svg", strings, values);
var mathml = (strings, ...values) => new TemplateResult("mathml", strings, values);
var TemplateResult = class {
  static HTML_RESULT = "html";
  static SVG_RESULT = "svg";
  static MATHML_RESULT = "mathml";
  kind;
  strings;
  values;
  constructor(kind, strings, values) {
    this.kind = kind;
    this.strings = strings;
    this.values = values;
  }
};

// output/packages/dom-templating-prototype/lib/sentinels.js
var noChange = /* @__PURE__ */ Symbol("noChange");
var nothing = /* @__PURE__ */ Symbol("nothing");

// output/packages/dom-templating-prototype/lib/directive.js
var DirectiveResult = class {
  directiveClass;
  /**
   * The values passed to the directive function invocation.
   */
  values;
  constructor(directiveClass, values) {
    this.directiveClass = directiveClass;
    this.values = values;
  }
};
var evaluateWithDirectives = (value, part, directives, index = 0, fromDirective) => {
  if (value === noChange) {
    return value;
  }
  if (value instanceof DirectiveResult || fromDirective) {
    let directive = directives[index];
    if (value instanceof DirectiveResult) {
      if (directive === void 0 || !(directive.constructor === value.directiveClass)) {
        directive?.disconnectedCallback?.();
        directive = directives[index] = new value.directiveClass(part, index);
        directive.connectedCallback?.();
      }
      value = directive.update(...value.values);
    }
    value = evaluateWithDirectives(value, part, directives, index + 1);
  } else {
    for (let i = index; i < directives.length; i++) {
      const directive = directives[i];
      directive.disconnectedCallback?.();
    }
    directives.length = index;
  }
  return value;
};

// output/packages/dom-templating-prototype/lib/template-part.js
var TemplatePart = class {
};

// output/packages/dom-templating-prototype/lib/utils.js
var isPrimitive = (value) => value === null || typeof value != "object" && typeof value != "function";
var isIterable = (value) => Array.isArray(value) || // eslint-disable-next-line @typescript-eslint/no-explicit-any
typeof value?.[Symbol.iterator] === "function";
var createMarker = () => document.createComment("?node-part");

// output/packages/dom-templating-prototype/lib/attribute-part.js
var SingleAttributePart = class _SingleAttributePart extends TemplatePart {
  element;
  name;
  #committedValue;
  #directives = [];
  constructor(node, name, strings) {
    super();
    if (strings !== void 0 && !(strings.length === 2 && strings[0] === "" && strings[1] === "")) {
      throw new Error("Invalid strings for SingleAttributePart");
    }
    this.element = node;
    this.name = name;
    this.#committedValue = nothing;
  }
  setValue(value) {
    value = evaluateWithDirectives(value, this, this.#directives);
    if (!isPrimitive(value) || value !== this.#committedValue && value !== noChange) {
      this.#committedValue = value;
      this.commitValue(value);
    }
  }
  setConnected(connected) {
    for (const directive of this.#directives) {
      if (connected) {
        directive.connectedCallback?.();
      } else {
        directive.disconnectedCallback?.();
      }
    }
  }
  commitValue(value) {
    if (value === nothing) {
      this.element.removeAttribute(this.name);
    } else {
      this.element.setAttribute(this.name, value ?? "");
    }
  }
  clone(node) {
    return new _SingleAttributePart(node, this.name);
  }
};
var MultiAttributePart = class _MultiAttributePart extends TemplatePart {
  element;
  name;
  strings;
  #childParts;
  constructor(node, name, strings) {
    super();
    if (strings.length === 2 && strings[0] === "" && strings[1] === "") {
      throw new Error("Invalid strings for MultiAttributePart");
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
      } else if (value !== nothing) {
        value += (v ?? "") + strings[i + 1];
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
    } else {
      this.element.setAttribute(this.name, value ?? "");
    }
  }
  clone(node) {
    return new _MultiAttributePart(node, this.name, this.strings);
  }
};
var PartialAttributePart = class extends TemplatePart {
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
    const newValues = Array.from({ length: this.#parent.strings.length - 1 }, () => noChange);
    newValues[this.#index] = value;
    this.#parent.setValue(newValues);
  }
  setConnected(connected) {
    for (const directive of this.#directives) {
      if (connected) {
        directive.connectedCallback?.();
      } else {
        directive.disconnectedCallback?.();
      }
    }
  }
  /** @internal */
  _setValue(value) {
    value = evaluateWithDirectives(value, this, this.#directives);
    const changed = !isPrimitive(value) || value !== this.#committedValue && value !== noChange;
    if (changed) {
      this.#committedValue = value;
    }
    return changed;
  }
  getValue() {
    return this.#committedValue;
  }
  clone(_node) {
    throw new Error("PartialAttributePart cannot be cloned");
  }
};

// output/packages/dom-templating-prototype/lib/template-instance.js
var TemplateInstance = class {
  template;
  parts;
  constructor(template, parts) {
    this.template = template;
    this.parts = parts;
  }
  update(values) {
    let i = 0;
    for (const part of this.parts) {
      if (part instanceof MultiAttributePart) {
        const end = i + part.strings.length - 1;
        part.setValue(values.slice(i, end));
        i = end;
      } else {
        part.setValue(values[i]);
        i++;
      }
    }
  }
  setConnected(connected) {
    for (const part of this.parts) {
      part.setConnected(connected);
    }
  }
};

// output/packages/dom-templating-prototype/lib/boolean-attribute-part.js
var BooleanAttributePart = class _BooleanAttributePart extends SingleAttributePart {
  commitValue(value) {
    this.element.toggleAttribute(this.name, !!value && value !== nothing);
  }
  clone(node) {
    return new _BooleanAttributePart(node, this.name);
  }
};

// output/packages/dom-templating-prototype/lib/comment-part.js
var CommentPart = class _CommentPart extends TemplatePart {
  node;
  constructor(node) {
    super();
    this.node = node;
  }
  clone(node) {
    return new _CommentPart(node);
  }
  setValue(value) {
    value;
  }
  setConnected(_connected) {
    throw new Error("Not implemented: CommentPart.setConnected");
  }
};

// output/packages/dom-templating-prototype/lib/element-part.js
var ElementPart = class _ElementPart extends TemplatePart {
  element;
  #directives = [];
  constructor(element) {
    super();
    this.element = element;
  }
  clone(node) {
    return new _ElementPart(node);
  }
  setValue(value) {
    evaluateWithDirectives(value, this, this.#directives);
  }
  setConnected(connected) {
    for (const directive of this.#directives) {
      if (connected) {
        directive.connectedCallback?.();
      } else {
        directive.disconnectedCallback?.();
      }
    }
  }
};

// output/packages/dom-templating-prototype/lib/event-part.js
var EventPart = class _EventPart extends SingleAttributePart {
  #committedValue = nothing;
  #directives = [];
  setValue(newListener) {
    if (newListener === noChange) {
      return;
    }
    newListener = evaluateWithDirectives(newListener, this, this.#directives) ?? nothing;
    const oldListener = this.#committedValue;
    const shouldRemoveListener = newListener === nothing && oldListener !== nothing || newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive;
    const shouldAddListener = newListener !== nothing && (oldListener === nothing || shouldRemoveListener);
    if (shouldRemoveListener) {
      this.element.removeEventListener(this.name, this, oldListener);
    }
    if (shouldAddListener) {
      this.element.addEventListener(this.name, this, newListener);
    }
    this.#committedValue = newListener;
  }
  handleEvent(event) {
    let host = this.element;
    const rootNode = this.element.getRootNode();
    if (rootNode instanceof ShadowRoot) {
      host = rootNode.host;
    }
    if (typeof this.#committedValue === "function") {
      this.#committedValue.call(host, event);
    } else {
      this.#committedValue.handleEvent(event);
    }
  }
  clone(node) {
    return new _EventPart(node, this.name);
  }
};

// output/packages/dom-templating-prototype/lib/get-template-html.js
var boundAttributeSuffix = "$bound$";
var marker = `node-part`;
var markerMatch = "?" + marker;
var nodeMarker = `<${markerMatch}>`;
var SPACE_CHAR = `[ 	
\f\r]`;
var ATTR_VALUE_CHAR = `[^ 	
\f\r"'\`<>=]`;
var NAME_CHAR = `[^\\s"'>=/]`;
var textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var COMMENT_START = 1;
var TAG_NAME = 2;
var DYNAMIC_TAG_NAME = 3;
var commentEndRegex = /-->/g;
var comment2EndRegex = />/g;
var tagEndRegex = new RegExp(`>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`, "g");
var ENTIRE_MATCH = 0;
var ATTRIBUTE_NAME = 1;
var SPACES_AND_EQUALS = 2;
var QUOTE_CHAR = 3;
var singleQuoteAttrEndRegex = /'/g;
var doubleQuoteAttrEndRegex = /"/g;
var rawTextElement = /^(?:script|style|textarea|title)$/i;
var getTemplateHtml = (strings, kind) => {
  const l = strings.length - 1;
  const attributeNames = [];
  let html2 = kind === "svg" ? "<svg>" : kind === "mathml" ? "<math>" : "";
  let rawTextEndRegex;
  let regex = textEndRegex;
  for (let i = 0; i < l; i++) {
    const s = strings[i];
    let attrNameEndIndex = -1;
    let attrName;
    let lastIndex = 0;
    let match;
    while (lastIndex < s.length) {
      regex.lastIndex = lastIndex;
      match = regex.exec(s);
      if (match === null) {
        break;
      }
      lastIndex = regex.lastIndex;
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === "!--") {
          regex = commentEndRegex;
        } else if (match[COMMENT_START] !== void 0) {
          regex = comment2EndRegex;
        } else if (match[TAG_NAME] !== void 0) {
          if (rawTextElement.test(match[TAG_NAME])) {
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, "g");
          }
          regex = tagEndRegex;
        } else if (match[DYNAMIC_TAG_NAME] !== void 0) {
          throw new Error("Bindings in tag names are not supported.");
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === ">") {
          regex = rawTextEndRegex ?? textEndRegex;
          attrNameEndIndex = -1;
        } else if (match[ATTRIBUTE_NAME] === void 0) {
          attrNameEndIndex = -2;
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
          attrName = match[ATTRIBUTE_NAME];
          regex = match[QUOTE_CHAR] === void 0 ? tagEndRegex : match[QUOTE_CHAR] === '"' ? doubleQuoteAttrEndRegex : singleQuoteAttrEndRegex;
        }
      } else if (regex === doubleQuoteAttrEndRegex || regex === singleQuoteAttrEndRegex) {
        regex = tagEndRegex;
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex;
      } else {
        regex = tagEndRegex;
        rawTextEndRegex = void 0;
      }
    }
    console.assert(attrNameEndIndex === -1 || regex === tagEndRegex || regex === singleQuoteAttrEndRegex || regex === doubleQuoteAttrEndRegex, "unexpected parse state B");
    const end = regex === tagEndRegex && strings[i + 1].startsWith("/>") ? " " : "";
    html2 += regex === textEndRegex ? s + nodeMarker : attrNameEndIndex >= 0 ? (attributeNames.push(attrName), s.slice(0, attrNameEndIndex) + boundAttributeSuffix + s.slice(attrNameEndIndex)) + marker + end : s + marker + (attrNameEndIndex === -2 ? i : end);
  }
  html2 += // Add a node at the end of the template if the last string is empty so
  // we have a marker node for the end node of the ChildPart
  (strings[l] || "<?>") + (kind === "svg" ? "</svg>" : kind === "mathml" ? "</math>" : "");
  return { html: html2, attributeNames };
};

// output/packages/dom-templating-prototype/lib/property-part.js
var MultiPropertyPart = class _MultiPropertyPart extends MultiAttributePart {
  commitValue(value) {
    this.element[this.name] = value === nothing ? void 0 : value;
  }
  clone(node) {
    return new _MultiPropertyPart(node, this.name, this.strings);
  }
};
var SinglePropertyPart = class _SinglePropertyPart extends SingleAttributePart {
  commitValue(value) {
    this.element[this.name] = value === nothing ? void 0 : value;
  }
  clone(node) {
    return new _SinglePropertyPart(node, this.name);
  }
};

// output/packages/dom-templating-prototype/lib/template.js
var walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
var markerMatch2 = "?" + marker;
var isElement = (node) => node.nodeType === Node.ELEMENT_NODE;
var isComment = (node) => node.nodeType === Node.COMMENT_NODE;
var htmlTemplateCache = /* @__PURE__ */ new WeakMap();
var svgTemplateCache = /* @__PURE__ */ new WeakMap();
var mathmlTemplateCache = /* @__PURE__ */ new WeakMap();
var getTemplate = (result) => {
  const kind = result.kind;
  let template;
  let templateCache = kind === TemplateResult.HTML_RESULT ? htmlTemplateCache : kind === TemplateResult.SVG_RESULT ? svgTemplateCache : mathmlTemplateCache;
  template = templateCache.get(result.strings);
  if (template === void 0) {
    template = new Template(result);
    templateCache.set(result.strings, template);
  }
  return template;
};
var Template = class {
  element;
  parts = [];
  constructor(templateResult) {
    const { strings, kind } = templateResult;
    let node;
    let nodeIndex = 0;
    let attrNameIndex = 0;
    const partCount = strings.length - 1;
    const parts = this.parts;
    const { html: html2, attributeNames } = getTemplateHtml(strings, kind);
    const el = this.element = document.createElement("template");
    el.innerHTML = html2;
    walker.currentNode = this.element.content;
    if (kind === TemplateResult.SVG_RESULT || kind === TemplateResult.MATHML_RESULT) {
      const wrapper = this.element.content.firstChild;
      wrapper.replaceWith(...wrapper.childNodes);
    }
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (isElement(node)) {
        const tag = node.localName;
        if (tag === "textarea" || tag === "template" && node.innerHTML.includes(marker)) {
          throw new Error(`Expressions are not supported inside \`${tag}\` elements.`);
        }
        if (node.hasAttributes()) {
          for (const attributeName of node.getAttributeNames()) {
            if (attributeName.endsWith(boundAttributeSuffix)) {
              const sourceName = attributeNames[attrNameIndex++];
              const value = node.getAttribute(attributeName);
              const statics = value.split(marker);
              const isSingleValueBinding = statics.length === 2 && statics[0] === "" && statics[1] === "";
              const [, sigil, name] = /([.?@])?(.*)/.exec(sourceName);
              const partConstructor = sigil === "." ? isSingleValueBinding ? SinglePropertyPart : MultiPropertyPart : sigil === "?" ? BooleanAttributePart : sigil === "@" ? EventPart : isSingleValueBinding ? SingleAttributePart : MultiAttributePart;
              parts.push({
                part: new partConstructor(node, name, statics),
                index: nodeIndex
              });
              node.removeAttribute(attributeName);
            } else if (attributeName.startsWith(marker)) {
              parts.push({
                part: new ElementPart(node),
                index: nodeIndex
              });
              node.removeAttribute(attributeName);
            }
          }
        }
        if (tag === "script" || tag === "style" || tag === "title") {
          const strings2 = node.textContent.split(marker);
          const lastIndex = strings2.length - 1;
          if (lastIndex > 0) {
            node.textContent = "";
            for (let i = 0; i < lastIndex; i++) {
              node.append(strings2[i], createMarker());
              walker.nextNode();
              parts.push({
                part: new ChildPart(node, node.nextSibling),
                index: ++nodeIndex
              });
            }
            node.append(strings2[lastIndex], document.createComment(""));
          }
        }
      } else if (isComment(node)) {
        const data = node.data;
        if (data === markerMatch2) {
          parts.push({
            part: new ChildPart(node, node.nextSibling),
            index: nodeIndex
          });
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            parts.push({
              part: new CommentPart(node),
              index: nodeIndex
            });
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }
    if (attributeNames.length !== attrNameIndex) {
      throw new Error(`Detected duplicate attribute bindings. This occurs if your template has duplicate attributes on an element tag. For example "<input ?disabled=\${true} ?disabled=\${false}>" contains a duplicate "disabled" attribute. The error was detected in the following template: 
\`` + strings.join("${...}") + "`");
    }
    walker.currentNode = document;
  }
  clone() {
    const fragment = document.importNode(this.element.content, true);
    const partClones = [];
    walker.currentNode = fragment;
    let node = walker.nextNode();
    let nodeIndex = 0;
    let partIndex = 0;
    let nextTemplatePart = this.parts[0];
    while (nextTemplatePart !== void 0) {
      if (nodeIndex === nextTemplatePart.index) {
        partClones.push(nextTemplatePart.part.clone(node));
        nextTemplatePart = this.parts[++partIndex];
      }
      if (nodeIndex !== nextTemplatePart?.index) {
        node = walker.nextNode();
        nodeIndex++;
      }
    }
    walker.currentNode = document;
    const instance = new TemplateInstance(this, partClones);
    return { instance, fragment };
  }
};

// output/packages/dom-templating-prototype/lib/child-part.js
var _a;
var ChildPart = class extends TemplatePart {
  #committedValue = nothing;
  #directives = [];
  /**
   * The part's leading marker node, if any. See `.parentNode` for more
   * information.
   */
  startNode;
  /**
   * The part's trailing marker node, if any. See `.parentNode` for more
   * information.
   */
  endNode;
  constructor(startNode, endNode = null) {
    super();
    this.startNode = startNode;
    this.endNode = endNode;
  }
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
  get parentNode() {
    return this.startNode.parentNode;
  }
  setValue(value, directiveIndex) {
    if (this.startNode === null || this.endNode !== null && this.startNode.parentNode !== this.endNode.parentNode) {
      throw new Error(`This ChildPart cannot accept a value. This likely means the element `);
    }
    value = evaluateWithDirectives(value, this, this.#directives, 0, directiveIndex !== void 0);
    if (isPrimitive(value)) {
      if (value === nothing || value == null || value === "") {
        if (this.#committedValue !== nothing) {
          this.#clear();
        }
        this.#committedValue = nothing;
      } else if (value !== this.#committedValue && value !== noChange) {
        this.#commitText(value);
      }
    } else if (value instanceof TemplateResult) {
      this.#commitTemplateResult(value);
    } else if (value.nodeType !== void 0) {
      this.#commitNode(value);
    } else if (isIterable(value)) {
      this.#commitIterable(value);
    } else {
      this.#commitText(value);
    }
  }
  setConnected(connected) {
    if (this.#committedValue instanceof TemplateInstance) {
      this.#committedValue.setConnected(connected);
    }
    for (const directive of this.#directives) {
      if (connected) {
        directive.connectedCallback?.();
      } else {
        directive.disconnectedCallback?.();
      }
    }
  }
  clone(node) {
    return new _a(node, node.nextSibling);
  }
  #insert(node) {
    return this.startNode.parentNode.insertBefore(node, this.endNode);
  }
  #commitNode(value) {
    if (this.#committedValue !== value) {
      this.#clear();
      this.#committedValue = this.#insert(value);
    }
  }
  #commitText(value) {
    if (this.#committedValue !== nothing && isPrimitive(this.#committedValue)) {
      const node = this.startNode.nextSibling;
      node.data = value;
    } else {
      this.#commitNode(document.createTextNode(value));
    }
    this.#committedValue = value;
  }
  #commitTemplateResult(result) {
    const { values } = result;
    const template = getTemplate(result);
    if (this.#committedValue instanceof TemplateInstance && this.#committedValue.template === template) {
      this.#committedValue.update(values);
    } else {
      const { instance, fragment } = template.clone();
      instance.update(values);
      this.#commitNode(fragment);
      this.#committedValue = instance;
    }
  }
  #commitIterable(value) {
    if (!Array.isArray(this.#committedValue)) {
      this.#committedValue = [];
      this.#clear();
    }
    const itemParts = this.#committedValue;
    let partIndex = 0;
    let itemPart;
    for (const item of value) {
      if (partIndex === itemParts.length) {
        itemParts.push(itemPart = new _a(this.#insert(createMarker()), this.#insert(createMarker())));
      } else {
        itemPart = itemParts[partIndex];
      }
      itemPart.setValue(item);
      partIndex++;
    }
    if (partIndex < itemParts.length) {
      this.#clear(itemPart && itemPart.endNode.nextSibling);
      for (let i = partIndex; i < itemParts.length; i++) {
        itemParts[i].setConnected(false);
      }
      itemParts.length = partIndex;
    }
  }
  /**
   * Removes the nodes contained within this Part from the DOM.
   *
   * @param start Start node to clear from, for clearing a subset of the part's
   *     DOM (used when truncating iterables)
   */
  #clear(start = this.startNode.nextSibling) {
    if (this.#committedValue instanceof TemplateInstance) {
      this.#committedValue.setConnected(false);
    }
    if (this.endNode !== null && start?.parentNode !== this.endNode?.parentNode) {
      throw new Error("Invalid ChildPart anchor nodes");
    }
    while (start !== this.endNode) {
      const n = start.nextSibling;
      start.remove();
      start = n;
    }
  }
};
_a = ChildPart;

// output/packages/dom-templating-prototype/lib/render.js
var rootParts = /* @__PURE__ */ new WeakMap();
var render = (result, container) => {
  if (!(container instanceof Element || container instanceof DocumentFragment)) {
    throw new Error("Container must be an Element or DocumentFragment");
  }
  let part = rootParts.get(container);
  if (part === void 0) {
    const startNode = createMarker();
    container.append(startNode);
    part = new ChildPart(startNode);
    rootParts.set(container, part);
  }
  part.setValue(result);
  return part;
};

// output/packages/dom-templating-prototype/index.js
var DOMTemplate = {
  html,
  svg,
  mathml
};
export {
  DOMTemplate,
  html,
  mathml,
  render,
  svg
};
//# sourceMappingURL=dom-templating.js.map
