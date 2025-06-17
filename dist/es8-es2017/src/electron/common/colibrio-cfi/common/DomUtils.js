"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomUtils = void 0;
class DomUtils {
    static getNodeIndex(node) {
        let index = 0;
        let currentNode = node;
        while (currentNode = currentNode.previousSibling) {
            index++;
        }
        return index;
    }
    static getElementIndex(element) {
        let index = 0;
        while (element = element.previousElementSibling) {
            index++;
        }
        return index;
    }
}
exports.DomUtils = DomUtils;
//# sourceMappingURL=DomUtils.js.map