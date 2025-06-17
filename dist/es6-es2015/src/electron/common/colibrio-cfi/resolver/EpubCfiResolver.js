"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiResolver = void 0;
const ArrayUtils_js_1 = require("../common/ArrayUtils.js");
const DomUtils_js_1 = require("../common/DomUtils.js");
const Utils_js_1 = require("../common/Utils.js");
const EpubCfiParser_js_1 = require("../parser/EpubCfiParser.js");
const EpubCfiIntendedTargetType_js_1 = require("./EpubCfiIntendedTargetType.js");
const EpubCfiLocalPathResolver_js_1 = require("./EpubCfiLocalPathResolver.js");
const EpubCfiPathType_js_1 = require("./EpubCfiPathType.js");
const EpubCfiResolvedLocalPath_js_1 = require("./EpubCfiResolvedLocalPath.js");
const EpubCfiResolvedPath_js_1 = require("./EpubCfiResolvedPath.js");
const EpubCfiResolvedTarget_js_1 = require("./EpubCfiResolvedTarget.js");
const EpubCfiResolverErrorType_js_1 = require("./EpubCfiResolverErrorType.js");
const EpubCfiSideBias_js_1 = require("./EpubCfiSideBias.js");
const EpubCfiOffsetProcessor_js_1 = require("./offset/EpubCfiOffsetProcessor.js");
class EpubCfiResolver {
    constructor(epubCfi) {
        this._lastIndirectionElement = null;
        this._offsetProcessor = new EpubCfiOffsetProcessor_js_1.EpubCfiOffsetProcessor();
        this._parentLocalPathIndex = 0;
        this._parentOffsetHandled = false;
        this._rangeEndLocalPathIndex = 0;
        this._rangeEndOffsetHandled = false;
        this._rangeStartLocalPathIndex = 0;
        this._rangeStartOffsetHandled = false;
        let rootNode = (0, Utils_js_1.isString)(epubCfi) ? EpubCfiParser_js_1.EpubCfiParser.parse(epubCfi) : epubCfi;
        this._rootNode = rootNode;
        this._parentPathNode = rootNode.parentPath;
        this._rangeStartPathNode = rootNode.rangeStartPath;
        this._rangeEndPathNode = rootNode.rangeEndPath;
        this._resolvedTarget = new EpubCfiResolvedTarget_js_1.EpubCfiResolvedTarget(rootNode);
    }
    continueResolving(targetNode, documentUrl) {
        var _a;
        let targetElement = null;
        if ((0, Utils_js_1.isDocument)(targetNode)) {
            targetElement = targetNode.documentElement;
        }
        else if ((0, Utils_js_1.isDocumentFragment)(targetNode) && (0, Utils_js_1.isElement)(targetNode.firstChild)) {
            targetElement = targetNode.firstChild;
        }
        else if ((0, Utils_js_1.isElement)(targetNode) && targetNode.parentNode) {
            targetElement = targetNode;
        }
        if (!targetElement) {
            this._resolvedTarget.indirectionErrors.push({
                from: this._lastIndirectionElement,
                fromPath: ((_a = this.getNextIndirectionResult()) === null || _a === void 0 ? void 0 : _a.documentUrl) || null,
                target: targetElement,
                targetPath: documentUrl,
            });
            return null;
        }
        if (this._parentPathNode) {
            const resolvedPath = this.resolveNextLocalPathFromStartElement(EpubCfiPathType_js_1.EpubCfiPathType.PARENT, targetElement, documentUrl);
            this.continueResolvingFromParentPath(resolvedPath, documentUrl);
        }
        else if (this._rangeStartPathNode) {
            const resolvedPath = this.resolveNextLocalPathFromStartElement(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START, targetElement, documentUrl);
            this.continueResolvingRangeStartPath(resolvedPath, documentUrl);
        }
        else if (this._rangeEndPathNode) {
            const resolvedPath = this.resolveNextLocalPathFromStartElement(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END, targetElement, documentUrl);
            this.continueResolvingRangeEndPath(resolvedPath, documentUrl);
        }
        const indirectionResult = this.getNextIndirectionResult();
        this.maybeProcessOffsetsAndSideBias();
        return indirectionResult;
    }
    getResolvedTarget() {
        return this._resolvedTarget;
    }
    skipNextIndirection() {
        this.handleUnresolvableIndirection();
        const result = this.getNextIndirectionResult();
        this.maybeProcessOffsetsAndSideBias();
        return result;
    }
    addResolvedLocalPath(pathType, localPath) {
        let resolvedPath = this.getResolvedPathFromType(pathType);
        if (resolvedPath) {
            resolvedPath.addResolvedLocalPath(localPath);
            resolvedPath.indirectionsResolved = true;
        }
        else {
            switch (pathType) {
                case EpubCfiPathType_js_1.EpubCfiPathType.PARENT:
                    resolvedPath = this._resolvedTarget.parentPath = new EpubCfiResolvedPath_js_1.EpubCfiResolvedPath(this._rootNode.parentPath, localPath);
                    break;
                case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START:
                    resolvedPath = this._resolvedTarget.rangeStartPath = new EpubCfiResolvedPath_js_1.EpubCfiResolvedPath(this._rootNode.rangeStartPath, localPath);
                    break;
                case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END:
                    resolvedPath = this._resolvedTarget.rangeEndPath = new EpubCfiResolvedPath_js_1.EpubCfiResolvedPath(this._rootNode.rangeEndPath, localPath);
                    break;
                default:
                    throw new Error(EpubCfiResolverErrorType_js_1.EpubCfiResolverErrorType.INVALID_PATH_TYPE);
            }
        }
        return resolvedPath;
    }
    consumeNextLocalPath(pathType) {
        let result = null;
        switch (pathType) {
            case EpubCfiPathType_js_1.EpubCfiPathType.PARENT:
                if (this._parentPathNode) {
                    result = this.getLocalPathByIndex(this._parentPathNode, this._parentLocalPathIndex++);
                    if (!this.getLocalPathByIndex(this._parentPathNode, this._parentLocalPathIndex)) {
                        this._parentPathNode = null;
                    }
                }
                break;
            case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START:
                if (this._rangeStartPathNode) {
                    result = this.getLocalPathByIndex(this._rangeStartPathNode, this._rangeStartLocalPathIndex++);
                    if (!this.getLocalPathByIndex(this._rangeStartPathNode, this._rangeStartLocalPathIndex)) {
                        this._rangeStartPathNode = null;
                    }
                }
                break;
            case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END:
                if (this._rangeEndPathNode) {
                    result = this.getLocalPathByIndex(this._rangeEndPathNode, this._rangeEndLocalPathIndex++);
                    if (!this.getLocalPathByIndex(this._rangeEndPathNode, this._rangeEndLocalPathIndex)) {
                        this._rangeEndPathNode = null;
                    }
                }
                break;
        }
        return result;
    }
    continueResolvingFromParentPath(resolvedParentPath, documentUrl) {
        while (this._parentPathNode) {
            if (this.hasNextLocalPathIndirection(EpubCfiPathType_js_1.EpubCfiPathType.PARENT)) {
                if (this._resolvedTarget.parentPath) {
                    this._resolvedTarget.parentPath.indirectionsResolved = false;
                }
                return;
            }
            this.resolveNextLocalPathFromResolvedPath(EpubCfiPathType_js_1.EpubCfiPathType.PARENT, resolvedParentPath, documentUrl);
        }
        this.continueResolvingRangeStartPath(resolvedParentPath, documentUrl);
        this.continueResolvingRangeEndPath(resolvedParentPath, documentUrl);
    }
    continueResolvingRangeEndPath(resolvedPath, documentUrl) {
        while (this._rangeEndPathNode) {
            if (this.hasNextLocalPathIndirection(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END)) {
                if (this._resolvedTarget.rangeEndPath) {
                    this._resolvedTarget.rangeEndPath.indirectionsResolved = false;
                }
                return;
            }
            resolvedPath = this.resolveNextLocalPathFromResolvedPath(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END, resolvedPath, documentUrl);
        }
    }
    continueResolvingRangeStartPath(resolvedPath, documentUrl) {
        while (this._rangeStartPathNode) {
            if (this.hasNextLocalPathIndirection(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START)) {
                if (this._resolvedTarget.rangeStartPath) {
                    this._resolvedTarget.rangeStartPath.indirectionsResolved = false;
                }
                return;
            }
            resolvedPath = this.resolveNextLocalPathFromResolvedPath(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START, resolvedPath, documentUrl);
        }
    }
    getLocalPathByIndex(pathNode, index) {
        return index < pathNode.localPaths.length ? pathNode.localPaths[index] : null;
    }
    getNextIndirectionResult() {
        let resolvedPath = null;
        let result = null;
        if (this.hasNextLocalPathIndirection(EpubCfiPathType_js_1.EpubCfiPathType.PARENT)) {
            resolvedPath = this._resolvedTarget.parentPath;
        }
        else if (this.hasNextLocalPathIndirection(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START)) {
            resolvedPath = this._resolvedTarget.rangeStartPath || this._resolvedTarget.parentPath;
        }
        else if (this.hasNextLocalPathIndirection(EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END)) {
            resolvedPath = this._resolvedTarget.rangeEndPath || this._resolvedTarget.parentPath;
        }
        if (resolvedPath) {
            const targetElement = resolvedPath.getTargetElement();
            if (targetElement) {
                result = {
                    documentUrl: resolvedPath.documentUrl,
                    element: targetElement,
                };
            }
            else {
                this._resolvedTarget.indirectionErrors.push({
                    from: resolvedPath.getTargetNode(),
                    fromPath: resolvedPath.documentUrl,
                    target: null,
                    targetPath: null,
                });
                this.handleUnresolvableIndirection();
                result = this.getNextIndirectionResult();
            }
        }
        return result;
    }
    getResolvedPathFromType(type) {
        switch (type) {
            case EpubCfiPathType_js_1.EpubCfiPathType.PARENT:
                return this._resolvedTarget.parentPath;
            case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END:
                return this._resolvedTarget.rangeEndPath;
            case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START:
                return this._resolvedTarget.rangeStartPath;
        }
    }
    handleSideBiasParameter(path) {
        let terminalAssertion = null;
        if (path.ast.offset && path.ast.offset.assertion) {
            terminalAssertion = path.ast.offset.assertion;
        }
        else {
            let terminalLocalPath = path.getTerminalLocalPath();
            if (terminalLocalPath.ast) {
                let lastStep = ArrayUtils_js_1.ArrayUtils.last(terminalLocalPath.ast.steps);
                if (lastStep) {
                    terminalAssertion = lastStep.assertion;
                }
            }
        }
        if (terminalAssertion) {
            let sideBiasParameter = terminalAssertion.parameters.find(param => param.name === 's' && param.values.length > 0);
            if (sideBiasParameter) {
                path.sideBias = sideBiasParameter.values[0] === 'b' ? EpubCfiSideBias_js_1.EpubCfiSideBias.BEFORE : EpubCfiSideBias_js_1.EpubCfiSideBias.AFTER;
            }
        }
    }
    handleUnresolvableIndirection() {
        if (this._parentPathNode) {
            this._parentPathNode = null;
            this._rangeStartPathNode = null;
            this._rangeEndPathNode = null;
            if (this._resolvedTarget.parentPath) {
                this._resolvedTarget.parentPath.indirectionsResolved = false;
                this._resolvedTarget.parentPath.stepsResolved = false;
            }
        }
        else if (this._rangeStartPathNode) {
            this._rangeStartPathNode = null;
            if (this._resolvedTarget.rangeStartPath) {
                this._resolvedTarget.rangeStartPath.indirectionsResolved = false;
                this._resolvedTarget.rangeStartPath.stepsResolved = false;
            }
        }
        else if (this._rangeEndPathNode) {
            this._rangeEndPathNode = null;
            if (this._resolvedTarget.rangeEndPath) {
                this._resolvedTarget.rangeEndPath.indirectionsResolved = false;
                this._resolvedTarget.rangeEndPath.stepsResolved = false;
            }
        }
    }
    hasNextLocalPathIndirection(pathType) {
        let result = false;
        switch (pathType) {
            case EpubCfiPathType_js_1.EpubCfiPathType.PARENT:
                if (this._parentPathNode) {
                    const nextLocalPath = this.getLocalPathByIndex(this._parentPathNode, this._parentLocalPathIndex);
                    result = nextLocalPath !== null && nextLocalPath.indirection;
                }
                break;
            case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_START:
                if (this._rangeStartPathNode) {
                    const nextLocalPath = this.getLocalPathByIndex(this._rangeStartPathNode, this._rangeStartLocalPathIndex);
                    result = nextLocalPath !== null && nextLocalPath.indirection;
                }
                break;
            case EpubCfiPathType_js_1.EpubCfiPathType.RANGE_END:
                if (this._rangeEndPathNode) {
                    const nextLocalPath = this.getLocalPathByIndex(this._rangeEndPathNode, this._rangeEndLocalPathIndex);
                    result = nextLocalPath !== null && nextLocalPath.indirection;
                }
                break;
        }
        return result;
    }
    maybeProcessOffsetsAndSideBias() {
        if (this._resolvedTarget.parentPath && !this._parentPathNode && !this._parentOffsetHandled) {
            this._offsetProcessor.processOffset(this._resolvedTarget.parentPath);
            this.handleSideBiasParameter(this._resolvedTarget.parentPath);
            this._parentOffsetHandled = true;
        }
        if (this._resolvedTarget.rangeStartPath && !this._rangeStartPathNode && !this._rangeStartOffsetHandled) {
            this._offsetProcessor.processOffset(this._resolvedTarget.rangeStartPath);
            this.handleSideBiasParameter(this._resolvedTarget.rangeStartPath);
            this._rangeStartOffsetHandled = true;
        }
        if (this._resolvedTarget.rangeEndPath && !this._rangeEndPathNode && !this._rangeEndOffsetHandled) {
            this._offsetProcessor.processOffset(this._resolvedTarget.rangeEndPath);
            this.handleSideBiasParameter(this._resolvedTarget.rangeEndPath);
            this._rangeStartOffsetHandled = true;
        }
    }
    resolveNextLocalPathFromResolvedPath(pathType, existingResolvedPath, documentUrl) {
        const nextLocalPath = this.consumeNextLocalPath(pathType);
        let resolvedLocalPath;
        if (nextLocalPath) {
            resolvedLocalPath = EpubCfiLocalPathResolver_js_1.EpubCfiLocalPathResolver.createResolverFromExistingPath(nextLocalPath, existingResolvedPath).resolve();
        }
        else {
            resolvedLocalPath = new EpubCfiResolvedLocalPath_js_1.EpubCfiResolvedLocalPath(null, documentUrl, existingResolvedPath.container, existingResolvedPath.offset, existingResolvedPath.intendedTargetType, existingResolvedPath.virtualTarget);
        }
        return this.addResolvedLocalPath(pathType, resolvedLocalPath);
    }
    resolveNextLocalPathFromStartElement(pathType, startElement, documentUrl) {
        const nextLocalPath = this.consumeNextLocalPath(pathType);
        let resolvedLocalPath;
        if (nextLocalPath) {
            resolvedLocalPath = EpubCfiLocalPathResolver_js_1.EpubCfiLocalPathResolver.createResolverFromElement(nextLocalPath, startElement, documentUrl).resolve();
        }
        else {
            resolvedLocalPath = new EpubCfiResolvedLocalPath_js_1.EpubCfiResolvedLocalPath(null, documentUrl, startElement.parentNode, DomUtils_js_1.DomUtils.getNodeIndex(startElement), EpubCfiIntendedTargetType_js_1.EpubCfiIntendedTargetType.ELEMENT, null);
        }
        return this.addResolvedLocalPath(pathType, resolvedLocalPath);
    }
}
exports.EpubCfiResolver = EpubCfiResolver;
//# sourceMappingURL=EpubCfiResolver.js.map