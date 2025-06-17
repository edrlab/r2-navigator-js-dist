"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiBuilderHelper = void 0;
const DomUtils_js_1 = require("../common/DomUtils.js");
const Utils_js_1 = require("../common/Utils.js");
const EpubCfiError_js_1 = require("../EpubCfiError.js");
const EpubCfiErrorType_js_1 = require("../EpubCfiErrorType.js");
const EpubCfiUtils_js_1 = require("../EpubCfiUtils.js");
const EpubCfiOffsetType_js_1 = require("../model/offset/EpubCfiOffsetType.js");
class EpubCfiBuilderHelper {
    static appendTerminalDomRange(range, rootNode) {
        if (!rootNode) {
            rootNode = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyRootNode();
        }
        if (range.collapsed) {
            if (!rootNode.parentPath) {
                rootNode.parentPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
            }
            EpubCfiBuilderHelper.appendTerminalLocalPath(range.startContainer, range.startOffset, rootNode.parentPath);
            return rootNode;
        }
        if (!rootNode.parentPath) {
            rootNode.parentPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        }
        if (rootNode.rangeStartPath || rootNode.rangeEndPath) {
            throw new EpubCfiError_js_1.EpubCfiError(EpubCfiErrorType_js_1.EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }
        rootNode.rangeStartPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        rootNode.rangeEndPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        EpubCfiBuilderHelper.appendTerminalLocalPath(range.startContainer, range.startOffset, rootNode.rangeStartPath, range.commonAncestorContainer);
        EpubCfiBuilderHelper.appendTerminalLocalPath(range.endContainer, range.endOffset, rootNode.rangeEndPath, range.commonAncestorContainer);
        let hasLocalPaths = rootNode.parentPath.localPaths.length > 0;
        if ((0, Utils_js_1.isElement)(range.commonAncestorContainer)) {
            rootNode.parentPath.localPaths.push(EpubCfiBuilderHelper.buildLocalPathToElement(range.commonAncestorContainer, hasLocalPaths));
        }
        else if ((0, Utils_js_1.isElement)(range.commonAncestorContainer.parentNode)) {
            let localPath = EpubCfiBuilderHelper.buildLocalPathToElement(range.commonAncestorContainer.parentNode, hasLocalPaths);
            localPath.steps.push(EpubCfiBuilderHelper.buildTextStep(range.commonAncestorContainer));
            rootNode.parentPath.localPaths.push(localPath);
        }
        else {
            throw new EpubCfiError_js_1.EpubCfiError(EpubCfiErrorType_js_1.EpubCfiErrorType.CONTAINER_NOT_ATTACHED_TO_DOCUMENT);
        }
        return rootNode;
    }
    static appendTerminalLocalPath(container, offset, pathNode, stopNode) {
        let steps = null;
        let offsetNode = null;
        if ((0, Utils_js_1.isElement)(container)) {
            let targetNode = offset < container.childNodes.length ? container.childNodes[offset] : null;
            if ((0, Utils_js_1.isElement)(targetNode)) {
                steps = EpubCfiBuilderHelper.buildStepsToElement(targetNode, stopNode);
            }
            else if (!targetNode) {
                steps = EpubCfiBuilderHelper.buildStepsToElement(container, stopNode);
                steps.push({
                    assertion: null,
                    stepValue: offset === 0 ? 0 : container.childElementCount * 2 + 2,
                });
            }
            else {
                steps = EpubCfiBuilderHelper.buildStepsToElement(container, stopNode);
                steps.push(EpubCfiBuilderHelper.buildTextStep(targetNode));
                offsetNode = EpubCfiBuilderHelper.buildCharacterOffsetToNode(targetNode);
            }
        }
        else if ((0, Utils_js_1.isElement)(container.parentNode)) {
            if (container === stopNode) {
                steps = null;
            }
            else {
                steps = EpubCfiBuilderHelper.buildStepsToElement(container.parentNode, stopNode);
                steps.push(EpubCfiBuilderHelper.buildTextStep(container));
            }
            offsetNode = EpubCfiBuilderHelper.buildCharacterOffsetToNode(container);
            if (offsetNode && (0, Utils_js_1.isTextNode)(container)) {
                offsetNode.characterOffset += offset;
            }
        }
        else {
            throw new EpubCfiError_js_1.EpubCfiError(EpubCfiErrorType_js_1.EpubCfiErrorType.CONTAINER_NOT_ATTACHED_TO_DOCUMENT);
        }
        if (!pathNode) {
            pathNode = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        }
        if (steps) {
            let hasLocalPathNodes = pathNode.localPaths.length > 0;
            let localPath = {
                indirection: hasLocalPathNodes,
                steps: steps,
            };
            pathNode.localPaths.push(localPath);
        }
        pathNode.offset = offsetNode;
        return pathNode;
    }
    static buildCharacterOffsetToNode(node) {
        if ((0, Utils_js_1.isElement)(node)) {
            return null;
        }
        let currentNode = node.previousSibling;
        let offset = 0;
        while (currentNode && !(0, Utils_js_1.isElement)(currentNode)) {
            if ((0, Utils_js_1.isTextNode)(currentNode)) {
                offset += currentNode.data.length;
            }
            currentNode = currentNode.previousSibling;
        }
        return {
            type: EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER,
            assertion: null,
            characterOffset: offset,
        };
    }
    static buildLocalPathToElement(element, indirection) {
        return {
            indirection: indirection,
            steps: EpubCfiBuilderHelper.buildStepsToElement(element),
        };
    }
    static buildStepsToElement(element, rootNode) {
        let elements = [];
        let stepNodes = [];
        while (element.parentNode && (0, Utils_js_1.isElement)(element.parentNode) && element !== rootNode) {
            elements.push(element);
            element = element.parentNode;
        }
        for (let i = elements.length - 1; i >= 0; i--) {
            let element = elements[i];
            let xmlIdAssertion = null;
            if (element.id) {
                xmlIdAssertion = {
                    values: [element.id],
                    parameters: [],
                };
            }
            stepNodes.push({
                stepValue: (DomUtils_js_1.DomUtils.getElementIndex(element) + 1) * 2,
                assertion: xmlIdAssertion,
            });
        }
        return stepNodes;
    }
    static buildTextStep(node) {
        let previousSibling = node.previousSibling;
        while (previousSibling && !(0, Utils_js_1.isElement)(previousSibling)) {
            previousSibling = previousSibling.previousSibling;
        }
        let index;
        if (previousSibling) {
            index = DomUtils_js_1.DomUtils.getElementIndex(previousSibling) * 2 + 3;
        }
        else {
            index = 1;
        }
        return {
            stepValue: index,
            assertion: null,
        };
    }
}
exports.EpubCfiBuilderHelper = EpubCfiBuilderHelper;
//# sourceMappingURL=EpubCfiBuilderHelper.js.map