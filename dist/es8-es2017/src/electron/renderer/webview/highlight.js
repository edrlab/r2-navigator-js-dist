"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlightsGroup = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN = exports.CLASS_HIGHLIGHT_BOUNDING_AREA = exports.CLASS_HIGHLIGHT_AREA = exports.CLASS_HIGHLIGHT_CONTAINER = void 0;
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
exports.CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
exports.CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
exports.CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN";
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const DEBUG_VISUALS = false;
const USE_SVG = false;
const USE_BLEND_MODE = true;
const DEFAULT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 0.8 : 0.3;
const ALT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 1 : 0.45;
const ALT_OTHER_BACKGROUND_COLOR_OPACITY = 0.2;
const DEFAULT_BACKGROUND_COLOR = {
    blue: 100,
    green: 50,
    red: 230,
};
const _highlights = [];
let _drawMarginMarkers = false;
const SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
function getBoundingClientRectOfDocumentBody(win) {
    return win.document.body.getBoundingClientRect();
}
exports.getBoundingClientRectOfDocumentBody = getBoundingClientRectOfDocumentBody;
function resetHighlightBoundingStyle(_win, highlightBounding) {
    if (!highlightBounding.active) {
        return;
    }
    highlightBounding.active = false;
    highlightBounding.style.setProperty("outline", "none", "important");
    highlightBounding.style.setProperty("background-color", "transparent", "important");
}
function setHighlightBoundingStyle(_win, highlightBounding, highlight) {
    if (highlightBounding.active) {
        return;
    }
    highlightBounding.active = true;
    const opacity = ALT_BACKGROUND_COLOR_OPACITY;
    highlightBounding.style.setProperty("background-color", USE_BLEND_MODE ?
        `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` :
        `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`, "important");
    highlightBounding.style.setProperty("outline-color", `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, 1)`, "important");
    highlightBounding.style.setProperty("outline-style", "solid", "important");
    highlightBounding.style.setProperty("outline-width", "1px", "important");
    highlightBounding.style.setProperty("outline-offset", "0px", "important");
}
function resetHighlightBoundingMarginStyle(_win, highlightBounding) {
    if (USE_BLEND_MODE) {
        return;
    }
    if (!highlightBounding.active) {
        return;
    }
    highlightBounding.active = false;
    const opacity = ALT_BACKGROUND_COLOR_OPACITY;
    const id = ((highlightBounding.parentNode && highlightBounding.parentNode.nodeType === Node.ELEMENT_NODE && highlightBounding.parentNode.getAttribute) ? highlightBounding.parentNode.getAttribute("id") : undefined);
    if (id) {
        const highlight = _highlights.find((h) => {
            return h.id === id;
        });
        if (highlight) {
            highlightBounding.style.setProperty("background-color", USE_BLEND_MODE ?
                `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` :
                `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`, "important");
        }
    }
}
function setHighlightBoundingMarginStyle(_win, highlightBounding, highlight) {
    if (USE_BLEND_MODE) {
        return;
    }
    if (highlightBounding.active) {
        return;
    }
    highlightBounding.active = true;
    const opacity = ALT_BACKGROUND_COLOR_OPACITY;
    highlightBounding.style.setProperty("background-color", USE_BLEND_MODE ?
        `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` :
        `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`, "important");
}
function resetHighlightAreaStyle(win, highlightArea) {
    if (USE_BLEND_MODE) {
        return;
    }
    if (!highlightArea.active) {
        return;
    }
    highlightArea.active = false;
    const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    const useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
    const isSVG = useSVG && highlightArea.namespaceURI === SVG_XML_NAMESPACE;
    const id = isSVG ?
        ((highlightArea.parentNode && highlightArea.parentNode.parentNode && highlightArea.parentNode.parentNode.nodeType === Node.ELEMENT_NODE && highlightArea.parentNode.parentNode.getAttribute) ? highlightArea.parentNode.parentNode.getAttribute("id") : undefined) :
        ((highlightArea.parentNode && highlightArea.parentNode.nodeType === Node.ELEMENT_NODE && highlightArea.parentNode.getAttribute) ? highlightArea.parentNode.getAttribute("id") : undefined);
    if (id) {
        const highlight = _highlights.find((h) => {
            return h.id === id;
        });
        if (highlight) {
            if (isSVG) {
                if (!highlight.drawType) {
                    highlightArea.style.setProperty("fill", `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`, "important");
                }
                highlightArea.style.setProperty("stroke", `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`, "important");
                if (!USE_BLEND_MODE) {
                    if (!highlight.drawType) {
                        highlightArea.style.setProperty("fill-opacity", `${opacity}`, "important");
                    }
                    highlightArea.style.setProperty("stroke-opacity", `${opacity}`, "important");
                }
            }
            else {
                highlightArea.style.setProperty("background-color", highlight.drawType === highlight_1.HighlightDrawTypeUnderline ? "transparent" :
                    (USE_BLEND_MODE ?
                        `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` :
                        `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`), "important");
            }
        }
    }
}
function setHighlightAreaStyle(win, highlightAreas, highlight) {
    if (USE_BLEND_MODE) {
        return;
    }
    const opacity = ALT_BACKGROUND_COLOR_OPACITY;
    const useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
    for (const highlightArea_ of highlightAreas) {
        const highlightArea = highlightArea_;
        if (highlightArea.active) {
            continue;
        }
        highlightArea.active = true;
        const isSVG = useSVG && highlightArea.namespaceURI === SVG_XML_NAMESPACE;
        if (isSVG) {
            if (!highlight.drawType) {
                highlightArea.style.setProperty("fill", `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`, "important");
            }
            highlightArea.style.setProperty("stroke", `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`, "important");
            if (!USE_BLEND_MODE) {
                if (!highlight.drawType) {
                    highlightArea.style.setProperty("fill-opacity", `${opacity}`, "important");
                }
                highlightArea.style.setProperty("stroke-opacity", `${opacity}`, "important");
            }
        }
        else {
            highlightArea.style.setProperty("background-color", highlight.drawType === highlight_1.HighlightDrawTypeUnderline ? "transparent" :
                (USE_BLEND_MODE ?
                    `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` :
                    `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`), "important");
        }
    }
}
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
    const useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
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
            if (useSVG && highlightFragment.namespaceURI === SVG_XML_NAMESPACE) {
                let svgRect = highlightFragment.firstElementChild;
                while (svgRect) {
                    if (testHit(svgRect)) {
                        changeCursor = true;
                        hit = true;
                        break;
                    }
                    svgRect = svgRect.nextElementSibling;
                }
                if (hit) {
                    break;
                }
            }
            else if (highlightFragment.classList.contains(exports.CLASS_HIGHLIGHT_AREA)) {
                if (testHit(highlightFragment)) {
                    changeCursor = true;
                    hit = true;
                    break;
                }
            }
            else if (highlightFragment.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN)) {
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
    const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    if (!foundHighlight || !foundElement) {
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR1);
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        let highlightContainer = _highlightsContainer.firstElementChild;
        while (highlightContainer) {
            if (USE_BLEND_MODE) {
                highlightContainer.style.setProperty("opacity", `${opacity}`, "important");
            }
            if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                let highlightContainerChild = highlightContainer.firstElementChild;
                while (highlightContainerChild) {
                    if (!USE_BLEND_MODE && highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN)) {
                        resetHighlightBoundingMarginStyle(win, highlightContainerChild);
                    }
                    else if (highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA)) {
                        resetHighlightBoundingStyle(win, highlightContainerChild);
                    }
                    else if (!USE_BLEND_MODE && highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_AREA)) {
                        resetHighlightAreaStyle(win, highlightContainerChild);
                    }
                    else if (!USE_BLEND_MODE &&
                        useSVG && highlightContainerChild.namespaceURI === SVG_XML_NAMESPACE) {
                        let svgRect = highlightContainerChild.firstElementChild;
                        while (svgRect) {
                            resetHighlightAreaStyle(win, highlightContainerChild);
                            svgRect = svgRect.nextElementSibling;
                        }
                    }
                    highlightContainerChild = highlightContainerChild.nextElementSibling;
                }
            }
            highlightContainer = highlightContainer.nextElementSibling;
        }
        return;
    }
    if (foundHighlight.pointerInteraction || foundElement.getAttribute("data-click")) {
        if (isMouseMove) {
            if (changeCursor) {
                documant.documentElement.classList.add(_drawMarginMarkers ? styles_1.CLASS_HIGHLIGHT_CURSOR1 : styles_1.CLASS_HIGHLIGHT_CURSOR2);
            }
            if (!_drawMarginMarkers) {
                if (_drawMarginMarkers) {
                    const foundElementHighlightBounding = foundElement.querySelector(`.${exports.CLASS_HIGHLIGHT_BOUNDING_AREA}`);
                    const foundElementHighlightBoundingMargin = foundElement.querySelector(`.${exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN}`);
                    if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                        if (foundElementHighlightBounding) {
                            setHighlightBoundingStyle(win, foundElementHighlightBounding, foundHighlight);
                        }
                        if (foundElementHighlightBoundingMargin) {
                            setHighlightBoundingMarginStyle(win, foundElementHighlightBoundingMargin, foundHighlight);
                        }
                    }
                    let highlightContainer = _highlightsContainer.firstElementChild;
                    while (highlightContainer) {
                        if (USE_BLEND_MODE) {
                            if (highlightContainer !== foundElement) {
                                highlightContainer.style.setProperty("opacity", `${ALT_OTHER_BACKGROUND_COLOR_OPACITY}`, "important");
                            }
                        }
                        if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                            let highlightContainerChild = highlightContainer.firstElementChild;
                            while (highlightContainerChild) {
                                if (!USE_BLEND_MODE && highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN)) {
                                    if (!foundElementHighlightBoundingMargin ||
                                        highlightContainerChild !== foundElementHighlightBoundingMargin) {
                                        resetHighlightBoundingMarginStyle(win, highlightContainerChild);
                                    }
                                }
                                else if (highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA)) {
                                    if (!foundElementHighlightBounding ||
                                        highlightContainerChild !== foundElementHighlightBounding) {
                                        resetHighlightBoundingStyle(win, highlightContainerChild);
                                    }
                                }
                                else if (!USE_BLEND_MODE &&
                                    highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_AREA)) {
                                    if (highlightContainerChild.parentNode !== foundElement) {
                                        resetHighlightAreaStyle(win, highlightContainerChild);
                                    }
                                }
                                highlightContainerChild = highlightContainerChild.nextElementSibling;
                            }
                        }
                        highlightContainer = highlightContainer.nextElementSibling;
                    }
                }
                if (USE_BLEND_MODE) {
                    foundElement.style.setProperty("opacity", `${ALT_BACKGROUND_COLOR_OPACITY}`, "important");
                }
                else {
                    const foundElementHighlightAreas = foundElement.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_AREA}`);
                    setHighlightAreaStyle(win, foundElementHighlightAreas, foundHighlight);
                }
            }
        }
        else if (ev.type === "mouseup" || ev.type === "click") {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.altKey) {
                _drawMarginMarkers = !_drawMarginMarkers;
                recreateAllHighlightsRaw(win);
            }
            else {
                const payload = {
                    highlight: foundHighlight,
                };
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_HIGHLIGHT_CLICK, payload);
            }
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
    if (highlights) {
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
    if (!documant.body) {
        if (IS_DEV) {
            console.log("--HIGH WEBVIEW-- NO BODY?! (retrying...): " + _highlights.length);
        }
        (0, exports.recreateAllHighlightsDebounced)(win);
        return;
    }
    hideAllhighlights(documant);
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const bodyWidth = parseInt(win.getComputedStyle(documant.body).width, 10);
    const docFrag = documant.createDocumentFragment();
    for (const highlight of _highlights) {
        const div = createHighlightDom(win, highlight, bodyRect, bodyWidth);
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
    const bodyWidth = parseInt(win.getComputedStyle(win.document.body).width, 10);
    const docFrag = documant.createDocumentFragment();
    for (const highDef of highDefs) {
        if (!highDef.selectionInfo && !highDef.range) {
            highlights.push(null);
            continue;
        }
        const [high, div] = createHighlight(win, highDef.selectionInfo, highDef.range, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, highDef.group, bodyRect, bodyWidth);
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
function createHighlight(win, selectionInfo, range, color, pointerInteraction, drawType, expand, group, bodyRect, bodyWidth) {
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
    const div = createHighlightDom(win, highlight, bodyRect, bodyWidth);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight, bodyRect, bodyWidth) {
    const documant = win.document;
    const scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    const range = highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : highlight.range;
    if (!range) {
        return null;
    }
    const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    const paginated = (0, readium_css_inject_1.isPaginated)(documant);
    const paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    const rtl = (0, readium_css_2.isRTL)();
    const vertical = (0, readium_css_1.isVerticalWritingMode)();
    const highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", `${exports.CLASS_HIGHLIGHT_CONTAINER} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
    highlightParent.setAttribute("style", "width: 1px !important; " +
        "height: 1px !important; ");
    if (highlight.pointerInteraction) {
        highlightParent.setAttribute("data-click", "1");
    }
    if (USE_BLEND_MODE && (!_drawMarginMarkers || !highlight.pointerInteraction)) {
        const styleAttr = win.document.documentElement.getAttribute("style");
        const isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
        highlightParent.style.setProperty("mix-blend-mode", isNight ? "difference" : "multiply", "important");
        highlightParent.style.setProperty("opacity", `${opacity}`, "important");
    }
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
    const drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline && !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS);
    const drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough && !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS);
    const doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    const ex = highlight.expand ? highlight.expand : 0;
    const rangeClientRects = range.getClientRects();
    const clientRects = (0, rect_utils_1.getClientRectsNoOverlap_)(rangeClientRects, doNotMergeHorizontallyAlignedRects, ex);
    let highlightAreaSVGDocFrag;
    const roundedCorner = 3;
    const underlineThickness = 3;
    const strikeThroughLineThickness = 3;
    const rangeBoundingClientRect = range.getBoundingClientRect();
    const highlightBounding = documant.createElement("div");
    highlightBounding.setAttribute("class", `${exports.CLASS_HIGHLIGHT_BOUNDING_AREA} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
    if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
        highlightBounding.setAttribute("style", "outline-color: magenta !important; " +
            "outline-style: solid !important; " +
            "outline-width: 1px !important; " +
            "outline-offset: -1px !important;");
    }
    highlightBounding.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
    highlightBounding.scale = scale;
    highlightBounding.rect = {
        height: rangeBoundingClientRect.height,
        left: rangeBoundingClientRect.left - xOffset,
        top: rangeBoundingClientRect.top - yOffset,
        width: rangeBoundingClientRect.width,
    };
    highlightBounding.style.setProperty("width", `${highlightBounding.rect.width * scale}px`, "important");
    highlightBounding.style.setProperty("height", `${highlightBounding.rect.height * scale}px`, "important");
    highlightBounding.style.setProperty("min-width", highlightBounding.style.width, "important");
    highlightBounding.style.setProperty("min-height", highlightBounding.style.height, "important");
    highlightBounding.style.setProperty("left", `${highlightBounding.rect.left * scale}px`, "important");
    highlightBounding.style.setProperty("top", `${highlightBounding.rect.top * scale}px`, "important");
    highlightParent.append(highlightBounding);
    if (_drawMarginMarkers && highlight.pointerInteraction) {
        const MARGIN_MARKER_THICKNESS = 8;
        const MARGIN_MARKER_OFFSET = 2;
        const highlightBoundingMargin = documant.createElement("div");
        highlightBoundingMargin.setAttribute("class", `${exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
        highlightBoundingMargin.setAttribute("style", `border-radius: ${MARGIN_MARKER_THICKNESS / 2}px;` +
            "background-color: " +
            (USE_BLEND_MODE ?
                `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` :
                `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important;`));
        highlightBoundingMargin.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
        highlightBoundingMargin.scale = scale;
        const dim = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
        const off = (dim - bodyWidth) / 2;
        highlightBoundingMargin.rect = {
            height: vertical ? MARGIN_MARKER_THICKNESS : rangeBoundingClientRect.height,
            left: vertical ? (rangeBoundingClientRect.left - xOffset) : paginated ?
                ((rtl ? (dim - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET) : MARGIN_MARKER_OFFSET)
                    +
                        (rtl ? (-1 * off) : off)
                    +
                        Math.floor((rangeBoundingClientRect.left - xOffset) / dim) * dim)
                :
                    MARGIN_MARKER_OFFSET + (rtl ? bodyRect.width : 0),
            top: vertical ? MARGIN_MARKER_OFFSET : (rangeBoundingClientRect.top - yOffset),
            width: vertical ? rangeBoundingClientRect.width : MARGIN_MARKER_THICKNESS,
        };
        highlightBoundingMargin.style.setProperty("width", `${highlightBoundingMargin.rect.width * scale}px`, "important");
        highlightBoundingMargin.style.setProperty("height", `${highlightBoundingMargin.rect.height * scale}px`, "important");
        highlightBoundingMargin.style.setProperty("min-width", highlightBoundingMargin.style.width, "important");
        highlightBoundingMargin.style.setProperty("min-height", highlightBoundingMargin.style.height, "important");
        highlightBoundingMargin.style.setProperty("left", `${highlightBoundingMargin.rect.left * scale}px`, "important");
        highlightBoundingMargin.style.setProperty("top", `${highlightBoundingMargin.rect.top * scale}px`, "important");
        highlightParent.append(highlightBoundingMargin);
    }
    else {
        for (const clientRect of clientRects) {
            if (useSVG) {
                const borderThickness = 0;
                if (!highlightAreaSVGDocFrag) {
                    highlightAreaSVGDocFrag = documant.createDocumentFragment();
                }
                if (drawUnderline) {
                    const highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                    highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaSVGLine.setAttribute("style", "stroke-linecap: round !important; " +
                        `stroke-width: ${underlineThickness * scale} !important; ` +
                        `stroke: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` +
                        (USE_BLEND_MODE ? "" : ` stroke-opacity: ${opacity} !important`));
                    highlightAreaSVGLine.scale = scale;
                    highlightAreaSVGLine.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    const lineOffset = (highlightAreaSVGLine.rect.width > roundedCorner) ? roundedCorner : 0;
                    highlightAreaSVGLine.setAttribute("x1", `${(highlightAreaSVGLine.rect.left + lineOffset) * scale}`);
                    highlightAreaSVGLine.setAttribute("x2", `${(highlightAreaSVGLine.rect.left + highlightAreaSVGLine.rect.width - lineOffset) * scale}`);
                    const y = (highlightAreaSVGLine.rect.top + highlightAreaSVGLine.rect.height - (underlineThickness / 2)) * scale;
                    highlightAreaSVGLine.setAttribute("y1", `${y}`);
                    highlightAreaSVGLine.setAttribute("y2", `${y}`);
                    highlightAreaSVGLine.setAttribute("height", `${highlightAreaSVGLine.rect.height * scale}`);
                    highlightAreaSVGLine.setAttribute("width", `${highlightAreaSVGLine.rect.width * scale}`);
                    highlightAreaSVGDocFrag.appendChild(highlightAreaSVGLine);
                }
                else if (drawStrikeThrough) {
                    const highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                    highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaSVGLine.setAttribute("style", "stroke-linecap: butt !important; " +
                        `stroke-width: ${strikeThroughLineThickness * scale} !important; ` +
                        `stroke: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` +
                        (USE_BLEND_MODE ? "" : ` stroke-opacity: ${opacity} !important`));
                    highlightAreaSVGLine.scale = scale;
                    highlightAreaSVGLine.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    highlightAreaSVGLine.setAttribute("x1", `${highlightAreaSVGLine.rect.left * scale}`);
                    highlightAreaSVGLine.setAttribute("x2", `${(highlightAreaSVGLine.rect.left + highlightAreaSVGLine.rect.width) * scale}`);
                    const lineOffset = highlightAreaSVGLine.rect.height / 2;
                    const y = (highlightAreaSVGLine.rect.top + lineOffset) * scale;
                    highlightAreaSVGLine.setAttribute("y1", `${y}`);
                    highlightAreaSVGLine.setAttribute("y2", `${y}`);
                    highlightAreaSVGLine.setAttribute("height", `${highlightAreaSVGLine.rect.height * scale}`);
                    highlightAreaSVGLine.setAttribute("width", `${highlightAreaSVGLine.rect.width * scale}`);
                    highlightAreaSVGDocFrag.appendChild(highlightAreaSVGLine);
                }
                else {
                    const highlightAreaSVGRect = documant.createElementNS(SVG_XML_NAMESPACE, "rect");
                    highlightAreaSVGRect.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaSVGRect.setAttribute("style", `fill: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important; ` +
                        "stroke-width: 0;" +
                        (USE_BLEND_MODE ? "" : ` fill-opacity: ${opacity} !important;`));
                    highlightAreaSVGRect.scale = scale;
                    highlightAreaSVGRect.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    highlightAreaSVGRect.setAttribute("rx", `${roundedCorner * scale}`);
                    highlightAreaSVGRect.setAttribute("ry", `${roundedCorner * scale}`);
                    highlightAreaSVGRect.setAttribute("x", `${(highlightAreaSVGRect.rect.left - borderThickness) * scale}`);
                    highlightAreaSVGRect.setAttribute("y", `${(highlightAreaSVGRect.rect.top - borderThickness) * scale}`);
                    highlightAreaSVGRect.setAttribute("height", `${(highlightAreaSVGRect.rect.height + (borderThickness * 2)) * scale}`);
                    highlightAreaSVGRect.setAttribute("width", `${(highlightAreaSVGRect.rect.width + (borderThickness * 2)) * scale}`);
                    highlightAreaSVGDocFrag.appendChild(highlightAreaSVGRect);
                }
            }
            else {
                if (drawStrikeThrough) {
                    const highlightAreaLine = documant.createElement("div");
                    highlightAreaLine.setAttribute("class", `${exports.CLASS_HIGHLIGHT_AREA} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
                    highlightAreaLine.setAttribute("style", (USE_BLEND_MODE ?
                        `background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` :
                        `background-color: rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important;`));
                    highlightAreaLine.style.setProperty("transform", "translate3d(0px, 0px, 0px)", "important");
                    highlightAreaLine.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
                    highlightAreaLine.scale = scale;
                    highlightAreaLine.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    highlightAreaLine.style.setProperty("width", `${highlightAreaLine.rect.width * scale}px`, "important");
                    highlightAreaLine.style.setProperty("height", `${strikeThroughLineThickness * scale}px`, "important");
                    highlightAreaLine.style.setProperty("min-width", highlightAreaLine.style.width, "important");
                    highlightAreaLine.style.setProperty("min-height", highlightAreaLine.style.height, "important");
                    highlightAreaLine.style.setProperty("left", `${highlightAreaLine.rect.left * scale}px`, "important");
                    highlightAreaLine.style.setProperty("top", `${(highlightAreaLine.rect.top + (highlightAreaLine.rect.height / 2) - (strikeThroughLineThickness / 2)) * scale}px`, "important");
                    highlightParent.append(highlightAreaLine);
                }
                else {
                    const highlightArea = documant.createElement("div");
                    highlightArea.setAttribute("class", `${exports.CLASS_HIGHLIGHT_AREA} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
                    let extra = "";
                    if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                        const rgb = Math.round(0xffffff * Math.random());
                        const r = rgb >> 16;
                        const g = rgb >> 8 & 255;
                        const b = rgb & 255;
                        extra = `outline-color: rgb(${r}, ${g}, ${b}); outline-style: solid; outline-width: 1px; outline-offset: -1px;`;
                    }
                    else if (drawUnderline) {
                        const side = (0, readium_css_1.isVerticalWritingMode)() ? "left" : "bottom";
                        extra = `border-${side}: ${underlineThickness * scale}px solid ` +
                            (USE_BLEND_MODE ?
                                `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important` :
                                `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important`);
                    }
                    highlightArea.setAttribute("style", (drawUnderline ?
                        "" :
                        ("background-color: " +
                            (USE_BLEND_MODE ?
                                `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` :
                                `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important;`))) + ` ${extra}`);
                    highlightArea.style.setProperty("transform", "translate3d(0px, 0px, 0px)", "important");
                    highlightArea.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
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
        if (useSVG && highlightAreaSVGDocFrag) {
            const highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
            highlightAreaSVG.setAttribute("class", styles_1.CLASS_HIGHLIGHT_COMMON);
            highlightAreaSVG.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
            highlightAreaSVG.append(highlightAreaSVGDocFrag);
            highlightParent.append(highlightAreaSVG);
        }
    }
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map