"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArray = void 0;
exports.isDocument = isDocument;
exports.isDocumentFragment = isDocumentFragment;
exports.isElement = isElement;
exports.isNonEmptyString = isNonEmptyString;
exports.isTextNode = isTextNode;
exports.clamp = clamp;
exports.copy = copy;
exports.isBoolean = isBoolean;
exports.isFunction = isFunction;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isString = isString;
const NodeType_js_1 = require("./definitions/NodeType.js");
function isDocument(node) {
    return node && node.nodeType === NodeType_js_1.NodeType.DOCUMENT_NODE;
}
function isDocumentFragment(node) {
    return node && node.nodeType === NodeType_js_1.NodeType.DOCUMENT_FRAGMENT_NODE;
}
function isElement(node) {
    return node && node.nodeType === NodeType_js_1.NodeType.ELEMENT_NODE;
}
function isNonEmptyString(val) {
    return isString(val) && /\S/.test(val);
}
function isTextNode(node) {
    return node && node.nodeType === NodeType_js_1.NodeType.TEXT_NODE;
}
function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
}
function copy(src) {
    const dest = Array.isArray(src) ? [] : {};
    if (typeof src === 'object' && src !== null) {
        const keys = Object.keys(src);
        for (const key of keys) {
            const srcValue = src[key];
            if (srcValue !== null && typeof srcValue === 'object') {
                dest[key] = copy(srcValue);
            }
            else {
                dest[key] = srcValue;
            }
        }
    }
    return dest;
}
exports.isArray = Array.isArray;
function isBoolean(val) {
    return typeof val === 'boolean';
}
function isFunction(val) {
    return typeof val === 'function';
}
function isNumber(val) {
    return typeof val === 'number' && !isNaN(val);
}
function isObject(value) {
    return value && !(0, exports.isArray)(value) && typeof value === 'object';
}
function isString(val) {
    return typeof val === 'string';
}
//# sourceMappingURL=Utils.js.map