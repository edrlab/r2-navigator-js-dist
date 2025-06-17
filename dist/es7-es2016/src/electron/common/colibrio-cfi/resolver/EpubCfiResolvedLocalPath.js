"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiResolvedLocalPath = void 0;
const Utils_js_1 = require("../common/Utils.js");
const EpubCfiIntendedTargetType_js_1 = require("./EpubCfiIntendedTargetType.js");
class EpubCfiResolvedLocalPath {
    constructor(ast, documentUrl, container, offset, intendedTargetType, virtualTarget) {
        this.missingXmlIdAssertions = false;
        this.repairedWithXmlIdAssertions = false;
        this.resolverErrors = [];
        this.stepsResolved = true;
        this.ast = ast;
        this.documentUrl = documentUrl;
        this.container = container;
        this.offset = offset;
        this.isOpfDocument = this.getDocument().documentElement.nodeName === 'package';
        this.intendedTargetType = intendedTargetType;
        this.virtualTarget = virtualTarget;
    }
    createResolverError(type, node, errorData) {
        this.resolverErrors.push({
            type: type,
            documentUrl: this.documentUrl,
            node: node,
            errorData: errorData,
        });
    }
    getDocument() {
        return (0, Utils_js_1.isDocument)(this.container) ? this.container : this.container.ownerDocument;
    }
    getTargetElement() {
        if (this.intendedTargetType === EpubCfiIntendedTargetType_js_1.EpubCfiIntendedTargetType.ELEMENT && this.virtualTarget === null && ((0, Utils_js_1.isElement)(this.container) || (0, Utils_js_1.isDocument)(this.container))) {
            let targetElement = this.container.childNodes[this.offset];
            return (0, Utils_js_1.isElement)(targetElement) ? targetElement : null;
        }
        return null;
    }
    getTargetNode() {
        let targetNode = null;
        if (this.virtualTarget === null) {
            if ((0, Utils_js_1.isElement)(this.container) || (0, Utils_js_1.isDocument)(this.container)) {
                targetNode = this.container.childNodes[this.offset];
            }
            else {
                targetNode = this.container;
            }
        }
        return targetNode;
    }
}
exports.EpubCfiResolvedLocalPath = EpubCfiResolvedLocalPath;
//# sourceMappingURL=EpubCfiResolvedLocalPath.js.map