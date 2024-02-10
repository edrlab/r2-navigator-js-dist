"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN = exports.CLASS_HIGHLIGHT_BOUNDING_AREA = exports.CLASS_HIGHLIGHT_AREA = exports.CLASS_HIGHLIGHT_CONTAINER = void 0;
var tslib_1 = require("tslib");
var crypto = require("crypto");
var debounce = require("debounce");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var highlight_1 = require("../../common/highlight");
var readium_css_inject_1 = require("../../common/readium-css-inject");
var rect_utils_1 = require("../common/rect-utils");
var readium_css_1 = require("./readium-css");
var selection_1 = require("./selection");
var styles_1 = require("../../common/styles");
var readium_css_2 = require("./readium-css");
exports.CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
exports.CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
exports.CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN";
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var DEBUG_VISUALS = false;
var USE_SVG = false;
var USE_BLEND_MODE = true;
var DEFAULT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 0.8 : 0.3;
var ALT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 1 : 0.45;
var ALT_OTHER_BACKGROUND_COLOR_OPACITY = 0.2;
var DEFAULT_BACKGROUND_COLOR = {
    blue: 100,
    green: 50,
    red: 230,
};
var _highlights = [];
var _drawMarginMarkers = false;
var SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
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
    var opacity = ALT_BACKGROUND_COLOR_OPACITY;
    highlightBounding.style.setProperty("background-color", USE_BLEND_MODE ?
        "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")") :
        "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ")"), "important");
    highlightBounding.style.setProperty("outline-color", "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", 1)"), "important");
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
    var opacity = ALT_BACKGROUND_COLOR_OPACITY;
    var id = ((highlightBounding.parentNode && highlightBounding.parentNode.nodeType === Node.ELEMENT_NODE && highlightBounding.parentNode.getAttribute) ? highlightBounding.parentNode.getAttribute("id") : undefined);
    if (id) {
        var highlight = _highlights.find(function (h) {
            return h.id === id;
        });
        if (highlight) {
            highlightBounding.style.setProperty("background-color", USE_BLEND_MODE ?
                "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")") :
                "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ")"), "important");
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
    var opacity = ALT_BACKGROUND_COLOR_OPACITY;
    highlightBounding.style.setProperty("background-color", USE_BLEND_MODE ?
        "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")") :
        "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ")"), "important");
}
function resetHighlightAreaStyle(win, highlightArea) {
    if (USE_BLEND_MODE) {
        return;
    }
    if (!highlightArea.active) {
        return;
    }
    highlightArea.active = false;
    var opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    var useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
    var isSVG = useSVG && highlightArea.namespaceURI === SVG_XML_NAMESPACE;
    var id = isSVG ?
        ((highlightArea.parentNode && highlightArea.parentNode.parentNode && highlightArea.parentNode.parentNode.nodeType === Node.ELEMENT_NODE && highlightArea.parentNode.parentNode.getAttribute) ? highlightArea.parentNode.parentNode.getAttribute("id") : undefined) :
        ((highlightArea.parentNode && highlightArea.parentNode.nodeType === Node.ELEMENT_NODE && highlightArea.parentNode.getAttribute) ? highlightArea.parentNode.getAttribute("id") : undefined);
    if (id) {
        var highlight = _highlights.find(function (h) {
            return h.id === id;
        });
        if (highlight) {
            if (isSVG) {
                if (!highlight.drawType) {
                    highlightArea.style.setProperty("fill", "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"), "important");
                }
                highlightArea.style.setProperty("stroke", "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"), "important");
                if (!USE_BLEND_MODE) {
                    if (!highlight.drawType) {
                        highlightArea.style.setProperty("fill-opacity", "".concat(opacity), "important");
                    }
                    highlightArea.style.setProperty("stroke-opacity", "".concat(opacity), "important");
                }
            }
            else {
                highlightArea.style.setProperty("background-color", highlight.drawType === highlight_1.HighlightDrawTypeUnderline ? "transparent" :
                    (USE_BLEND_MODE ?
                        "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")") :
                        "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ")")), "important");
            }
        }
    }
}
function setHighlightAreaStyle(win, highlightAreas, highlight) {
    var e_1, _a;
    if (USE_BLEND_MODE) {
        return;
    }
    var opacity = ALT_BACKGROUND_COLOR_OPACITY;
    var useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
    try {
        for (var highlightAreas_1 = tslib_1.__values(highlightAreas), highlightAreas_1_1 = highlightAreas_1.next(); !highlightAreas_1_1.done; highlightAreas_1_1 = highlightAreas_1.next()) {
            var highlightArea_ = highlightAreas_1_1.value;
            var highlightArea = highlightArea_;
            if (highlightArea.active) {
                continue;
            }
            highlightArea.active = true;
            var isSVG = useSVG && highlightArea.namespaceURI === SVG_XML_NAMESPACE;
            if (isSVG) {
                if (!highlight.drawType) {
                    highlightArea.style.setProperty("fill", "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"), "important");
                }
                highlightArea.style.setProperty("stroke", "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"), "important");
                if (!USE_BLEND_MODE) {
                    if (!highlight.drawType) {
                        highlightArea.style.setProperty("fill-opacity", "".concat(opacity), "important");
                    }
                    highlightArea.style.setProperty("stroke-opacity", "".concat(opacity), "important");
                }
            }
            else {
                highlightArea.style.setProperty("background-color", highlight.drawType === highlight_1.HighlightDrawTypeUnderline ? "transparent" :
                    (USE_BLEND_MODE ?
                        "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")") :
                        "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ")")), "important");
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (highlightAreas_1_1 && !highlightAreas_1_1.done && (_a = highlightAreas_1.return)) _a.call(highlightAreas_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
function processMouseEvent(win, ev) {
    if (!_highlightsContainer) {
        return;
    }
    var isMouseMove = ev.type === "mousemove";
    if (isMouseMove) {
        if (ev.buttons > 0) {
            return;
        }
        if (!_highlights.length) {
            return;
        }
    }
    var documant = win.document;
    var scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    var x = ev.clientX;
    var y = ev.clientY;
    var paginated = (0, readium_css_inject_1.isPaginated)(documant);
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    var testHit = function (highlightFragment) {
        var withRect = highlightFragment;
        var left = withRect.rect.left + xOffset;
        var top = withRect.rect.top + yOffset;
        if (x >= left &&
            x < (left + withRect.rect.width) &&
            y >= top &&
            y < (top + withRect.rect.height)) {
            return true;
        }
        return false;
    };
    var useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
    var changeCursor = false;
    var foundHighlight;
    var foundElement;
    for (var i = _highlights.length - 1; i >= 0; i--) {
        var highlight = _highlights[i];
        var highlightParent = documant.getElementById("".concat(highlight.id));
        if (!highlightParent) {
            highlightParent = _highlightsContainer.querySelector("#".concat(highlight.id));
        }
        if (!highlightParent) {
            continue;
        }
        var hit = false;
        var highlightFragment = highlightParent.firstElementChild;
        while (highlightFragment) {
            if (useSVG && highlightFragment.namespaceURI === SVG_XML_NAMESPACE) {
                var svgRect = highlightFragment.firstElementChild;
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
    var opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    if (!foundHighlight || !foundElement) {
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR1);
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        var highlightContainer = _highlightsContainer.firstElementChild;
        while (highlightContainer) {
            if (USE_BLEND_MODE) {
                highlightContainer.style.setProperty("opacity", "".concat(opacity), "important");
            }
            if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                var highlightContainerChild = highlightContainer.firstElementChild;
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
                        var svgRect = highlightContainerChild.firstElementChild;
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
                    var foundElementHighlightBounding = foundElement.querySelector(".".concat(exports.CLASS_HIGHLIGHT_BOUNDING_AREA));
                    var foundElementHighlightBoundingMargin = foundElement.querySelector(".".concat(exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN));
                    if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                        if (foundElementHighlightBounding) {
                            setHighlightBoundingStyle(win, foundElementHighlightBounding, foundHighlight);
                        }
                        if (foundElementHighlightBoundingMargin) {
                            setHighlightBoundingMarginStyle(win, foundElementHighlightBoundingMargin, foundHighlight);
                        }
                    }
                    var highlightContainer = _highlightsContainer.firstElementChild;
                    while (highlightContainer) {
                        if (USE_BLEND_MODE) {
                            if (highlightContainer !== foundElement) {
                                highlightContainer.style.setProperty("opacity", "".concat(ALT_OTHER_BACKGROUND_COLOR_OPACITY), "important");
                            }
                        }
                        if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                            var highlightContainerChild = highlightContainer.firstElementChild;
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
                    foundElement.style.setProperty("opacity", "".concat(ALT_BACKGROUND_COLOR_OPACITY), "important");
                }
                else {
                    var foundElementHighlightAreas = foundElement.querySelectorAll(".".concat(exports.CLASS_HIGHLIGHT_AREA));
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
                var payload = {
                    highlight: foundHighlight,
                };
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_HIGHLIGHT_CLICK, payload);
            }
        }
    }
}
var lastMouseDownX = -1;
var lastMouseDownY = -1;
var bodyEventListenersSet = false;
var _highlightsContainer;
function ensureHighlightsContainer(win) {
    var documant = win.document;
    if (!_highlightsContainer) {
        if (!bodyEventListenersSet) {
            bodyEventListenersSet = true;
            documant.body.addEventListener("mousedown", function (ev) {
                lastMouseDownX = ev.clientX;
                lastMouseDownY = ev.clientY;
            }, false);
            documant.body.addEventListener("mouseup", function (ev) {
                if ((Math.abs(lastMouseDownX - ev.clientX) < 3) &&
                    (Math.abs(lastMouseDownY - ev.clientY) < 3)) {
                    processMouseEvent(win, ev);
                }
            }, false);
            documant.body.addEventListener("mousemove", function (ev) {
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
    if (_highlightsContainer) {
        _highlightsContainer.remove();
        _highlightsContainer = null;
    }
}
exports.hideAllhighlights = hideAllhighlights;
function destroyAllhighlights(documant) {
    hideAllhighlights(documant);
    _highlights.splice(0, _highlights.length);
}
exports.destroyAllhighlights = destroyAllhighlights;
function destroyHighlight(documant, id) {
    var i = -1;
    var highlight = _highlights.find(function (h, j) {
        i = j;
        return h.id === id;
    });
    if (highlight && i >= 0 && i < _highlights.length) {
        _highlights.splice(i, 1);
    }
    var highlightContainer = documant.getElementById(id);
    if (highlightContainer) {
        highlightContainer.remove();
    }
}
exports.destroyHighlight = destroyHighlight;
function recreateAllHighlightsRaw(win) {
    var e_2, _a;
    var documant = win.document;
    hideAllhighlights(documant);
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var bodyWidth = parseInt(win.getComputedStyle(win.document.body).width, 10);
    var docFrag = documant.createDocumentFragment();
    try {
        for (var _highlights_1 = tslib_1.__values(_highlights), _highlights_1_1 = _highlights_1.next(); !_highlights_1_1.done; _highlights_1_1 = _highlights_1.next()) {
            var highlight = _highlights_1_1.value;
            var div = createHighlightDom(win, highlight, bodyRect, bodyWidth);
            if (div) {
                docFrag.append(div);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_highlights_1_1 && !_highlights_1_1.done && (_a = _highlights_1.return)) _a.call(_highlights_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
}
exports.recreateAllHighlightsRaw = recreateAllHighlightsRaw;
exports.recreateAllHighlightsDebounced = debounce(function (win) {
    recreateAllHighlightsRaw(win);
}, 500);
function recreateAllHighlights(win) {
    hideAllhighlights(win.document);
    (0, exports.recreateAllHighlightsDebounced)(win);
}
exports.recreateAllHighlights = recreateAllHighlights;
function createHighlights(win, highDefs, pointerInteraction) {
    var e_3, _a;
    var documant = win.document;
    var highlights = [];
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var bodyWidth = parseInt(win.getComputedStyle(win.document.body).width, 10);
    var docFrag = documant.createDocumentFragment();
    try {
        for (var highDefs_1 = tslib_1.__values(highDefs), highDefs_1_1 = highDefs_1.next(); !highDefs_1_1.done; highDefs_1_1 = highDefs_1.next()) {
            var highDef = highDefs_1_1.value;
            if (!highDef.selectionInfo && !highDef.range) {
                highlights.push(null);
                continue;
            }
            var _b = tslib_1.__read(createHighlight(win, highDef.selectionInfo, highDef.range, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, bodyRect, bodyWidth), 2), high = _b[0], div = _b[1];
            highlights.push(high);
            if (div) {
                docFrag.append(div);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (highDefs_1_1 && !highDefs_1_1.done && (_a = highDefs_1.return)) _a.call(highDefs_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    var highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
    return highlights;
}
exports.createHighlights = createHighlights;
var computeCFI = function (node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        if (node.parentNode) {
            return computeCFI(node.parentNode);
        }
        return undefined;
    }
    var cfi = "";
    var currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        var currentElementParentChildren = currentElement.parentNode.children;
        var currentElementIndex = -1;
        for (var i = 0; i < currentElementParentChildren.length; i++) {
            if (currentElement === currentElementParentChildren[i]) {
                currentElementIndex = i;
                break;
            }
        }
        if (currentElementIndex >= 0) {
            var cfiIndex = (currentElementIndex + 1) * 2;
            cfi = cfiIndex +
                (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                (cfi.length ? ("/" + cfi) : "");
        }
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
function createHighlight(win, selectionInfo, range, color, pointerInteraction, drawType, expand, bodyRect, bodyWidth) {
    var uniqueStr = selectionInfo ? "".concat(selectionInfo.rangeInfo.startContainerElementCssSelector).concat(selectionInfo.rangeInfo.startContainerChildTextNodeIndex).concat(selectionInfo.rangeInfo.startOffset).concat(selectionInfo.rangeInfo.endContainerElementCssSelector).concat(selectionInfo.rangeInfo.endContainerChildTextNodeIndex).concat(selectionInfo.rangeInfo.endOffset) : range ? "".concat(range.startOffset, "-").concat(range.endOffset, "-").concat(computeCFI(range.startContainer), "-").concat(computeCFI(range.endContainer)) : "_RANGE_";
    var checkSum = crypto.createHash("sha1");
    checkSum.update(uniqueStr);
    var shaHex = checkSum.digest("hex");
    var idBase = "R2_HIGHLIGHT_" + shaHex;
    var id = idBase;
    var idIdx = 0;
    while (_highlights.find(function (h) { return h.id === id; }) ||
        win.document.getElementById(id)) {
        if (IS_DEV) {
            console.log("HIGHLIGHT ID already exists, increment: " + uniqueStr + " ==> " + id);
        }
        id = "".concat(idBase, "_").concat(idIdx++);
    }
    var highlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        drawType: drawType,
        expand: expand,
        id: id,
        pointerInteraction: pointerInteraction,
        selectionInfo: selectionInfo,
        range: range,
    };
    _highlights.push(highlight);
    var div = createHighlightDom(win, highlight, bodyRect, bodyWidth);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight, bodyRect, bodyWidth) {
    var e_4, _a;
    var documant = win.document;
    var scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    var range = highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : highlight.range;
    if (!range) {
        return null;
    }
    var opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    var paginated = (0, readium_css_inject_1.isPaginated)(documant);
    var paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    var rtl = (0, readium_css_2.isRTL)();
    var vertical = (0, readium_css_1.isVerticalWritingMode)();
    var highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", "".concat(exports.CLASS_HIGHLIGHT_CONTAINER, " ").concat(styles_1.CLASS_HIGHLIGHT_COMMON));
    highlightParent.setAttribute("style", "width: 1px !important; " +
        "height: 1px !important; ");
    if (highlight.pointerInteraction) {
        highlightParent.setAttribute("data-click", "1");
    }
    if (USE_BLEND_MODE && (!_drawMarginMarkers || !highlight.pointerInteraction)) {
        var styleAttr = win.document.documentElement.getAttribute("style");
        var isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
        highlightParent.style.setProperty("mix-blend-mode", isNight ? "difference" : "multiply", "important");
        highlightParent.style.setProperty("opacity", "".concat(opacity), "important");
    }
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    var scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    var useSVG = !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS) && USE_SVG;
    var drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline && !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS);
    var drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough && !(DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS);
    var doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    var ex = highlight.expand ? highlight.expand : 0;
    var rangeClientRects = range.getClientRects();
    var clientRects = (0, rect_utils_1.getClientRectsNoOverlap_)(rangeClientRects, doNotMergeHorizontallyAlignedRects, ex);
    var highlightAreaSVGDocFrag;
    var roundedCorner = 3;
    var underlineThickness = 3;
    var strikeThroughLineThickness = 3;
    var rangeBoundingClientRect = range.getBoundingClientRect();
    var highlightBounding = documant.createElement("div");
    highlightBounding.setAttribute("class", "".concat(exports.CLASS_HIGHLIGHT_BOUNDING_AREA, " ").concat(styles_1.CLASS_HIGHLIGHT_COMMON));
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
    highlightBounding.style.setProperty("width", "".concat(highlightBounding.rect.width * scale, "px"), "important");
    highlightBounding.style.setProperty("height", "".concat(highlightBounding.rect.height * scale, "px"), "important");
    highlightBounding.style.setProperty("min-width", highlightBounding.style.width, "important");
    highlightBounding.style.setProperty("min-height", highlightBounding.style.height, "important");
    highlightBounding.style.setProperty("left", "".concat(highlightBounding.rect.left * scale, "px"), "important");
    highlightBounding.style.setProperty("top", "".concat(highlightBounding.rect.top * scale, "px"), "important");
    highlightParent.append(highlightBounding);
    if (_drawMarginMarkers && highlight.pointerInteraction) {
        var MARGIN_MARKER_THICKNESS = 8;
        var MARGIN_MARKER_OFFSET = 2;
        var highlightBoundingMargin = documant.createElement("div");
        highlightBoundingMargin.setAttribute("class", "".concat(exports.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN, " ").concat(styles_1.CLASS_HIGHLIGHT_COMMON));
        highlightBoundingMargin.setAttribute("style", "border-radius: ".concat(MARGIN_MARKER_THICKNESS / 2, "px;") +
            "background-color: " +
            (USE_BLEND_MODE ?
                "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ") !important;") :
                "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ") !important;")));
        highlightBoundingMargin.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
        highlightBoundingMargin.scale = scale;
        var dim = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
        var off = (dim - bodyWidth) / 2;
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
        highlightBoundingMargin.style.setProperty("width", "".concat(highlightBoundingMargin.rect.width * scale, "px"), "important");
        highlightBoundingMargin.style.setProperty("height", "".concat(highlightBoundingMargin.rect.height * scale, "px"), "important");
        highlightBoundingMargin.style.setProperty("min-width", highlightBoundingMargin.style.width, "important");
        highlightBoundingMargin.style.setProperty("min-height", highlightBoundingMargin.style.height, "important");
        highlightBoundingMargin.style.setProperty("left", "".concat(highlightBoundingMargin.rect.left * scale, "px"), "important");
        highlightBoundingMargin.style.setProperty("top", "".concat(highlightBoundingMargin.rect.top * scale, "px"), "important");
        highlightParent.append(highlightBoundingMargin);
    }
    else {
        try {
            for (var clientRects_1 = tslib_1.__values(clientRects), clientRects_1_1 = clientRects_1.next(); !clientRects_1_1.done; clientRects_1_1 = clientRects_1.next()) {
                var clientRect = clientRects_1_1.value;
                if (useSVG) {
                    var borderThickness = 0;
                    if (!highlightAreaSVGDocFrag) {
                        highlightAreaSVGDocFrag = documant.createDocumentFragment();
                    }
                    if (drawUnderline) {
                        var highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                        highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                        highlightAreaSVGLine.setAttribute("style", "stroke-linecap: round !important; " +
                            "stroke-width: ".concat(underlineThickness * scale, " !important; ") +
                            "stroke: rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ") !important;") +
                            (USE_BLEND_MODE ? "" : " stroke-opacity: ".concat(opacity, " !important")));
                        highlightAreaSVGLine.scale = scale;
                        highlightAreaSVGLine.rect = {
                            height: clientRect.height,
                            left: clientRect.left - xOffset,
                            top: clientRect.top - yOffset,
                            width: clientRect.width,
                        };
                        var lineOffset = (highlightAreaSVGLine.rect.width > roundedCorner) ? roundedCorner : 0;
                        highlightAreaSVGLine.setAttribute("x1", "".concat((highlightAreaSVGLine.rect.left + lineOffset) * scale));
                        highlightAreaSVGLine.setAttribute("x2", "".concat((highlightAreaSVGLine.rect.left + highlightAreaSVGLine.rect.width - lineOffset) * scale));
                        var y = (highlightAreaSVGLine.rect.top + highlightAreaSVGLine.rect.height - (underlineThickness / 2)) * scale;
                        highlightAreaSVGLine.setAttribute("y1", "".concat(y));
                        highlightAreaSVGLine.setAttribute("y2", "".concat(y));
                        highlightAreaSVGLine.setAttribute("height", "".concat(highlightAreaSVGLine.rect.height * scale));
                        highlightAreaSVGLine.setAttribute("width", "".concat(highlightAreaSVGLine.rect.width * scale));
                        highlightAreaSVGDocFrag.appendChild(highlightAreaSVGLine);
                    }
                    else if (drawStrikeThrough) {
                        var highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                        highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                        highlightAreaSVGLine.setAttribute("style", "stroke-linecap: butt !important; " +
                            "stroke-width: ".concat(strikeThroughLineThickness * scale, " !important; ") +
                            "stroke: rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ") !important;") +
                            (USE_BLEND_MODE ? "" : " stroke-opacity: ".concat(opacity, " !important")));
                        highlightAreaSVGLine.scale = scale;
                        highlightAreaSVGLine.rect = {
                            height: clientRect.height,
                            left: clientRect.left - xOffset,
                            top: clientRect.top - yOffset,
                            width: clientRect.width,
                        };
                        highlightAreaSVGLine.setAttribute("x1", "".concat(highlightAreaSVGLine.rect.left * scale));
                        highlightAreaSVGLine.setAttribute("x2", "".concat((highlightAreaSVGLine.rect.left + highlightAreaSVGLine.rect.width) * scale));
                        var lineOffset = highlightAreaSVGLine.rect.height / 2;
                        var y = (highlightAreaSVGLine.rect.top + lineOffset) * scale;
                        highlightAreaSVGLine.setAttribute("y1", "".concat(y));
                        highlightAreaSVGLine.setAttribute("y2", "".concat(y));
                        highlightAreaSVGLine.setAttribute("height", "".concat(highlightAreaSVGLine.rect.height * scale));
                        highlightAreaSVGLine.setAttribute("width", "".concat(highlightAreaSVGLine.rect.width * scale));
                        highlightAreaSVGDocFrag.appendChild(highlightAreaSVGLine);
                    }
                    else {
                        var highlightAreaSVGRect = documant.createElementNS(SVG_XML_NAMESPACE, "rect");
                        highlightAreaSVGRect.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                        highlightAreaSVGRect.setAttribute("style", "fill: rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ") !important; ") +
                            "stroke-width: 0;" +
                            (USE_BLEND_MODE ? "" : " fill-opacity: ".concat(opacity, " !important;")));
                        highlightAreaSVGRect.scale = scale;
                        highlightAreaSVGRect.rect = {
                            height: clientRect.height,
                            left: clientRect.left - xOffset,
                            top: clientRect.top - yOffset,
                            width: clientRect.width,
                        };
                        highlightAreaSVGRect.setAttribute("rx", "".concat(roundedCorner * scale));
                        highlightAreaSVGRect.setAttribute("ry", "".concat(roundedCorner * scale));
                        highlightAreaSVGRect.setAttribute("x", "".concat((highlightAreaSVGRect.rect.left - borderThickness) * scale));
                        highlightAreaSVGRect.setAttribute("y", "".concat((highlightAreaSVGRect.rect.top - borderThickness) * scale));
                        highlightAreaSVGRect.setAttribute("height", "".concat((highlightAreaSVGRect.rect.height + (borderThickness * 2)) * scale));
                        highlightAreaSVGRect.setAttribute("width", "".concat((highlightAreaSVGRect.rect.width + (borderThickness * 2)) * scale));
                        highlightAreaSVGDocFrag.appendChild(highlightAreaSVGRect);
                    }
                }
                else {
                    if (drawStrikeThrough) {
                        var highlightAreaLine = documant.createElement("div");
                        highlightAreaLine.setAttribute("class", "".concat(exports.CLASS_HIGHLIGHT_AREA, " ").concat(styles_1.CLASS_HIGHLIGHT_COMMON));
                        highlightAreaLine.setAttribute("style", (USE_BLEND_MODE ?
                            "background-color: rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ") !important;") :
                            "background-color: rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ") !important;")));
                        highlightAreaLine.style.setProperty("transform", "translate3d(0px, 0px, 0px)", "important");
                        highlightAreaLine.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
                        highlightAreaLine.scale = scale;
                        highlightAreaLine.rect = {
                            height: clientRect.height,
                            left: clientRect.left - xOffset,
                            top: clientRect.top - yOffset,
                            width: clientRect.width,
                        };
                        highlightAreaLine.style.setProperty("width", "".concat(highlightAreaLine.rect.width * scale, "px"), "important");
                        highlightAreaLine.style.setProperty("height", "".concat(strikeThroughLineThickness * scale, "px"), "important");
                        highlightAreaLine.style.setProperty("min-width", highlightAreaLine.style.width, "important");
                        highlightAreaLine.style.setProperty("min-height", highlightAreaLine.style.height, "important");
                        highlightAreaLine.style.setProperty("left", "".concat(highlightAreaLine.rect.left * scale, "px"), "important");
                        highlightAreaLine.style.setProperty("top", "".concat((highlightAreaLine.rect.top + (highlightAreaLine.rect.height / 2) - (strikeThroughLineThickness / 2)) * scale, "px"), "important");
                        highlightParent.append(highlightAreaLine);
                    }
                    else {
                        var highlightArea = documant.createElement("div");
                        highlightArea.setAttribute("class", "".concat(exports.CLASS_HIGHLIGHT_AREA, " ").concat(styles_1.CLASS_HIGHLIGHT_COMMON));
                        var extra = "";
                        if ((DEBUG_VISUALS || win.READIUM2.DEBUG_VISUALS)) {
                            var rgb = Math.round(0xffffff * Math.random());
                            var r = rgb >> 16;
                            var g = rgb >> 8 & 255;
                            var b = rgb & 255;
                            extra = "outline-color: rgb(".concat(r, ", ").concat(g, ", ").concat(b, "); outline-style: solid; outline-width: 1px; outline-offset: -1px;");
                        }
                        else if (drawUnderline) {
                            var side = (0, readium_css_1.isVerticalWritingMode)() ? "left" : "bottom";
                            extra = "border-".concat(side, ": ").concat(underlineThickness * scale, "px solid ") +
                                (USE_BLEND_MODE ?
                                    "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ") !important") :
                                    "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ") !important"));
                        }
                        highlightArea.setAttribute("style", (drawUnderline ?
                            "" :
                            ("background-color: " +
                                (USE_BLEND_MODE ?
                                    "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ") !important;") :
                                    "rgba(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ", ").concat(opacity, ") !important;")))) + " ".concat(extra));
                        highlightArea.style.setProperty("transform", "translate3d(0px, 0px, 0px)", "important");
                        highlightArea.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
                        highlightArea.scale = scale;
                        highlightArea.rect = {
                            height: clientRect.height,
                            left: clientRect.left - xOffset,
                            top: clientRect.top - yOffset,
                            width: clientRect.width,
                        };
                        highlightArea.style.setProperty("width", "".concat(highlightArea.rect.width * scale, "px"), "important");
                        highlightArea.style.setProperty("height", "".concat(highlightArea.rect.height * scale, "px"), "important");
                        highlightArea.style.setProperty("min-width", highlightArea.style.width, "important");
                        highlightArea.style.setProperty("min-height", highlightArea.style.height, "important");
                        highlightArea.style.setProperty("left", "".concat(highlightArea.rect.left * scale, "px"), "important");
                        highlightArea.style.setProperty("top", "".concat(highlightArea.rect.top * scale, "px"), "important");
                        highlightParent.append(highlightArea);
                    }
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (clientRects_1_1 && !clientRects_1_1.done && (_a = clientRects_1.return)) _a.call(clientRects_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        if (useSVG && highlightAreaSVGDocFrag) {
            var highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
            highlightAreaSVG.setAttribute("class", styles_1.CLASS_HIGHLIGHT_COMMON);
            highlightAreaSVG.style.setProperty("position", paginated ? "fixed" : "absolute", "important");
            highlightAreaSVG.append(highlightAreaSVGDocFrag);
            highlightParent.append(highlightAreaSVG);
        }
    }
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map