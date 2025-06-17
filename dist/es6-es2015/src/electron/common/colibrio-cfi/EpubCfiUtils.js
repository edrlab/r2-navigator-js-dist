"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiUtils = void 0;
const EpubCfiBuilder_js_1 = require("./builder/EpubCfiBuilder.js");
const EpubCfiOffsetType_js_1 = require("./model/offset/EpubCfiOffsetType.js");
class EpubCfiUtils {
    static collapseToEnd(rootNode) {
        const builder = new EpubCfiBuilder_js_1.EpubCfiBuilder(EpubCfiUtils.copyRootNode(rootNode));
        builder.collapseToEnd();
        return builder.getEpubCfiRootNode();
    }
    static collapseToStart(rootNode) {
        const builder = new EpubCfiBuilder_js_1.EpubCfiBuilder(EpubCfiUtils.copyRootNode(rootNode));
        builder.collapseToStart();
        return builder.getEpubCfiRootNode();
    }
    static copyAssertionNode(assertionNode) {
        return {
            parameters: assertionNode.parameters.map(parameter => EpubCfiUtils.copyAssertionParameterNode(parameter)),
            srcOffset: assertionNode.srcOffset,
            values: assertionNode.values.slice(),
        };
    }
    static copyLocalPathNode(localPathNode) {
        return {
            indirection: localPathNode.indirection,
            srcOffset: localPathNode.srcOffset,
            steps: localPathNode.steps.map(step => EpubCfiUtils.copyStepNode(step)),
        };
    }
    static copyOffsetNode(offsetNode) {
        switch (offsetNode.type) {
            case EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER:
                return EpubCfiUtils.copyCharacterOffsetNode(offsetNode);
            case EpubCfiOffsetType_js_1.EpubCfiOffsetType.SPATIAL:
                return EpubCfiUtils.copySpatialOffsetNode(offsetNode);
            case EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL:
                return EpubCfiUtils.copyTemporalOffsetNode(offsetNode);
        }
    }
    static copyPathNode(pathNode) {
        return {
            complete: pathNode.complete,
            localPaths: pathNode.localPaths.map(localPath => EpubCfiUtils.copyLocalPathNode(localPath)),
            offset: pathNode.offset ? EpubCfiUtils.copyOffsetNode(pathNode.offset) : null,
            srcOffset: pathNode.srcOffset,
        };
    }
    static copyRootNode(rootNode) {
        return {
            errors: [],
            parentPath: rootNode.parentPath ? EpubCfiUtils.copyPathNode(rootNode.parentPath) : null,
            rangeEndPath: rootNode.rangeEndPath ? EpubCfiUtils.copyPathNode(rootNode.rangeEndPath) : null,
            rangeStartPath: rootNode.rangeStartPath ? EpubCfiUtils.copyPathNode(rootNode.rangeStartPath) : null,
            src: rootNode.src,
            srcModified: rootNode.srcModified,
            srcOffset: rootNode.srcOffset,
        };
    }
    static copyStepNode(stepNode) {
        return {
            assertion: stepNode.assertion ? EpubCfiUtils.copyAssertionNode(stepNode.assertion) : null,
            srcOffset: stepNode.srcOffset,
            stepValue: stepNode.stepValue,
        };
    }
    static createEmptyLocalPathNode() {
        return {
            indirection: false,
            steps: [],
        };
    }
    static createEmptyPathNode() {
        return {
            complete: false,
            localPaths: [],
            offset: null,
        };
    }
    static createEmptyRootNode() {
        return {
            errors: [],
            parentPath: null,
            rangeEndPath: null,
            rangeStartPath: null,
            src: '',
            srcModified: false,
        };
    }
    static createRangeSelector(startRootNode, endRootNode) {
        let startPath = startRootNode.parentPath;
        if (startRootNode.rangeStartPath) {
            const builder = new EpubCfiBuilder_js_1.EpubCfiBuilder(EpubCfiUtils.copyRootNode(startRootNode));
            builder.collapseToStart();
            startPath = builder.getEpubCfiRootNode().parentPath;
        }
        let endPath = endRootNode.parentPath;
        if (endRootNode.rangeEndPath) {
            const builder = new EpubCfiBuilder_js_1.EpubCfiBuilder(EpubCfiUtils.copyRootNode(endRootNode));
            builder.collapseToEnd();
            endPath = builder.getEpubCfiRootNode().parentPath;
        }
        if (!endPath || !startPath) {
            return null;
        }
        const rangeRootNode = EpubCfiUtils.createEmptyRootNode();
        const rangeParentPath = EpubCfiUtils.createEmptyPathNode();
        const rangeStartPath = EpubCfiUtils.createEmptyPathNode();
        const rangeEndPath = EpubCfiUtils.createEmptyPathNode();
        const minLocalPathLength = Math.min(startPath.localPaths.length, endPath.localPaths.length);
        let diffFound = false;
        let pathIndex = 0;
        while (!diffFound && pathIndex < minLocalPathLength) {
            const localPathStart = startPath.localPaths[pathIndex];
            const localPathEnd = endPath.localPaths[pathIndex];
            if (localPathStart.indirection !== localPathEnd.indirection) {
                diffFound = true;
            }
            else {
                const stepsStart = localPathStart.steps;
                const stepsEnd = localPathEnd.steps;
                const minStepLength = Math.min(stepsStart.length, stepsEnd.length);
                let stepIndex = 0;
                while (!diffFound && stepIndex < minStepLength) {
                    if (EpubCfiUtils.areStepsEqual(stepsStart[stepIndex], stepsEnd[stepIndex])) {
                        stepIndex++;
                    }
                    else {
                        diffFound = true;
                    }
                }
                if (stepsStart.length !== stepsEnd.length) {
                    diffFound = true;
                }
                if (diffFound) {
                    if (stepIndex > 0) {
                        const rangeParentLocalPath = EpubCfiUtils.createEmptyLocalPathNode();
                        rangeParentLocalPath.indirection = localPathStart.indirection;
                        for (let i = 0; i < stepIndex; i++) {
                            rangeParentLocalPath.steps.push(EpubCfiUtils.copyStepNode(stepsStart[i]));
                        }
                        rangeParentPath.localPaths.push(rangeParentLocalPath);
                        if (stepIndex < stepsStart.length) {
                            const rangeStartLocalPath = EpubCfiUtils.createEmptyLocalPathNode();
                            for (let i = stepIndex; i < stepsStart.length; i++) {
                                rangeStartLocalPath.steps.push(EpubCfiUtils.copyStepNode(stepsStart[i]));
                            }
                            rangeStartPath.localPaths.push(rangeStartLocalPath);
                        }
                        if (stepIndex < stepsEnd.length) {
                            const rangeEndLocalPath = EpubCfiUtils.createEmptyLocalPathNode();
                            for (let i = stepIndex; i < stepsEnd.length; i++) {
                                rangeEndLocalPath.steps.push(EpubCfiUtils.copyStepNode(stepsEnd[i]));
                            }
                            rangeEndPath.localPaths.push(rangeEndLocalPath);
                        }
                        pathIndex++;
                    }
                }
                else {
                    rangeParentPath.localPaths.push(EpubCfiUtils.copyLocalPathNode(localPathStart));
                    pathIndex++;
                }
            }
        }
        if (startPath.localPaths.length !== endPath.localPaths.length) {
            diffFound = true;
        }
        if (diffFound) {
            for (let i = pathIndex; i < startPath.localPaths.length; i++) {
                rangeStartPath.localPaths.push(EpubCfiUtils.copyLocalPathNode(startPath.localPaths[i]));
            }
            for (let i = pathIndex; i < endPath.localPaths.length; i++) {
                rangeEndPath.localPaths.push(EpubCfiUtils.copyLocalPathNode(endPath.localPaths[i]));
            }
            if (startPath.offset) {
                rangeStartPath.offset = EpubCfiUtils.copyOffsetNode(startPath.offset);
            }
            if (endPath.offset) {
                rangeEndPath.offset = EpubCfiUtils.copyOffsetNode(endPath.offset);
            }
        }
        else {
            const offsetStart = startPath.offset;
            const offsetEnd = endPath.offset;
            if ((offsetStart && !offsetEnd) || (!offsetStart && offsetEnd) || (offsetStart && offsetEnd && !EpubCfiUtils.areOffsetsEqual(offsetStart, offsetEnd))) {
                rangeStartPath.offset = offsetStart ? EpubCfiUtils.copyOffsetNode(offsetStart) : null;
                rangeEndPath.offset = offsetEnd ? EpubCfiUtils.copyOffsetNode(offsetEnd) : null;
                diffFound = true;
            }
            else {
                rangeParentPath.offset = offsetStart ? EpubCfiUtils.copyOffsetNode(offsetStart) : null;
            }
        }
        rangeRootNode.parentPath = rangeParentPath;
        if (diffFound) {
            rangeRootNode.rangeStartPath = rangeStartPath;
            rangeRootNode.rangeEndPath = rangeEndPath;
        }
        return rangeRootNode;
    }
    static isElementStepNode(node) {
        return node.stepValue % 2 === 0;
    }
    static isTextStepNode(node) {
        return node.stepValue % 2 === 1;
    }
    static areAssertionsEqual(assertion1, assertion2) {
        if (assertion1.values.length !== assertion2.values.length) {
            return false;
        }
        if (assertion1.parameters.length !== assertion2.parameters.length) {
            return false;
        }
        if (assertion1.values.some((value, index) => assertion2.values[index] !== value)) {
            return false;
        }
        return assertion1.parameters.every((param1, index) => {
            const param2 = assertion2.parameters[index];
            return param1.name === param2.name && param1.values.length === param2.values.length && param1.values.every((value, valIndex) => {
                return value === param2.values[valIndex];
            });
        });
    }
    static areOffsetsEqual(o1, o2) {
        if (o1.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER && o2.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER) {
            if (o1.characterOffset !== o2.characterOffset) {
                return false;
            }
        }
        else if (o1.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.SPATIAL && o2.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.SPATIAL) {
            if (o1.x !== o2.x || o1.y !== o2.y) {
                return false;
            }
        }
        else if (o1.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL && o2.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL) {
            if (o1.seconds !== o2.seconds || o1.x !== o2.x || o1.y !== o2.y) {
                return false;
            }
        }
        else {
            return false;
        }
        const assertion1 = o1.assertion;
        const assertion2 = o2.assertion;
        return assertion1 && assertion2 ?
            EpubCfiUtils.areAssertionsEqual(assertion1, assertion2) :
            assertion1 === assertion2;
    }
    static areStepsEqual(step1, step2) {
        if (step1.stepValue !== step2.stepValue) {
            return false;
        }
        const assertion1 = step1.assertion;
        const assertion2 = step2.assertion;
        return assertion1 && assertion2 ?
            EpubCfiUtils.areAssertionsEqual(assertion1, assertion2) :
            assertion1 === assertion2;
    }
    static copyAssertionParameterNode(parameterNode) {
        return {
            name: parameterNode.name,
            srcOffset: parameterNode.srcOffset,
            values: parameterNode.values.slice(),
        };
    }
    static copyCharacterOffsetNode(offsetNode) {
        return {
            assertion: offsetNode.assertion ? EpubCfiUtils.copyAssertionNode(offsetNode.assertion) : null,
            characterOffset: offsetNode.characterOffset,
            srcOffset: offsetNode.srcOffset,
            type: offsetNode.type,
        };
    }
    static copySpatialOffsetNode(offsetNode) {
        return {
            assertion: offsetNode.assertion ? EpubCfiUtils.copyAssertionNode(offsetNode.assertion) : null,
            srcOffset: offsetNode.srcOffset,
            type: offsetNode.type,
            x: offsetNode.x,
            y: offsetNode.y,
        };
    }
    static copyTemporalOffsetNode(offsetNode) {
        return {
            assertion: offsetNode.assertion ? EpubCfiUtils.copyAssertionNode(offsetNode.assertion) : null,
            seconds: offsetNode.seconds,
            srcOffset: offsetNode.srcOffset,
            type: offsetNode.type,
            x: offsetNode.x,
            y: offsetNode.y,
        };
    }
}
exports.EpubCfiUtils = EpubCfiUtils;
//# sourceMappingURL=EpubCfiUtils.js.map