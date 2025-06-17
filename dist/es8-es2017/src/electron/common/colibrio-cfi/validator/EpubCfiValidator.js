"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiValidator = void 0;
const ArrayUtils_js_1 = require("../common/ArrayUtils.js");
const EpubCfiUtils_js_1 = require("../EpubCfiUtils.js");
const EpubCfiOffsetType_js_1 = require("../model/offset/EpubCfiOffsetType.js");
const EpubCfiParserErrorHelper_js_1 = require("../parser/EpubCfiParserErrorHelper.js");
const EpubCfiParserErrorType_js_1 = require("../parser/EpubCfiParserErrorType.js");
class EpubCfiValidator {
    static addExplicitCharacterOffsets(rootNode) {
        let astModified = false;
        if (rootNode.parentPath) {
            addCharacterOffset(rootNode.parentPath);
        }
        if (rootNode.rangeStartPath) {
            addCharacterOffset(rootNode.rangeStartPath);
        }
        if (rootNode.rangeEndPath) {
            addCharacterOffset(rootNode.rangeEndPath);
        }
        function addCharacterOffset(path) {
            const lastLocalPath = ArrayUtils_js_1.ArrayUtils.last(path.localPaths);
            if (lastLocalPath) {
                const lastStep = ArrayUtils_js_1.ArrayUtils.last(lastLocalPath.steps);
                if (lastStep && EpubCfiUtils_js_1.EpubCfiUtils.isTextStepNode(lastStep) && !path.offset) {
                    path.offset = {
                        type: EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER,
                        characterOffset: 0,
                        assertion: null,
                    };
                    astModified = true;
                }
            }
        }
        return astModified;
    }
    static checkEmptyParentPathAndRangeEnd(rootNode, skipErrorReporting) {
        let astModified = false;
        if (!rootNode.parentPath || rootNode.parentPath.localPaths.length === 0 || rootNode.parentPath.localPaths[0].steps.length === 0) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.PATH_EMPTY, rootNode.srcOffset));
            }
            astModified = true;
            rootNode.parentPath = null;
            rootNode.rangeStartPath = null;
            rootNode.rangeEndPath = null;
        }
        else if (rootNode.rangeStartPath && !rootNode.rangeEndPath) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.MISSING_END_RANGE));
            }
            astModified = true;
            rootNode.rangeStartPath = null;
        }
        else if (rootNode.rangeEndPath && (rootNode.rangeEndPath.localPaths.length === 0 || (rootNode.rangeEndPath.localPaths[0].steps.length === 0 && rootNode.rangeEndPath.offset === null))) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.PATH_EMPTY, rootNode.rangeEndPath.srcOffset));
            }
            astModified = true;
            rootNode.rangeStartPath = null;
            rootNode.rangeEndPath = null;
        }
        return astModified;
    }
    static expandEmptyIndirectionLocalPaths(rootNode, skipErrorReporting) {
        let astModified = false;
        if (rootNode.parentPath && !rootNode.parentPath.offset) {
            const lastLocalPath = ArrayUtils_js_1.ArrayUtils.last(rootNode.parentPath.localPaths);
            if (lastLocalPath && lastLocalPath.indirection && lastLocalPath.steps.length === 0) {
                if (!skipErrorReporting) {
                    rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.PATH_ENDS_WITH_INDIRECTION, lastLocalPath.srcOffset));
                }
                astModified = true;
                if (rootNode.rangeStartPath && rootNode.rangeEndPath) {
                    addIndirectionToPathStart(rootNode.rangeStartPath);
                    addIndirectionToPathStart(rootNode.rangeEndPath);
                    rootNode.parentPath.localPaths.length--;
                }
                else {
                    lastLocalPath.steps.push({
                        stepValue: 0,
                        assertion: null,
                    });
                    rootNode.rangeStartPath = null;
                    rootNode.rangeEndPath = null;
                }
            }
        }
        function checkRangePath(rangePath) {
            if (!rangePath.offset) {
                const lastLocalPath = ArrayUtils_js_1.ArrayUtils.last(rangePath.localPaths);
                if (lastLocalPath && lastLocalPath.indirection && lastLocalPath.steps.length === 0) {
                    if (!skipErrorReporting) {
                        rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.PATH_ENDS_WITH_INDIRECTION, lastLocalPath.srcOffset));
                    }
                    astModified = true;
                    lastLocalPath.steps.push({
                        stepValue: 0,
                        assertion: null,
                    });
                }
            }
        }
        if (rootNode.rangeStartPath) {
            checkRangePath(rootNode.rangeStartPath);
        }
        if (rootNode.rangeEndPath) {
            checkRangePath(rootNode.rangeEndPath);
        }
        return astModified;
    }
    static removeEmptyIndirectionBeforeOffsets(rootNode, skipErrorReporting) {
        let astModified = false;
        if (rootNode.parentPath) {
            astModified = removeEmptyIndirectionBeforeOffsets(rootNode, rootNode.parentPath, skipErrorReporting);
        }
        if (rootNode.rangeStartPath) {
            astModified = removeEmptyIndirectionBeforeOffsets(rootNode, rootNode.rangeStartPath, skipErrorReporting) || astModified;
        }
        if (rootNode.rangeEndPath) {
            astModified = removeEmptyIndirectionBeforeOffsets(rootNode, rootNode.rangeEndPath, skipErrorReporting) || astModified;
        }
        return astModified;
    }
    static removeIncompatibleRangeOffsets(rootNode, skipErrorReporting) {
        let astModified = false;
        let startOffset = rootNode.rangeStartPath ? rootNode.rangeStartPath.offset : null;
        let endOffset = rootNode.rangeEndPath ? rootNode.rangeEndPath.offset : null;
        let removeOffsets = false;
        if (startOffset && endOffset) {
            if (startOffset.type !== endOffset.type) {
                removeOffsets = true;
            }
            else if (startOffset.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL && endOffset.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL) {
                if ((startOffset.x !== null && endOffset.x === null) || (startOffset.x === null && endOffset.x !== null)) {
                    startOffset.x = null;
                    startOffset.y = null;
                    endOffset.x = null;
                    endOffset.y = null;
                    astModified = true;
                }
            }
        }
        else if ((!startOffset && endOffset && endOffset.type !== EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER) || (startOffset && !endOffset)) {
            removeOffsets = true;
        }
        if (removeOffsets) {
            if (rootNode.rangeStartPath) {
                rootNode.rangeStartPath.offset = null;
            }
            if (rootNode.rangeEndPath) {
                rootNode.rangeEndPath.offset = null;
            }
            astModified = true;
        }
        if (astModified && !skipErrorReporting) {
            rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INCOMPATIBLE_OFFSET_TYPE));
        }
        return astModified;
    }
    static removeInitialIndirectionFromParentPath(rootNode, skipErrorReporting) {
        let astModified = false;
        if (rootNode.parentPath) {
            let firstLocalPath = rootNode.parentPath.localPaths[0];
            if (firstLocalPath && firstLocalPath.indirection) {
                firstLocalPath.indirection = false;
                astModified = true;
                if (!skipErrorReporting) {
                    rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_INDIRECTION, firstLocalPath.srcOffset));
                }
            }
        }
        return astModified;
    }
    static removeInvalidRangeAfterParentPathOffset(rootNode, skipErrorReporting) {
        let astModified = false;
        if (rootNode.parentPath && rootNode.parentPath.offset) {
            let parentOffset = rootNode.parentPath.offset;
            let pureTemporalOffset = parentOffset.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL && parentOffset.x === null;
            if (rootNode.rangeStartPath && removeInvalidRangeAfterParentPathOffset(rootNode, rootNode.rangeStartPath, pureTemporalOffset, skipErrorReporting)) {
                rootNode.rangeStartPath = null;
                astModified = true;
            }
            if (rootNode.rangeEndPath && removeInvalidRangeAfterParentPathOffset(rootNode, rootNode.rangeEndPath, pureTemporalOffset, skipErrorReporting)) {
                rootNode.rangeEndPath = null;
                astModified = true;
            }
        }
        return astModified;
    }
    static removeStepsAfterTextSteps(rootNode, skipErrorReporting) {
        let astModified = false;
        let result;
        if (rootNode.parentPath) {
            result = removeAllAfterTextStepsInPath(rootNode, rootNode.parentPath, skipErrorReporting);
            if (result.removed) {
                astModified = true;
                rootNode.rangeStartPath = null;
                rootNode.rangeEndPath = null;
            }
            else if (result.textStepFound) {
                if (rootNode.rangeStartPath && rootNode.rangeStartPath.localPaths.length > 0) {
                    astModified = true;
                    rootNode.rangeStartPath = null;
                }
                if (rootNode.rangeEndPath && rootNode.rangeEndPath.localPaths.length > 0) {
                    astModified = true;
                    rootNode.rangeEndPath = null;
                }
            }
        }
        if (rootNode.rangeStartPath) {
            result = removeAllAfterTextStepsInPath(rootNode, rootNode.rangeStartPath, skipErrorReporting);
            astModified = astModified || result.removed;
        }
        if (rootNode.rangeEndPath) {
            result = removeAllAfterTextStepsInPath(rootNode, rootNode.rangeEndPath, skipErrorReporting);
            astModified = astModified || result.removed;
        }
        return astModified;
    }
    static runAllValidations(rootNode, skipErrorReporting) {
        let astModified = false;
        astModified = EpubCfiValidator.removeStepsAfterTextSteps(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeInitialIndirectionFromParentPath(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeInvalidRangeAfterParentPathOffset(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeIncompatibleRangeOffsets(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.checkEmptyParentPathAndRangeEnd(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.addExplicitCharacterOffsets(rootNode) || astModified;
        astModified = EpubCfiValidator.expandEmptyIndirectionLocalPaths(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeEmptyIndirectionBeforeOffsets(rootNode, skipErrorReporting) || astModified;
        return astModified;
    }
}
exports.EpubCfiValidator = EpubCfiValidator;
function addIndirectionToPathStart(path) {
    if (path.localPaths[0]) {
        path.localPaths[0].indirection = true;
    }
    else {
        let virtualStep = {
            stepValue: 0,
            assertion: null,
        };
        path.localPaths.push({
            steps: path.offset ? [] : [virtualStep],
            indirection: true,
        });
    }
}
function removeAllAfterTextStepsInPath(rootNode, path, skipErrorReporting) {
    let removed = false;
    let textStepFound = false;
    let localPathIndex = path.localPaths.findIndex(localPath => {
        let textStepIndex = localPath.steps.findIndex(EpubCfiUtils_js_1.EpubCfiUtils.isTextStepNode);
        if (textStepIndex !== -1) {
            textStepFound = true;
            if (textStepIndex < localPath.steps.length - 1) {
                if (!skipErrorReporting) {
                    rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_STEP, localPath.steps[textStepIndex].srcOffset));
                }
                localPath.steps = localPath.steps.slice(0, textStepIndex + 1);
                path.offset = null;
                removed = true;
            }
            return true;
        }
        return false;
    });
    if (localPathIndex !== -1 && localPathIndex < path.localPaths.length - 1) {
        path.localPaths = path.localPaths.slice(0, localPathIndex + 1);
        removed = true;
    }
    return { removed, textStepFound };
}
function removeEmptyIndirectionBeforeOffsets(rootNode, path, skipErrorReporting) {
    let astModified = false;
    if (path.offset) {
        const lastLocalPath = ArrayUtils_js_1.ArrayUtils.last(path.localPaths);
        if (lastLocalPath && lastLocalPath.indirection && lastLocalPath.steps.length === 0) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.PATH_ENDS_WITH_INDIRECTION, lastLocalPath.srcOffset));
            }
            path.localPaths.length--;
            astModified = true;
        }
    }
    return astModified;
}
function removeInvalidRangeAfterParentPathOffset(rootNode, path, pureTemporalOffset, skipErrorReporting) {
    let astModified = false;
    if (path.localPaths.length > 0) {
        if (!skipErrorReporting) {
            rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_RANGE_PATH, path.srcOffset));
        }
        astModified = true;
    }
    else if (path.offset && (!pureTemporalOffset || path.offset.type !== EpubCfiOffsetType_js_1.EpubCfiOffsetType.SPATIAL)) {
        if (!skipErrorReporting) {
            rootNode.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INCOMPATIBLE_OFFSET_TYPE, path.offset.srcOffset));
        }
        astModified = true;
    }
    return astModified;
}
//# sourceMappingURL=EpubCfiValidator.js.map