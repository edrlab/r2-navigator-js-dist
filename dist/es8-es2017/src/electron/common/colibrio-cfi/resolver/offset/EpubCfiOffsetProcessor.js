"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiOffsetProcessor = void 0;
const Utils_js_1 = require("../../common/Utils.js");
const EpubCfiOffsetType_js_1 = require("../../model/offset/EpubCfiOffsetType.js");
const EpubCfiIntendedTargetType_js_1 = require("../EpubCfiIntendedTargetType.js");
class EpubCfiOffsetProcessor {
    constructor() {
    }
    processOffset(path) {
        let offset = path.ast.offset;
        if (path.intendedTargetType === EpubCfiIntendedTargetType_js_1.EpubCfiIntendedTargetType.ELEMENT && offset && path.stepsResolved) {
            switch (offset.type) {
                case EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL:
                    this.handleTemporalOffset(path, offset);
                    break;
                case EpubCfiOffsetType_js_1.EpubCfiOffsetType.SPATIAL:
                    this.handleSpatialOffset(path, offset);
                    break;
                case EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER:
                    this.handleElementCharacterOffset(path, offset);
                    break;
            }
        }
        else if (path.intendedTargetType === EpubCfiIntendedTargetType_js_1.EpubCfiIntendedTargetType.TEXT) {
            let characterOffsetHandled = false;
            if (offset) {
                if (offset.type === EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER && path.stepsResolved) {
                    this.resolveCharacterOffset(path, offset.characterOffset);
                    characterOffsetHandled = true;
                }
            }
            if (!characterOffsetHandled) {
                this.resolveCharacterOffset(path, 0);
            }
        }
    }
    handleElementCharacterOffset(path, characterOffset) {
        let targetElement = path.getTargetElement();
        if (targetElement && targetElement.localName === 'img') {
            path.elementCharacterOffset = characterOffset.characterOffset;
        }
    }
    handleSpatialOffset(path, spatialOffset) {
        path.spatialOffset = {
            x: spatialOffset.x,
            y: spatialOffset.y,
        };
    }
    handleTemporalOffset(path, temporalOffset) {
        path.temporalOffset = {
            seconds: temporalOffset.seconds,
        };
        if ((0, Utils_js_1.isNumber)(temporalOffset.x) && (0, Utils_js_1.isNumber)(temporalOffset.y)) {
            path.spatialOffset = {
                x: temporalOffset.x,
                y: temporalOffset.y,
            };
        }
    }
    resolveCharacterOffset(path, characterOffset) {
        let targetNode = path.getTargetNode();
        let participatingNodes = [];
        while (targetNode && !(0, Utils_js_1.isElement)(targetNode)) {
            if ((0, Utils_js_1.isTextNode)(targetNode)) {
                participatingNodes.push(targetNode);
            }
            targetNode = targetNode.nextSibling;
        }
        if (participatingNodes.length > 0) {
            let targetTextNode = participatingNodes.find(textNode => {
                if (characterOffset < textNode.length) {
                    return true;
                }
                characterOffset -= textNode.length;
                return false;
            });
            if (targetTextNode) {
                path.container = targetTextNode;
                path.offset = characterOffset;
            }
            else {
                let lastTextNode = participatingNodes[participatingNodes.length - 1];
                path.container = lastTextNode;
                path.offset = lastTextNode.data.length;
                path.characterOffsetOutOfBounds = characterOffset !== 0;
            }
        }
        else if (characterOffset > 0) {
            path.characterOffsetOutOfBounds = true;
        }
    }
}
exports.EpubCfiOffsetProcessor = EpubCfiOffsetProcessor;
//# sourceMappingURL=EpubCfiOffsetProcessor.js.map