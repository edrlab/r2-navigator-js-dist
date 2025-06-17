"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiLocalPathResolver = void 0;
const DomUtils_js_1 = require("../common/DomUtils.js");
const Utils_js_1 = require("../common/Utils.js");
const EpubCfiUtils_js_1 = require("../EpubCfiUtils.js");
const EpubCfiIntendedTargetType_js_1 = require("./EpubCfiIntendedTargetType.js");
const EpubCfiResolvedLocalPath_js_1 = require("./EpubCfiResolvedLocalPath.js");
const EpubCfiResolverErrorType_js_1 = require("./EpubCfiResolverErrorType.js");
const EpubCfiVirtualTarget_js_1 = require("./EpubCfiVirtualTarget.js");
class EpubCfiLocalPathResolver {
    constructor(localPathNode, localPath, startNode) {
        this.localPathNode = localPathNode;
        this.localPath = localPath;
        this.currentTargetNode = startNode;
    }
    static createResolverFromElement(pathNode, startElement, documentUrl) {
        const parentPath = new EpubCfiResolvedLocalPath_js_1.EpubCfiResolvedLocalPath(pathNode, documentUrl, startElement.parentNode, DomUtils_js_1.DomUtils.getNodeIndex(startElement), EpubCfiIntendedTargetType_js_1.EpubCfiIntendedTargetType.ELEMENT, null);
        return new EpubCfiLocalPathResolver(pathNode, parentPath, startElement);
    }
    static createResolverFromExistingPath(pathNode, parentPath) {
        const path = new EpubCfiResolvedLocalPath_js_1.EpubCfiResolvedLocalPath(pathNode, parentPath.documentUrl, parentPath.container, parentPath.offset, parentPath.intendedTargetType, parentPath.virtualTarget);
        return new EpubCfiLocalPathResolver(pathNode, path, path.getTargetNode() || path.container);
    }
    resolve() {
        const steps = this.localPathNode.steps;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (EpubCfiUtils_js_1.EpubCfiUtils.isElementStepNode(step)) {
                this.resolveElementStep(step);
            }
            else {
                this.resolveTextStep(step);
            }
        }
        if (this.localPath.virtualTarget) {
            this.localPath.container = this.currentTargetNode;
            if (this.localPath.virtualTarget === EpubCfiVirtualTarget_js_1.EpubCfiVirtualTarget.FIRST_CHILD) {
                this.localPath.offset = 0;
            }
            else {
                this.localPath.offset = this.currentTargetNode.childNodes.length;
            }
        }
        else {
            this.localPath.container = this.currentTargetNode.parentNode;
            this.localPath.offset = DomUtils_js_1.DomUtils.getNodeIndex(this.currentTargetNode);
        }
        return this.localPath;
    }
    processElementStepValue(currentTargetElement, step) {
        const elementIndex = (step.stepValue / 2) - 1;
        const children = currentTargetElement.children;
        const childElementCount = children.length;
        if (elementIndex >= 0 && elementIndex < childElementCount) {
            this.currentTargetNode = children[elementIndex];
        }
        else {
            if (elementIndex < 0) {
                this.localPath.virtualTarget = EpubCfiVirtualTarget_js_1.EpubCfiVirtualTarget.FIRST_CHILD;
            }
            else {
                this.localPath.virtualTarget = EpubCfiVirtualTarget_js_1.EpubCfiVirtualTarget.LAST_CHILD;
                if (elementIndex !== childElementCount) {
                    this.localPath.createResolverError(EpubCfiResolverErrorType_js_1.EpubCfiResolverErrorType.STEP_VALUE_OUT_OF_BOUNDS, currentTargetElement, step);
                    this.localPath.stepsResolved = false;
                }
            }
        }
    }
    processTextStepValue(currentTargetElement, step) {
        const elementBeforeIndex = (step.stepValue >> 1) - 1;
        if (elementBeforeIndex < currentTargetElement.childElementCount) {
            let childNodeIndex;
            if (elementBeforeIndex === -1) {
                childNodeIndex = 0;
            }
            else {
                let elementBefore = currentTargetElement.children[elementBeforeIndex];
                childNodeIndex = DomUtils_js_1.DomUtils.getNodeIndex(elementBefore) + 1;
            }
            if (childNodeIndex < currentTargetElement.childNodes.length) {
                const targetNode = currentTargetElement.childNodes[childNodeIndex];
                let currentNode = targetNode;
                let textNode;
                while (!textNode && currentNode && !(0, Utils_js_1.isElement)(currentNode)) {
                    if ((0, Utils_js_1.isTextNode)(currentNode)) {
                        textNode = currentNode;
                    }
                    currentNode = currentNode.nextSibling;
                }
                this.currentTargetNode = textNode || targetNode;
            }
            else {
                this.localPath.virtualTarget = elementBeforeIndex === -1 ?
                    EpubCfiVirtualTarget_js_1.EpubCfiVirtualTarget.FIRST_CHILD :
                    EpubCfiVirtualTarget_js_1.EpubCfiVirtualTarget.LAST_CHILD;
            }
        }
        else {
            this.localPath.virtualTarget = EpubCfiVirtualTarget_js_1.EpubCfiVirtualTarget.LAST_CHILD;
            this.localPath.createResolverError(EpubCfiResolverErrorType_js_1.EpubCfiResolverErrorType.STEP_VALUE_OUT_OF_BOUNDS, currentTargetElement, step);
            this.localPath.stepsResolved = false;
        }
    }
    processXmlIdAssertion(step) {
        let result = false;
        const currentElement = this.currentTargetNode;
        const assertion = step.assertion;
        if (assertion && assertion.values.length === 1) {
            if (this.localPath.virtualTarget !== null || !(0, Utils_js_1.isElement)(currentElement) || currentElement.id !== assertion.values[0]) {
                let resolvedElement = currentElement.ownerDocument.getElementById(assertion.values[0]);
                if (resolvedElement && (currentElement.nodeName !== 'itemref' || resolvedElement.nodeName === 'itemref')) {
                    this.currentTargetNode = resolvedElement;
                    this.localPath.repairedWithXmlIdAssertions = true;
                    this.localPath.virtualTarget = null;
                    result = true;
                }
                else {
                    this.localPath.createResolverError(EpubCfiResolverErrorType_js_1.EpubCfiResolverErrorType.XML_ID_ASSERTION_FAILED, currentElement, assertion);
                }
            }
        }
        else if (this.localPath.virtualTarget === null && (0, Utils_js_1.isElement)(currentElement) && currentElement.id) {
            this.localPath.missingXmlIdAssertions = true;
        }
        return result;
    }
    resolveElementStep(step) {
        this.localPath.intendedTargetType = EpubCfiIntendedTargetType_js_1.EpubCfiIntendedTargetType.ELEMENT;
        if (this.localPath.virtualTarget) {
            if (this.processXmlIdAssertion(step)) {
                this.localPath.stepsResolved = true;
                this.localPath.virtualTarget = null;
            }
        }
        else if ((0, Utils_js_1.isElement)(this.currentTargetNode)) {
            this.processElementStepValue(this.currentTargetNode, step);
            this.processXmlIdAssertion(step);
        }
    }
    resolveTextStep(step) {
        this.localPath.intendedTargetType = EpubCfiIntendedTargetType_js_1.EpubCfiIntendedTargetType.TEXT;
        if (!this.localPath.virtualTarget && (0, Utils_js_1.isElement)(this.currentTargetNode)) {
            this.processTextStepValue(this.currentTargetNode, step);
        }
    }
}
exports.EpubCfiLocalPathResolver = EpubCfiLocalPathResolver;
//# sourceMappingURL=EpubCfiLocalPathResolver.js.map