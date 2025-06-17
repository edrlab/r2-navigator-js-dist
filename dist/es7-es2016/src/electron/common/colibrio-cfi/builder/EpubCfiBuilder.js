"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiBuilder = void 0;
const EpubCfiError_js_1 = require("../EpubCfiError.js");
const EpubCfiErrorType_js_1 = require("../EpubCfiErrorType.js");
const EpubCfiUtils_js_1 = require("../EpubCfiUtils.js");
const EpubCfiStringifier_js_1 = require("../stringifier/EpubCfiStringifier.js");
const EpubCfiBuilderHelper_js_1 = require("./EpubCfiBuilderHelper.js");
const Utils_js_1 = require("../common/Utils.js");
const ArrayUtils_js_1 = require("../common/ArrayUtils.js");
class EpubCfiBuilder {
    constructor(rootNode) {
        if (rootNode) {
            this._rootNode = rootNode;
        }
        else {
            this._rootNode = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyRootNode();
        }
    }
    appendLocalPathTo(element) {
        if (this._rootNode.rangeStartPath || this._rootNode.rangeEndPath) {
            throw new EpubCfiError_js_1.EpubCfiError(EpubCfiErrorType_js_1.EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }
        let steps = EpubCfiBuilderHelper_js_1.EpubCfiBuilderHelper.buildStepsToElement(element);
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        }
        let hasLocalPath = this._rootNode.parentPath.localPaths.length > 0;
        this._rootNode.parentPath.localPaths.push({
            steps: steps,
            indirection: hasLocalPath,
        });
    }
    appendTerminalDomPosition(container, offset) {
        offset = Math.round(offset);
        if (this._rootNode.rangeStartPath || this._rootNode.rangeEndPath) {
            throw new EpubCfiError_js_1.EpubCfiError(EpubCfiErrorType_js_1.EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        }
        EpubCfiBuilderHelper_js_1.EpubCfiBuilderHelper.appendTerminalLocalPath(container, offset, this._rootNode.parentPath);
    }
    appendTerminalDomRange(range) {
        EpubCfiBuilderHelper_js_1.EpubCfiBuilderHelper.appendTerminalDomRange(range, this._rootNode);
    }
    appendTerminalIndirection() {
        if (this._rootNode.rangeStartPath || this._rootNode.rangeEndPath) {
            throw new EpubCfiError_js_1.EpubCfiError(EpubCfiErrorType_js_1.EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        }
        this._rootNode.parentPath.localPaths.push({
            indirection: true,
            steps: [
                {
                    assertion: null,
                    stepValue: 0,
                },
            ],
        });
    }
    clone() {
        return new EpubCfiBuilder((0, Utils_js_1.copy)(this._rootNode));
    }
    collapseToEnd() {
        if (this._rootNode.rangeEndPath) {
            this.collapse(this._rootNode.rangeEndPath);
        }
    }
    collapseToStart() {
        if (this._rootNode.rangeStartPath) {
            this.collapse(this._rootNode.rangeStartPath);
        }
    }
    getEpubCfiRootNode() {
        return this._rootNode;
    }
    prependLocalPathTo(element) {
        let steps = EpubCfiBuilderHelper_js_1.EpubCfiBuilderHelper.buildStepsToElement(element);
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        }
        let firstLocalPath = this._rootNode.parentPath.localPaths[0];
        if (firstLocalPath) {
            firstLocalPath.indirection = true;
        }
        this._rootNode.parentPath.localPaths.unshift({
            steps: steps,
            indirection: false,
        });
    }
    toString() {
        return EpubCfiStringifier_js_1.EpubCfiStringifier.stringifyRootNode(this._rootNode);
    }
    collapse(rangePath) {
        this._rootNode.rangeStartPath = null;
        this._rootNode.rangeEndPath = null;
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils_js_1.EpubCfiUtils.createEmptyPathNode();
        }
        const parentPath = this._rootNode.parentPath;
        if (parentPath.localPaths) {
            const firstRangeLocalPath = ArrayUtils_js_1.ArrayUtils.first(rangePath.localPaths);
            const lastParentLocalPath = ArrayUtils_js_1.ArrayUtils.last(parentPath.localPaths);
            if (firstRangeLocalPath) {
                if (lastParentLocalPath && !firstRangeLocalPath.indirection) {
                    lastParentLocalPath.steps.push(...firstRangeLocalPath.steps);
                    rangePath.localPaths.shift();
                }
                parentPath.localPaths.push(...rangePath.localPaths);
            }
        }
        else {
            parentPath.localPaths = rangePath.localPaths;
        }
        parentPath.offset = rangePath.offset;
    }
}
exports.EpubCfiBuilder = EpubCfiBuilder;
//# sourceMappingURL=EpubCfiBuilder.js.map