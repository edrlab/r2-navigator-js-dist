"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlightsGroup = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.setDrawMargin = void 0;
const crypto = require("crypto");
const debounce = require("debounce");
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const highlight_1 = require("../../common/highlight");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const rect_utils_1 = require("../common/rect-utils");
const readium_css_1 = require("./readium-css");
const selection_1 = require("./selection");
const styles_1 = require("../../common/styles");
const readium_css_2 = require("./readium-css");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const DEFAULT_BACKGROUND_COLOR = {
    blue: 0,
    green: 0,
    red: 255,
};
const _highlights = [];
let _drawMargin = false;
const drawMargin = (h) => {
    if (Array.isArray(_drawMargin)) {
        if (h.group) {
            return _drawMargin.includes(h.group);
        }
        return false;
    }
    return _drawMargin;
};
const setDrawMargin = (win, drawMargin) => {
    _drawMargin = drawMargin;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- _drawMargin: " + JSON.stringify(_drawMargin, null, 4));
    }
    recreateAllHighlightsRaw(win);
};
exports.setDrawMargin = setDrawMargin;
function getBoundingClientRectOfDocumentBody(win) {
    return win.document.body.getBoundingClientRect();
}
exports.getBoundingClientRectOfDocumentBody = getBoundingClientRectOfDocumentBody;
function processMouseEvent(win, ev) {
    if (!_highlightsContainer) {
        return;
    }
    const isMouseMove = ev.type === "mousemove";
    if (isMouseMove) {
        if (ev.buttons > 0) {
            return;
        }
        if (!_highlights.length) {
            return;
        }
    }
    const documant = win.document;
    const scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    const x = ev.clientX;
    const y = ev.clientY;
    const paginated = (0, readium_css_inject_1.isPaginated)(documant);
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const testHit = (highlightFragment) => {
        const withRect = highlightFragment;
        const left = withRect.rect.left + xOffset;
        const top = withRect.rect.top + yOffset;
        if (x >= left &&
            x < (left + withRect.rect.width) &&
            y >= top &&
            y < (top + withRect.rect.height)) {
            return true;
        }
        return false;
    };
    let changeCursor = false;
    let foundHighlight;
    let foundElement;
    for (let i = _highlights.length - 1; i >= 0; i--) {
        const highlight = _highlights[i];
        let highlightParent = documant.getElementById(`${highlight.id}`);
        if (!highlightParent) {
            highlightParent = _highlightsContainer.querySelector(`#${highlight.id}`);
        }
        if (!highlightParent) {
            continue;
        }
        let hit = false;
        let highlightFragment = highlightParent.firstElementChild;
        while (highlightFragment) {
            if (highlightFragment.classList.contains(styles_1.CLASS_HIGHLIGHT_AREA)) {
                if (testHit(highlightFragment)) {
                    changeCursor = true;
                    hit = true;
                    break;
                }
            }
            else if (highlightFragment.classList.contains(styles_1.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN)) {
                if (testHit(highlightFragment)) {
                    changeCursor = true;
                    hit = true;
                    break;
                }
            }
            highlightFragment = highlightFragment.nextElementSibling;
        }
        if (hit) {
            foundHighlight = highlight;
            foundElement = highlightParent;
            break;
        }
    }
    if (!foundHighlight || !foundElement) {
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR1);
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        let highlightContainer = _highlightsContainer.firstElementChild;
        while (highlightContainer) {
            highlightContainer.classList.remove(styles_1.CLASS_HIGHLIGHT_HOVER);
            highlightContainer = highlightContainer.nextElementSibling;
        }
        return;
    }
    if (foundHighlight.pointerInteraction) {
        if (isMouseMove) {
            const doDrawMargin = drawMargin(foundHighlight);
            foundElement.classList.add(styles_1.CLASS_HIGHLIGHT_HOVER);
            if (changeCursor) {
                documant.documentElement.classList.add(doDrawMargin ? styles_1.CLASS_HIGHLIGHT_CURSOR1 : styles_1.CLASS_HIGHLIGHT_CURSOR2);
            }
        }
        else if (ev.type === "mouseup" || ev.type === "click") {
            ev.preventDefault();
            ev.stopPropagation();
            const payload = {
                highlight: foundHighlight,
                event: {
                    type: ev.type,
                    button: ev.button,
                    alt: ev.altKey,
                    shift: ev.shiftKey,
                    ctrl: ev.ctrlKey,
                    meta: ev.metaKey,
                    x: ev.clientX,
                    y: ev.clientY,
                },
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_HIGHLIGHT_CLICK, payload);
        }
    }
}
let lastMouseDownX = -1;
let lastMouseDownY = -1;
let bodyEventListenersSet = false;
let _highlightsContainer;
function ensureHighlightsContainer(win) {
    const documant = win.document;
    if (!_highlightsContainer) {
        if (!bodyEventListenersSet) {
            bodyEventListenersSet = true;
            documant.body.addEventListener("mousedown", (ev) => {
                lastMouseDownX = ev.clientX;
                lastMouseDownY = ev.clientY;
            }, false);
            documant.body.addEventListener("mouseup", (ev) => {
                if ((Math.abs(lastMouseDownX - ev.clientX) < 3) &&
                    (Math.abs(lastMouseDownY - ev.clientY) < 3)) {
                    processMouseEvent(win, ev);
                }
            }, false);
            documant.body.addEventListener("mousemove", (ev) => {
                processMouseEvent(win, ev);
            }, false);
        }
        _highlightsContainer = documant.createElement("div");
        _highlightsContainer.setAttribute("id", styles_1.ID_HIGHLIGHTS_CONTAINER);
        _highlightsContainer.setAttribute("class", styles_1.CLASS_HIGHLIGHT_COMMON);
        _highlightsContainer.setAttribute("style", "width: auto !important; " +
            "height: auto !important; ");
        documant.body.append(_highlightsContainer);
    }
    return _highlightsContainer;
}
function hideAllhighlights(_documant) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- hideAllhighlights: " + _highlights.length);
    }
    if (_highlightsContainer) {
        _highlightsContainer.remove();
        _highlightsContainer = null;
    }
}
exports.hideAllhighlights = hideAllhighlights;
function destroyAllhighlights(documant) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyAllhighlights: " + _highlights.length);
    }
    hideAllhighlights(documant);
    _highlights.splice(0, _highlights.length);
}
exports.destroyAllhighlights = destroyAllhighlights;
function destroyHighlight(documant, id) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlight: " + id + " ... " + _highlights.length);
    }
    let i = -1;
    const highlight = _highlights.find((h, j) => {
        i = j;
        return h.id === id;
    });
    if (highlight && i >= 0 && i < _highlights.length) {
        _highlights.splice(i, 1);
    }
    const highlightContainer = documant.getElementById(id);
    if (highlightContainer) {
        highlightContainer.remove();
    }
}
exports.destroyHighlight = destroyHighlight;
function destroyHighlightsGroup(documant, group) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlightsGroup: " + group + " ... " + _highlights.length);
    }
    while (true) {
        let i = -1;
        const highlight = _highlights.find((h, j) => {
            i = j;
            return h.group === group;
        });
        if (highlight) {
            if (i >= 0 && i < _highlights.length) {
                _highlights.splice(i, 1);
            }
            const highlightContainer = documant.getElementById(highlight.id);
            if (highlightContainer) {
                highlightContainer.remove();
            }
        }
        else {
            break;
        }
    }
}
exports.destroyHighlightsGroup = destroyHighlightsGroup;
function recreateAllHighlightsRaw(win, highlights) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw: " + _highlights.length + " ==> " + (highlights === null || highlights === void 0 ? void 0 : highlights.length));
    }
    const documant = win.document;
    if (highlights === null || highlights === void 0 ? void 0 : highlights.length) {
        if (_highlights.length) {
            if (IS_DEV) {
                console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw DESTROY OLD BEFORE RESTORE BACKUP: " + _highlights.length + " ==> " + highlights.length);
            }
            destroyAllhighlights(documant);
        }
        if (IS_DEV) {
            console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw RESTORE BACKUP: " + _highlights.length + " ==> " + highlights.length);
        }
        _highlights.push(...highlights);
    }
    if (!_highlights.length) {
        return;
    }
    if (!documant.body) {
        if (IS_DEV) {
            console.log("--HIGH WEBVIEW-- NO BODY?! (retrying...): " + _highlights.length);
        }
        (0, exports.recreateAllHighlightsDebounced)(win);
        return;
    }
    hideAllhighlights(documant);
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const bodyComputedStyle = win.getComputedStyle(documant.body);
    const docFrag = documant.createDocumentFragment();
    for (const highlight of _highlights) {
        const div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
        if (div) {
            docFrag.append(div);
        }
    }
    const highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
}
exports.recreateAllHighlightsRaw = recreateAllHighlightsRaw;
exports.recreateAllHighlightsDebounced = debounce((win) => {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsDebounced: " + _highlights.length);
    }
    recreateAllHighlightsRaw(win);
}, 500);
function recreateAllHighlights(win) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlights: " + _highlights.length);
    }
    hideAllhighlights(win.document);
    (0, exports.recreateAllHighlightsDebounced)(win);
}
exports.recreateAllHighlights = recreateAllHighlights;
function createHighlights(win, highDefs, pointerInteraction) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlights: " + highDefs.length + " ... " + _highlights.length);
    }
    const documant = win.document;
    const highlights = [];
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const bodyComputedStyle = win.getComputedStyle(documant.body);
    const docFrag = documant.createDocumentFragment();
    for (const highDef of highDefs) {
        if (!highDef.selectionInfo && !highDef.range) {
            highlights.push(null);
            continue;
        }
        const [high, div] = createHighlight(win, highDef.selectionInfo, highDef.range, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, highDef.group, bodyRect, bodyComputedStyle);
        highlights.push(high);
        if (div) {
            docFrag.append(div);
        }
    }
    const highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
    return highlights;
}
exports.createHighlights = createHighlights;
const computeCFI = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        if (node.parentNode) {
            return computeCFI(node.parentNode);
        }
        return undefined;
    }
    let cfi = "";
    let currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        const currentElementParentChildren = currentElement.parentNode.children;
        let currentElementIndex = -1;
        for (let i = 0; i < currentElementParentChildren.length; i++) {
            if (currentElement === currentElementParentChildren[i]) {
                currentElementIndex = i;
                break;
            }
        }
        if (currentElementIndex >= 0) {
            const cfiIndex = (currentElementIndex + 1) * 2;
            cfi = cfiIndex +
                (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                (cfi.length ? ("/" + cfi) : "");
        }
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
function createHighlight(win, selectionInfo, range, color, pointerInteraction, drawType, expand, group, bodyRect, bodyComputedStyle) {
    const uniqueStr = selectionInfo ? `${selectionInfo.rangeInfo.startContainerElementCssSelector}${selectionInfo.rangeInfo.startContainerChildTextNodeIndex}${selectionInfo.rangeInfo.startOffset}${selectionInfo.rangeInfo.endContainerElementCssSelector}${selectionInfo.rangeInfo.endContainerChildTextNodeIndex}${selectionInfo.rangeInfo.endOffset}` : range ? `${range.startOffset}-${range.endOffset}-${computeCFI(range.startContainer)}-${computeCFI(range.endContainer)}` : "_RANGE_";
    const checkSum = crypto.createHash("sha1");
    checkSum.update(uniqueStr);
    const shaHex = checkSum.digest("hex");
    const idBase = "R2_HIGHLIGHT_" + shaHex;
    let id = idBase;
    let idIdx = 0;
    while (_highlights.find((h) => h.id === id) ||
        win.document.getElementById(id)) {
        if (IS_DEV) {
            console.log("HIGHLIGHT ID already exists, increment: " + uniqueStr + " ==> " + id);
        }
        id = `${idBase}_${idIdx++}`;
    }
    const highlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        drawType,
        expand,
        id,
        pointerInteraction,
        selectionInfo,
        range,
        group,
    };
    _highlights.push(highlight);
    const div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight, bodyRect, bodyComputedStyle) {
    const documant = win.document;
    const scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    const range = highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : highlight.range;
    if (!range) {
        return null;
    }
    const drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline;
    const drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough;
    const paginated = (0, readium_css_inject_1.isPaginated)(documant);
    const paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    const rtl = (0, readium_css_2.isRTL)();
    const vertical = (0, readium_css_1.isVerticalWritingMode)();
    const doDrawMargin = drawMargin(highlight);
    const highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_CONTAINER} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
    highlightParent.setAttribute("data-type", `${highlight.drawType}`);
    if (highlight.group) {
        highlightParent.setAttribute("data-group", highlight.group);
    }
    if (doDrawMargin) {
        highlightParent.classList.add(styles_1.CLASS_HIGHLIGHT_MARGIN);
    }
    const styleAttr = win.document.documentElement.getAttribute("style");
    const isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
    highlightParent.style.setProperty("mix-blend-mode", isNight ? "hard-light" : "multiply", "important");
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    const expand = highlight.expand ? highlight.expand : 0;
    const rangeClientRects = range.getClientRects();
    const clientRects = (0, rect_utils_1.getClientRectsNoOverlap_)(rangeClientRects, doNotMergeHorizontallyAlignedRects, expand);
    const underlineThickness = 3;
    const strikeThroughLineThickness = 4;
    const rangeBoundingClientRect = range.getBoundingClientRect();
    const bodyWidth = parseInt(bodyComputedStyle.width, 10);
    const paginatedWidth = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
    const paginatedOffset = (paginatedWidth - bodyWidth) / 2 + parseInt(bodyComputedStyle.paddingLeft, 10);
    for (const clientRect of clientRects) {
        {
            if (drawStrikeThrough) {
                const highlightAreaLine = documant.createElement("div");
                highlightAreaLine.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_AREA} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
                highlightAreaLine.setAttribute("style", `background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;`);
                highlightAreaLine.scale = scale;
                highlightAreaLine.rect = {
                    height: clientRect.height,
                    left: clientRect.left - xOffset,
                    top: clientRect.top - yOffset,
                    width: clientRect.width,
                };
                highlightAreaLine.style.setProperty("width", `${(vertical ? strikeThroughLineThickness : highlightAreaLine.rect.width) * scale}px`, "important");
                highlightAreaLine.style.setProperty("height", `${(vertical ? highlightAreaLine.rect.height : strikeThroughLineThickness) * scale}px`, "important");
                highlightAreaLine.style.setProperty("min-width", highlightAreaLine.style.width, "important");
                highlightAreaLine.style.setProperty("min-height", highlightAreaLine.style.height, "important");
                highlightAreaLine.style.setProperty("left", `${(vertical ? (highlightAreaLine.rect.left + (highlightAreaLine.rect.width / 2) - (strikeThroughLineThickness / 2)) : highlightAreaLine.rect.left) * scale}px`, "important");
                highlightAreaLine.style.setProperty("top", `${(vertical ? highlightAreaLine.rect.top : (highlightAreaLine.rect.top + (highlightAreaLine.rect.height / 2) - (strikeThroughLineThickness / 2))) * scale}px`, "important");
                highlightParent.append(highlightAreaLine);
            }
            else {
                const highlightArea = documant.createElement("div");
                highlightArea.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_AREA} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
                let extra = "";
                if (drawUnderline) {
                    const side = (0, readium_css_1.isVerticalWritingMode)() ? "left" : "bottom";
                    extra = `border-${side}: ${underlineThickness * scale}px solid ` +
                        `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important`;
                }
                highlightArea.setAttribute("style", (drawUnderline ?
                    "" :
                    ("background-color: " +
                        `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;`)) + ` ${extra}`);
                highlightArea.scale = scale;
                highlightArea.rect = {
                    height: clientRect.height,
                    left: clientRect.left - xOffset,
                    top: clientRect.top - yOffset,
                    width: clientRect.width,
                };
                highlightArea.style.setProperty("width", `${highlightArea.rect.width * scale}px`, "important");
                highlightArea.style.setProperty("height", `${highlightArea.rect.height * scale}px`, "important");
                highlightArea.style.setProperty("min-width", highlightArea.style.width, "important");
                highlightArea.style.setProperty("min-height", highlightArea.style.height, "important");
                highlightArea.style.setProperty("left", `${highlightArea.rect.left * scale}px`, "important");
                highlightArea.style.setProperty("top", `${highlightArea.rect.top * scale}px`, "important");
                highlightParent.append(highlightArea);
            }
        }
    }
    if (doDrawMargin && highlight.pointerInteraction) {
        const MARGIN_MARKER_THICKNESS = 18 / (win.READIUM2.isFixedLayout ? scale : 1);
        const MARGIN_MARKER_OFFSET = 4 / (win.READIUM2.isFixedLayout ? scale : 1);
        const highlightBoundingMargin = documant.createElement("div");
        highlightBoundingMargin.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
        const round = MARGIN_MARKER_THICKNESS / 1.5;
        highlightBoundingMargin.setAttribute("style", `border-top-left-radius: ${vertical ? round : rtl ? 0 : round}px;` +
            `border-top-right-radius: ${vertical ? round : !rtl ? 0 : round}px;` +
            `border-bottom-right-radius: ${vertical ? 0 : !rtl ? 0 : round}px;` +
            `border-bottom-left-radius: ${vertical ? 0 : rtl ? 0 : round}px;` +
            "background-color: " +
            `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;`);
        highlightBoundingMargin.scale = scale;
        const paginatedOffset_ = paginatedOffset - MARGIN_MARKER_OFFSET - MARGIN_MARKER_THICKNESS;
        highlightBoundingMargin.rect = {
            left: vertical ?
                (rangeBoundingClientRect.left - xOffset) :
                paginated ?
                    ((rtl
                        ?
                            paginatedWidth - MARGIN_MARKER_THICKNESS
                        :
                            0)
                        +
                            (rtl
                                ?
                                    -1 * paginatedOffset_
                                :
                                    paginatedOffset_)
                        +
                            Math.floor((rangeBoundingClientRect.left - xOffset) / paginatedWidth) * paginatedWidth)
                    :
                        (rtl
                            ?
                                MARGIN_MARKER_OFFSET + bodyRect.width - parseInt(bodyComputedStyle.paddingRight, 10)
                            :
                                win.READIUM2.isFixedLayout
                                    ?
                                        MARGIN_MARKER_OFFSET
                                    :
                                        parseInt(bodyComputedStyle.paddingLeft, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET),
            top: vertical
                ?
                    parseInt(bodyComputedStyle.paddingTop, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET
                :
                    (rangeBoundingClientRect.top - yOffset),
            width: vertical ? rangeBoundingClientRect.width : MARGIN_MARKER_THICKNESS,
            height: vertical ? MARGIN_MARKER_THICKNESS : rangeBoundingClientRect.height,
        };
        highlightBoundingMargin.style.setProperty("width", `${highlightBoundingMargin.rect.width * scale}px`, "important");
        highlightBoundingMargin.style.setProperty("height", `${highlightBoundingMargin.rect.height * scale}px`, "important");
        highlightBoundingMargin.style.setProperty("min-width", highlightBoundingMargin.style.width, "important");
        highlightBoundingMargin.style.setProperty("min-height", highlightBoundingMargin.style.height, "important");
        highlightBoundingMargin.style.setProperty("left", `${highlightBoundingMargin.rect.left * scale}px`, "important");
        highlightBoundingMargin.style.setProperty("top", `${highlightBoundingMargin.rect.top * scale}px`, "important");
        highlightParent.append(highlightBoundingMargin);
    }
    const highlightBounding = documant.createElement("div");
    highlightBounding.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_BOUNDING_AREA} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
    highlightBounding.scale = scale;
    const leftBase = rangeBoundingClientRect.left - xOffset - expand;
    const leftOff = (paginatedWidth - bodyWidth) / 2;
    highlightBounding.rect = {
        left: paginated
            ?
                rtl
                    ?
                        leftBase - leftOff - paginatedWidth
                    :
                        leftBase - leftOff
            :
                leftBase,
        top: rangeBoundingClientRect.top - yOffset - expand,
        width: rangeBoundingClientRect.width + expand * 2,
        height: rangeBoundingClientRect.height + expand * 2,
    };
    highlightBounding.style.setProperty("width", `${highlightBounding.rect.width * scale}px`, "important");
    highlightBounding.style.setProperty("height", `${highlightBounding.rect.height * scale}px`, "important");
    highlightBounding.style.setProperty("min-width", highlightBounding.style.width, "important");
    highlightBounding.style.setProperty("min-height", highlightBounding.style.height, "important");
    highlightBounding.style.setProperty("left", `${highlightBounding.rect.left * scale}px`, "important");
    highlightBounding.style.setProperty("top", `${highlightBounding.rect.top * scale}px`, "important");
    highlightParent.append(highlightBounding);
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map