"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiResolvedPath = void 0;
const ArrayUtils_js_1 = require("../common/ArrayUtils.js");
const Utils_js_1 = require("../common/Utils.js");
class EpubCfiResolvedPath {
    constructor(ast, localPath) {
        this.characterOffsetOutOfBounds = false;
        this.elementCharacterOffset = null;
        this.indirectionsResolved = true;
        this.sideBias = null;
        this.spatialOffset = null;
        this.stepsResolved = true;
        this.temporalOffset = null;
        this.ast = ast;
        this.localPaths = [];
        this.addResolvedLocalPath(localPath);
    }
    addResolvedLocalPath(localPath) {
        this.localPaths.push(localPath);
        this.stepsResolved = localPath.stepsResolved;
        this.container = localPath.container;
        this.documentUrl = localPath.documentUrl;
        this.intendedTargetType = localPath.intendedTargetType;
        this.offset = localPath.offset;
        this.virtualTarget = localPath.virtualTarget;
    }
    getDocument() {
        return (0, Utils_js_1.isDocument)(this.container) ? this.container : this.container.ownerDocument;
    }
    getResolverErrors() {
        let errors = [];
        for (let i = 0; i < this.localPaths.length; i++) {
            let localPath = this.localPaths[i];
            if (localPath.resolverErrors.length > 0) {
                errors.push(...localPath.resolverErrors);
            }
        }
        return errors;
    }
    getTargetElement() {
        return ArrayUtils_js_1.ArrayUtils.last(this.localPaths).getTargetElement();
    }
    getTargetNode() {
        return ArrayUtils_js_1.ArrayUtils.last(this.localPaths).getTargetNode();
    }
    getTerminalLocalPath() {
        return ArrayUtils_js_1.ArrayUtils.last(this.localPaths);
    }
    isMissingXmlIdAssertions() {
        return this.localPaths.some(localPath => localPath.missingXmlIdAssertions);
    }
    isRepairedWithXmlIdAssertions() {
        return this.localPaths.some(localPath => localPath.repairedWithXmlIdAssertions);
    }
    isTargetingOpfDocument() {
        return ArrayUtils_js_1.ArrayUtils.last(this.localPaths).isOpfDocument;
    }
}
exports.EpubCfiResolvedPath = EpubCfiResolvedPath;
//# sourceMappingURL=EpubCfiResolvedPath.js.map