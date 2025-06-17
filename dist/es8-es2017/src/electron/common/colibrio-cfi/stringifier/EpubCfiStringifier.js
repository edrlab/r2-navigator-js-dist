"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiStringifier = void 0;
const Utils_js_1 = require("../common/Utils.js");
const EpubCfiOffsetType_js_1 = require("../model/offset/EpubCfiOffsetType.js");
class EpubCfiStringifier {
    static stringifyRootNode(rootNode) {
        let output = ['epubcfi('];
        if (rootNode.parentPath) {
            EpubCfiStringifier.processPath(rootNode.parentPath, output);
        }
        if (rootNode.rangeStartPath || rootNode.rangeEndPath) {
            output.push(',');
            if (rootNode.rangeStartPath) {
                EpubCfiStringifier.processPath(rootNode.rangeStartPath, output);
            }
            if (rootNode.rangeEndPath) {
                output.push(',');
                EpubCfiStringifier.processPath(rootNode.rangeEndPath, output);
            }
        }
        output.push(')');
        return output.join('');
    }
    static processAssertion(assertionNode, output) {
        output.push('[');
        const escapedValues = assertionNode.values.map(escape);
        output.push(escapedValues.join(','));
        for (const parameter of assertionNode.parameters) {
            output.push(';', escape(parameter.name), '=');
            const escapedParameterValues = parameter.values.map(escape);
            output.push(escapedParameterValues.join(','));
        }
        output.push(']');
    }
    static processLocalPath(localPathNode, output) {
        if (localPathNode.indirection) {
            output.push('!');
        }
        for (const stepNode of localPathNode.steps) {
            EpubCfiStringifier.processStep(stepNode, output);
        }
    }
    static processOffset(offsetNode, output) {
        switch (offsetNode.type) {
            case EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER:
                EpubCfiStringifier.processOffsetCharacter(offsetNode, output);
                break;
            case EpubCfiOffsetType_js_1.EpubCfiOffsetType.SPATIAL:
                EpubCfiStringifier.processOffsetSpatial(offsetNode, output);
                break;
            case EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL:
                EpubCfiStringifier.processOffsetTemporal(offsetNode, output);
                break;
        }
        if (offsetNode.assertion) {
            EpubCfiStringifier.processAssertion(offsetNode.assertion, output);
        }
    }
    static processOffsetCharacter(offsetNode, output) {
        output.push(':', offsetNode.characterOffset);
    }
    static processOffsetSpatial(offsetNode, output) {
        output.push('@', offsetNode.x, ':', offsetNode.y);
    }
    static processOffsetTemporal(offsetNode, output) {
        output.push('~', offsetNode.seconds);
        if ((0, Utils_js_1.isNumber)(offsetNode.x) && (0, Utils_js_1.isNumber)(offsetNode.y)) {
            output.push('@', offsetNode.x, ':', offsetNode.y);
        }
    }
    static processPath(pathNode, output) {
        for (let i = 0; i < pathNode.localPaths.length; i++) {
            let localPath = pathNode.localPaths[i];
            EpubCfiStringifier.processLocalPath(localPath, output);
        }
        if (pathNode.offset) {
            EpubCfiStringifier.processOffset(pathNode.offset, output);
        }
    }
    static processStep(stepNode, output) {
        output.push('/', stepNode.stepValue);
        if (stepNode.assertion) {
            EpubCfiStringifier.processAssertion(stepNode.assertion, output);
        }
    }
}
exports.EpubCfiStringifier = EpubCfiStringifier;
function escape(value) {
    return value.replace(/[\^\[\](),;=]/g, match => '^' + match);
}
//# sourceMappingURL=EpubCfiStringifier.js.map