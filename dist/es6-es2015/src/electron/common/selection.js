"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sameSelections = exports.sameRanges = void 0;
function sameRanges(r1, r2) {
    if (!r1 || !r2) {
        return false;
    }
    if (r1.startContainerElementCssSelector !== r2.startContainerElementCssSelector) {
        return false;
    }
    if (r1.startContainerChildTextNodeIndex !== r2.startContainerChildTextNodeIndex) {
        return false;
    }
    if (r1.startOffset !== r2.startOffset) {
        return false;
    }
    if (r1.endContainerElementCssSelector !== r2.endContainerElementCssSelector) {
        return false;
    }
    if (r1.endContainerChildTextNodeIndex !== r2.endContainerChildTextNodeIndex) {
        return false;
    }
    if (r1.endOffset !== r2.endOffset) {
        return false;
    }
    return true;
}
exports.sameRanges = sameRanges;
function sameSelections(sel1, sel2) {
    if (!sel1 || !sel2) {
        return false;
    }
    if (!sameRanges(sel1.rangeInfo, sel2.rangeInfo)) {
        return false;
    }
    if (sel1.cleanText !== sel2.cleanText) {
        console.log("SAME RANGES BUT DIFFERENT CLEAN TEXT??");
        return false;
    }
    if (sel1.rawText !== sel2.rawText) {
        console.log("SAME RANGES BUT DIFFERENT RAW TEXT??");
        return false;
    }
    return true;
}
exports.sameSelections = sameSelections;
//# sourceMappingURL=selection.js.map