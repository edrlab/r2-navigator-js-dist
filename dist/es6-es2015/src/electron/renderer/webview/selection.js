"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRange = exports.convertRangeInfo = exports.convertRange = exports.createOrderedRange = exports.getCurrentSelectionInfo = exports.cleanupStr = exports.collapseWhitespaces = exports.clearCurrentSelection = void 0;
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function dumpDebug(msg, startNode, startOffset, endNode, endOffset, getCssSelector) {
    console.log("$$$$$$$$$$$$$$$$$ " + msg);
    console.log("**** START");
    console.log("Node type (1=element, 3=text): " + startNode.nodeType);
    if (startNode.nodeType === Node.ELEMENT_NODE) {
        console.log("CSS Selector: " + getCssSelector(startNode));
        console.log("Element children count: " + startNode.childNodes.length);
        if (startOffset >= 0 && startOffset < startNode.childNodes.length) {
            console.log("Child node type (1=element, 3=text): " + startNode.childNodes[startOffset].nodeType);
            if (startNode.childNodes[endOffset].nodeType === Node.ELEMENT_NODE) {
                console.log("Child CSS Selector: " + getCssSelector(startNode.childNodes[endOffset]));
            }
        }
        else {
            console.log("startOffset >= 0 && startOffset < startNode.childNodes.length ... " +
                startOffset + " // " + startNode.childNodes.length);
        }
    }
    if (startNode.parentNode && startNode.parentNode.nodeType === Node.ELEMENT_NODE) {
        console.log("- Parent CSS Selector: " + getCssSelector(startNode.parentNode));
        console.log("- Parent element children count: " + startNode.parentNode.childNodes.length);
    }
    console.log("Offset: " + startOffset);
    console.log("**** END");
    console.log("Node type (1=element, 3=text): " + endNode.nodeType);
    if (endNode.nodeType === Node.ELEMENT_NODE) {
        console.log("CSS Selector: " + getCssSelector(endNode));
        console.log("Element children count: " + endNode.childNodes.length);
        if (endOffset >= 0 && endOffset < endNode.childNodes.length) {
            console.log("Child node type (1=element, 3=text): " + endNode.childNodes[endOffset].nodeType);
            if (endNode.childNodes[endOffset].nodeType === Node.ELEMENT_NODE) {
                console.log("Child CSS Selector: " + getCssSelector(endNode.childNodes[endOffset]));
            }
        }
        else {
            console.log("endOffset >= 0 && endOffset < endNode.childNodes.length ... " +
                endOffset + " // " + endNode.childNodes.length);
        }
    }
    if (endNode.parentNode && endNode.parentNode.nodeType === Node.ELEMENT_NODE) {
        console.log("- Parent CSS Selector: " + getCssSelector(endNode.parentNode));
        console.log("- Parent element children count: " + endNode.parentNode.childNodes.length);
    }
    console.log("Offset: " + endOffset);
    console.log("$$$$$$$$$$$$$$$$$");
}
function clearCurrentSelection(win) {
    var _a;
    const selection = win.getSelection();
    if (!selection) {
        return;
    }
    selection.removeAllRanges();
    if ((_a = win.READIUM2.locationHashOverrideInfo) === null || _a === void 0 ? void 0 : _a.selectionInfo) {
        win.READIUM2.locationHashOverrideInfo.selectionInfo = undefined;
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION_CLEAR_SELECTION);
}
exports.clearCurrentSelection = clearCurrentSelection;
const collapseWhitespaces = (str) => {
    return str.replace(/[\r\n]/g, " ").replace(/\s\s+/g, " ");
};
exports.collapseWhitespaces = collapseWhitespaces;
const cleanupStr = (str) => {
    return (0, exports.collapseWhitespaces)(str).trim();
};
exports.cleanupStr = cleanupStr;
function getCurrentSelectionInfo(win, getCssSelector, computeElementCFI) {
    const selection = win.getSelection();
    if (!selection) {
        return undefined;
    }
    if (selection.isCollapsed) {
        console.log("^^^ SELECTION COLLAPSED.");
        return undefined;
    }
    const rawText = selection.toString();
    const cleanText = (0, exports.collapseWhitespaces)(rawText);
    if (cleanText.length === 0) {
        console.log("^^^ SELECTION TEXT EMPTY.");
        return undefined;
    }
    if (!selection.anchorNode || !selection.focusNode) {
        return undefined;
    }
    const r = selection.rangeCount === 1 ? selection.getRangeAt(0) :
        createOrderedRange(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset);
    if (!r || r.collapsed) {
        console.log("$$$$$$$$$$$$$$$$$ CANNOT GET NON-COLLAPSED SELECTION RANGE?!");
        return undefined;
    }
    const range = normalizeRange(r);
    if (IS_DEV) {
        if (range.startContainer !== r.startContainer) {
            console.log(">>>>>>>>>>>>>>>>>>>>>>> SELECTION RANGE NORMALIZE diff: startContainer");
            console.log(range.startContainer);
            console.log(r.startContainer);
        }
        if (range.startOffset !== r.startOffset) {
            console.log(">>>>>>>>>>>>>>>>>>>>>>> SELECTION RANGE NORMALIZE diff: startOffset");
            console.log(`${range.startOffset} !== ${r.startOffset}`);
        }
        if (range.endContainer !== r.endContainer) {
            console.log(">>>>>>>>>>>>>>>>>>>>>>> SELECTION RANGE NORMALIZE diff: endContainer");
            console.log(range.endContainer);
            console.log(r.endContainer);
        }
        if (range.endOffset !== r.endOffset) {
            console.log(">>>>>>>>>>>>>>>>>>>>>>> SELECTION RANGE NORMALIZE diff: endOffset");
            console.log(`${range.endOffset} !== ${r.endOffset}`);
        }
    }
    const tuple = convertRange(range, getCssSelector, computeElementCFI);
    if (!tuple) {
        console.log("^^^ SELECTION RANGE INFO FAIL?!");
        return undefined;
    }
    const rangeInfo = tuple[0];
    const textInfo = tuple[1];
    if (IS_DEV) {
        if (textInfo.cleanText !== cleanText) {
            console.log(">>>>>>>>>>>>>>>>>>>>>>> SELECTION TEXT INFO diff: cleanText");
            console.log(`${textInfo.cleanText} !== ${cleanText}`);
        }
        if (textInfo.rawText !== rawText) {
            console.log(">>>>>>>>>>>>>>>>>>>>>>> SELECTION TEXT INFO diff: rawText");
            console.log(`${textInfo.rawText} !== ${rawText}`);
        }
    }
    if (IS_DEV && win.READIUM2.DEBUG_VISUALS) {
        const restoredRange = convertRangeInfo(win.document, rangeInfo);
        if (restoredRange) {
            if (restoredRange.startOffset === range.startOffset &&
                restoredRange.endOffset === range.endOffset &&
                restoredRange.startContainer === range.startContainer &&
                restoredRange.endContainer === range.endContainer) {
                console.log("SELECTION RANGE RESTORED OKAY (dev check).");
            }
            else {
                console.log("SELECTION RANGE RESTORE FAIL (dev check).");
                dumpDebug("SELECTION", selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset, getCssSelector);
                dumpDebug("ORDERED RANGE FROM SELECTION", range.startContainer, range.startOffset, range.endContainer, range.endOffset, getCssSelector);
                dumpDebug("RESTORED RANGE", restoredRange.startContainer, restoredRange.startOffset, restoredRange.endContainer, restoredRange.endOffset, getCssSelector);
            }
        }
        else {
            console.log("CANNOT RESTORE SELECTION RANGE ??!");
        }
    }
    else {
    }
    return {
        rangeInfo,
        cleanBefore: textInfo.cleanBefore,
        cleanText: textInfo.cleanText,
        cleanAfter: textInfo.cleanAfter,
        rawBefore: textInfo.rawBefore,
        rawText: textInfo.rawText,
        rawAfter: textInfo.rawAfter,
    };
}
exports.getCurrentSelectionInfo = getCurrentSelectionInfo;
function createOrderedRange(startNode, startOffset, endNode, endOffset) {
    const range = new Range();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    if (!range.collapsed) {
        return range;
    }
    console.log(">>> createOrderedRange COLLAPSED ... RANGE REVERSE?");
    const rangeReverse = new Range();
    rangeReverse.setStart(endNode, endOffset);
    rangeReverse.setEnd(startNode, startOffset);
    if (!rangeReverse.collapsed) {
        console.log(">>> createOrderedRange RANGE REVERSE OK.");
        return range;
    }
    console.log(">>> createOrderedRange RANGE REVERSE ALSO COLLAPSED?!");
    return undefined;
}
exports.createOrderedRange = createOrderedRange;
function convertRange(range, getCssSelector, computeElementCFI) {
    var _a, _b;
    const startIsElement = range.startContainer.nodeType === Node.ELEMENT_NODE;
    const startContainerElement = startIsElement ?
        range.startContainer :
        ((range.startContainer.parentNode && range.startContainer.parentNode.nodeType === Node.ELEMENT_NODE) ?
            range.startContainer.parentNode : undefined);
    if (!startContainerElement) {
        return undefined;
    }
    const startContainerChildTextNodeIndex = startIsElement ? -1 :
        Array.from(startContainerElement.childNodes).indexOf(range.startContainer);
    if (startContainerChildTextNodeIndex < -1) {
        return undefined;
    }
    const startContainerElementCssSelector = getCssSelector(startContainerElement);
    const endIsElement = range.endContainer.nodeType === Node.ELEMENT_NODE;
    const endContainerElement = endIsElement ?
        range.endContainer :
        ((range.endContainer.parentNode && range.endContainer.parentNode.nodeType === Node.ELEMENT_NODE) ?
            range.endContainer.parentNode : undefined);
    if (!endContainerElement) {
        return undefined;
    }
    const endContainerChildTextNodeIndex = endIsElement ? -1 :
        Array.from(endContainerElement.childNodes).indexOf(range.endContainer);
    if (endContainerChildTextNodeIndex < -1) {
        return undefined;
    }
    const endContainerElementCssSelector = getCssSelector(endContainerElement);
    const commonElementAncestor = getCommonAncestorElement(range.startContainer, range.endContainer);
    if (!commonElementAncestor) {
        console.log("^^^ NO RANGE COMMON ANCESTOR?!");
        return undefined;
    }
    if (range.commonAncestorContainer) {
        const rangeCommonAncestorElement = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ?
            range.commonAncestorContainer : range.commonAncestorContainer.parentNode;
        if (rangeCommonAncestorElement && rangeCommonAncestorElement.nodeType === Node.ELEMENT_NODE) {
            if (commonElementAncestor !== rangeCommonAncestorElement) {
                console.log(">>>>>> COMMON ANCESTOR CONTAINER DIFF??!");
                console.log(getCssSelector(commonElementAncestor));
                console.log(getCssSelector(rangeCommonAncestorElement));
            }
        }
    }
    const SELECTION_BEFORE_AFTER_TEXT_LENGTH = 30;
    let rawBefore = "";
    const rawText = range.toString();
    let rawAfter = "";
    let cleanBefore = "";
    const cleanText = (0, exports.collapseWhitespaces)(rawText);
    let cleanAfter = "";
    let currentParent = commonElementAncestor;
    while (currentParent) {
        if (((_a = currentParent.tagName) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "html") {
            break;
        }
        const beforeNeedsToGrow = cleanBefore.length < SELECTION_BEFORE_AFTER_TEXT_LENGTH;
        const afterNeedsToGrow = cleanAfter.length < SELECTION_BEFORE_AFTER_TEXT_LENGTH;
        if (!beforeNeedsToGrow && !afterNeedsToGrow) {
            break;
        }
        if (beforeNeedsToGrow) {
            try {
                const rangeBefore = new Range();
                rangeBefore.setStartBefore(currentParent);
                rangeBefore.setEnd(range.startContainer, range.startOffset);
                rawBefore = rangeBefore.toString();
                cleanBefore = (0, exports.collapseWhitespaces)(rawBefore);
                if (cleanBefore.length > SELECTION_BEFORE_AFTER_TEXT_LENGTH) {
                    cleanBefore = cleanBefore.substring(cleanBefore.length - SELECTION_BEFORE_AFTER_TEXT_LENGTH, cleanBefore.length);
                }
            }
            catch (ex1) {
                console.log(ex1);
            }
        }
        if (afterNeedsToGrow) {
            try {
                const rangeAfter = new Range();
                rangeAfter.setStart(range.endContainer, range.endOffset);
                rangeAfter.setEndAfter(currentParent);
                rawAfter = rangeAfter.toString();
                cleanAfter = (0, exports.collapseWhitespaces)(rawAfter);
                if (cleanAfter.length > SELECTION_BEFORE_AFTER_TEXT_LENGTH) {
                    cleanAfter = cleanAfter.substring(0, SELECTION_BEFORE_AFTER_TEXT_LENGTH);
                }
            }
            catch (ex2) {
                console.log(ex2);
            }
        }
        if (((_b = currentParent.tagName) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "body") {
            break;
        }
        currentParent = currentParent.parentNode;
    }
    if (cleanBefore.length) {
        let j = 0;
        let i = rawBefore.length - 1;
        let wasWhiteSpace = false;
        for (; i >= 0; i--) {
            const isWhiteSpace = /[\r\n\s]/.test(rawBefore[i]);
            if (isWhiteSpace && i !== 0 && i !== rawBefore.length - 1 && wasWhiteSpace) {
                wasWhiteSpace = isWhiteSpace;
                continue;
            }
            wasWhiteSpace = isWhiteSpace;
            j++;
            if (j >= cleanBefore.length) {
                break;
            }
        }
        rawBefore = rawBefore.substring(i, rawBefore.length);
    }
    if (cleanAfter.length) {
        let j = 0;
        let i = 0;
        let wasWhiteSpace = false;
        for (; i < rawAfter.length; i++) {
            const isWhiteSpace = /[\r\n\s]/.test(rawAfter[i]);
            if (isWhiteSpace && i !== 0 && i !== rawAfter.length - 1 && wasWhiteSpace) {
                wasWhiteSpace = isWhiteSpace;
                continue;
            }
            wasWhiteSpace = isWhiteSpace;
            j++;
            if (j >= cleanAfter.length) {
                break;
            }
        }
        rawAfter = rawAfter.substring(0, i + 1);
    }
    const rootElementCfi = computeElementCFI(commonElementAncestor);
    const startElementCfi = computeElementCFI(startContainerElement);
    const endElementCfi = computeElementCFI(endContainerElement);
    let cfi;
    if (rootElementCfi && startElementCfi && endElementCfi) {
        let startElementOrTextCfi = startElementCfi;
        if (!startIsElement) {
            const startContainerChildTextNodeIndexForCfi = getChildTextNodeCfiIndex(startContainerElement, range.startContainer);
            startElementOrTextCfi = startElementCfi + "/" +
                startContainerChildTextNodeIndexForCfi + ":" + range.startOffset;
        }
        else {
            if (range.startOffset >= 0 && range.startOffset < startContainerElement.childNodes.length) {
                const childNode = startContainerElement.childNodes[range.startOffset];
                if (childNode.nodeType === Node.ELEMENT_NODE) {
                    startElementOrTextCfi = startElementCfi + "/" + ((range.startOffset + 1) * 2);
                }
                else {
                    const cfiTextNodeIndex = getChildTextNodeCfiIndex(startContainerElement, childNode);
                    startElementOrTextCfi = startElementCfi + "/" + cfiTextNodeIndex;
                }
            }
            else {
                const cfiIndexOfLastElement = ((startContainerElement.childElementCount) * 2);
                const lastChildNode = startContainerElement.childNodes[startContainerElement.childNodes.length - 1];
                if (lastChildNode.nodeType === Node.ELEMENT_NODE) {
                    startElementOrTextCfi = startElementCfi + "/" + (cfiIndexOfLastElement + 1);
                }
                else {
                    startElementOrTextCfi = startElementCfi + "/" + (cfiIndexOfLastElement + 2);
                }
            }
        }
        let endElementOrTextCfi = endElementCfi;
        if (!endIsElement) {
            const endContainerChildTextNodeIndexForCfi = getChildTextNodeCfiIndex(endContainerElement, range.endContainer);
            endElementOrTextCfi = endElementCfi + "/" +
                endContainerChildTextNodeIndexForCfi + ":" + range.endOffset;
        }
        else {
            if (range.endOffset >= 0 && range.endOffset < endContainerElement.childNodes.length) {
                const childNode = endContainerElement.childNodes[range.endOffset];
                if (childNode.nodeType === Node.ELEMENT_NODE) {
                    endElementOrTextCfi = endElementCfi + "/" + ((range.endOffset + 1) * 2);
                }
                else {
                    const cfiTextNodeIndex = getChildTextNodeCfiIndex(endContainerElement, childNode);
                    endElementOrTextCfi = endElementCfi + "/" + cfiTextNodeIndex;
                }
            }
            else {
                const cfiIndexOfLastElement = ((endContainerElement.childElementCount) * 2);
                const lastChildNode = endContainerElement.childNodes[endContainerElement.childNodes.length - 1];
                if (lastChildNode.nodeType === Node.ELEMENT_NODE) {
                    endElementOrTextCfi = endElementCfi + "/" + (cfiIndexOfLastElement + 1);
                }
                else {
                    endElementOrTextCfi = endElementCfi + "/" + (cfiIndexOfLastElement + 2);
                }
            }
        }
        cfi = rootElementCfi + "," +
            startElementOrTextCfi.replace(rootElementCfi, "") + "," +
            endElementOrTextCfi.replace(rootElementCfi, "");
    }
    return [{
            cfi,
            endContainerChildTextNodeIndex,
            endContainerElementCFI: endElementCfi,
            endContainerElementCssSelector,
            endOffset: range.endOffset,
            startContainerChildTextNodeIndex,
            startContainerElementCFI: startElementCfi,
            startContainerElementCssSelector,
            startOffset: range.startOffset,
        }, {
            cleanBefore,
            cleanText,
            cleanAfter,
            rawBefore,
            rawText,
            rawAfter,
        }];
}
exports.convertRange = convertRange;
function convertRangeInfo(documant, rangeInfo) {
    const startElement = documant.querySelector(rangeInfo.startContainerElementCssSelector);
    if (!startElement) {
        console.log("^^^ convertRangeInfo NO START ELEMENT CSS SELECTOR?!", rangeInfo.startContainerElementCssSelector);
        return undefined;
    }
    let startContainer = startElement;
    if (rangeInfo.startContainerChildTextNodeIndex >= 0) {
        if (rangeInfo.startContainerChildTextNodeIndex >= startElement.childNodes.length) {
            console.log("^^^ convertRangeInfo rangeInfo.startContainerChildTextNodeIndex >= startElement.childNodes.length?!");
            return undefined;
        }
        startContainer = startElement.childNodes[rangeInfo.startContainerChildTextNodeIndex];
        if (startContainer.nodeType !== Node.TEXT_NODE) {
            console.log("^^^ convertRangeInfo startContainer.nodeType !== Node.TEXT_NODE?!");
            return undefined;
        }
    }
    const endElement = documant.querySelector(rangeInfo.endContainerElementCssSelector);
    if (!endElement) {
        console.log("^^^ convertRangeInfo NO END ELEMENT CSS SELECTOR?!", rangeInfo.endContainerElementCssSelector);
        return undefined;
    }
    let endContainer = endElement;
    if (rangeInfo.endContainerChildTextNodeIndex >= 0) {
        if (rangeInfo.endContainerChildTextNodeIndex >= endElement.childNodes.length) {
            console.log("^^^ convertRangeInfo rangeInfo.endContainerChildTextNodeIndex >= endElement.childNodes.length?!");
            return undefined;
        }
        endContainer = endElement.childNodes[rangeInfo.endContainerChildTextNodeIndex];
        if (endContainer.nodeType !== Node.TEXT_NODE) {
            console.log("^^^ convertRangeInfo endContainer.nodeType !== Node.TEXT_NODE?!");
            return undefined;
        }
    }
    return createOrderedRange(startContainer, rangeInfo.startOffset, endContainer, rangeInfo.endOffset);
}
exports.convertRangeInfo = convertRangeInfo;
function getCommonAncestorElement(node1, node2) {
    if (node1.nodeType === Node.ELEMENT_NODE && node1 === node2) {
        return node1;
    }
    if (node1.nodeType === Node.ELEMENT_NODE && node1.contains(node2)) {
        return node1;
    }
    if (node2.nodeType === Node.ELEMENT_NODE && node2.contains(node1)) {
        return node2;
    }
    const node1ElementAncestorChain = [];
    let parent = node1.parentNode;
    while (parent && parent.nodeType === Node.ELEMENT_NODE) {
        node1ElementAncestorChain.push(parent);
        parent = parent.parentNode;
    }
    const node2ElementAncestorChain = [];
    parent = node2.parentNode;
    while (parent && parent.nodeType === Node.ELEMENT_NODE) {
        node2ElementAncestorChain.push(parent);
        parent = parent.parentNode;
    }
    let commonAncestor = node1ElementAncestorChain.find((node1ElementAncestor) => {
        return node2ElementAncestorChain.indexOf(node1ElementAncestor) >= 0;
    });
    if (!commonAncestor) {
        commonAncestor = node2ElementAncestorChain.find((node2ElementAncestor) => {
            return node1ElementAncestorChain.indexOf(node2ElementAncestor) >= 0;
        });
    }
    return commonAncestor;
}
function isCfiTextNode(node) {
    return node.nodeType !== Node.ELEMENT_NODE;
}
function getChildTextNodeCfiIndex(element, child) {
    let found = -1;
    let textNodeIndex = -1;
    let previousWasElement = false;
    for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = element.childNodes[i];
        const isText = isCfiTextNode(childNode);
        if (isText || previousWasElement) {
            textNodeIndex += 2;
        }
        if (isText) {
            if (childNode === child) {
                found = textNodeIndex;
                break;
            }
        }
        previousWasElement = childNode.nodeType === Node.ELEMENT_NODE;
    }
    return found;
}
function normalizeRange(r) {
    const range = r.cloneRange();
    let sc = range.startContainer;
    let so = range.startOffset;
    let ec = range.endContainer;
    let eo = range.endOffset;
    if (sc.childNodes.length && so > 0) {
        sc = lastLeaf(sc.childNodes[so - 1]);
        so = sc.length || 0;
    }
    if (eo < ec.childNodes.length) {
        ec = firstLeaf(ec.childNodes[eo]);
        eo = 0;
    }
    let start = firstLeaf(sc);
    let end = lastLeaf(ec);
    function isLeafNodeInRange(node) {
        if (node.childNodes.length) {
            return false;
        }
        const length = node.length || 0;
        if (node === sc && so === length) {
            return false;
        }
        if (node === ec && eo === 0) {
            return false;
        }
        return true;
    }
    while (start && !isLeafNodeInRange(start) && start !== end) {
        start = documentForward(start);
    }
    if (start === sc) {
        range.setStart(sc, so);
    }
    else if (start !== null) {
        if (start.nodeType === 3) {
            range.setStart(start, 0);
        }
        else {
            range.setStartBefore(start);
        }
    }
    while (end && !isLeafNodeInRange(end) && end !== start) {
        end = documentReverse(end);
    }
    if (end === ec) {
        range.setEnd(ec, eo);
    }
    else if (end !== null) {
        if (end.nodeType === 3) {
            range.setEnd(end, end.length);
        }
        else {
            range.setEndAfter(end);
        }
    }
    return range;
}
exports.normalizeRange = normalizeRange;
function documentForward(node) {
    if (node.firstChild) {
        return node.firstChild;
    }
    let n = node;
    while (!n.nextSibling) {
        n = n.parentNode;
        if (!n) {
            return null;
        }
    }
    return n.nextSibling;
}
function documentReverse(node) {
    if (node.lastChild) {
        return node.lastChild;
    }
    let n = node;
    while (!n.previousSibling) {
        n = n.parentNode;
        if (!n) {
            return null;
        }
    }
    return n.previousSibling;
}
function firstLeaf(node) {
    while (node.firstChild) {
        node = node.firstChild;
    }
    return node;
}
function lastLeaf(node) {
    while (node.lastChild) {
        node = node.lastChild;
    }
    return node;
}
//# sourceMappingURL=selection.js.map