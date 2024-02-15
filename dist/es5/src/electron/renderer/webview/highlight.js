"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlightsGroup = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.setDrawMargin = void 0;
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
var core_1 = require("@flatten-js/core");
var unify = core_1.BooleanOperations.unify;
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
window.DEBUG_RECTS = IS_DEV && rect_utils_1.VERBOSE;
var DEFAULT_BACKGROUND_COLOR = {
    blue: 0,
    green: 0,
    red: 255,
};
var _highlights = [];
var _drawMargin = false;
var drawMargin = function (h) {
    if (Array.isArray(_drawMargin)) {
        if (h.group) {
            return _drawMargin.includes(h.group);
        }
        return false;
    }
    return _drawMargin;
};
var setDrawMargin = function (win, drawMargin) {
    _drawMargin = drawMargin;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- _drawMargin: " + JSON.stringify(_drawMargin, null, 4));
    }
    recreateAllHighlightsRaw(win);
};
exports.setDrawMargin = setDrawMargin;
var SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
function getBoundingClientRectOfDocumentBody(win) {
    return win.document.body.getBoundingClientRect();
}
exports.getBoundingClientRectOfDocumentBody = getBoundingClientRectOfDocumentBody;
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
    var scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    var hit = false;
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
        var highlightFragment = highlightParent.firstElementChild;
        while (highlightFragment) {
            if (highlightFragment.namespaceURI === SVG_XML_NAMESPACE) {
                var svg = highlightFragment;
                hit = svg.polygon.contains(new core_1.Point((x - xOffset) * scale, (y - yOffset) * scale));
                if (hit) {
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
    var highlightContainer = _highlightsContainer.firstElementChild;
    while (highlightContainer) {
        if (!foundElement || foundElement !== highlightContainer) {
            highlightContainer.classList.remove(styles_1.CLASS_HIGHLIGHT_HOVER);
        }
        highlightContainer = highlightContainer.nextElementSibling;
    }
    if (!hit) {
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        return;
    }
    if (foundElement && (foundHighlight === null || foundHighlight === void 0 ? void 0 : foundHighlight.pointerInteraction)) {
        if (isMouseMove) {
            foundElement.classList.add(styles_1.CLASS_HIGHLIGHT_HOVER);
            documant.documentElement.classList.add(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        }
        else if (ev.type === "mouseup" || ev.type === "click") {
            documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
            ev.preventDefault();
            ev.stopPropagation();
            var payload = {
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
function destroyHighlightsGroup(documant, group) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlightsGroup: " + group + " ... " + _highlights.length);
    }
    var _loop_1 = function () {
        var i = -1;
        var highlight = _highlights.find(function (h, j) {
            i = j;
            return h.group === group;
        });
        if (highlight) {
            if (i >= 0 && i < _highlights.length) {
                _highlights.splice(i, 1);
            }
            var highlightContainer = documant.getElementById(highlight.id);
            if (highlightContainer) {
                highlightContainer.remove();
            }
        }
        else {
            return "break";
        }
    };
    while (true) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
}
exports.destroyHighlightsGroup = destroyHighlightsGroup;
function recreateAllHighlightsRaw(win, highlights) {
    var e_1, _a;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw: " + _highlights.length + " ==> " + (highlights === null || highlights === void 0 ? void 0 : highlights.length));
    }
    var documant = win.document;
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
        _highlights.push.apply(_highlights, tslib_1.__spreadArray([], tslib_1.__read(highlights), false));
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
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var bodyComputedStyle = win.getComputedStyle(documant.body);
    var docFrag = documant.createDocumentFragment();
    try {
        for (var _highlights_1 = tslib_1.__values(_highlights), _highlights_1_1 = _highlights_1.next(); !_highlights_1_1.done; _highlights_1_1 = _highlights_1.next()) {
            var highlight = _highlights_1_1.value;
            var div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
            if (div) {
                docFrag.append(div);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_highlights_1_1 && !_highlights_1_1.done && (_a = _highlights_1.return)) _a.call(_highlights_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
}
exports.recreateAllHighlightsRaw = recreateAllHighlightsRaw;
exports.recreateAllHighlightsDebounced = debounce(function (win) {
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
    var e_2, _a;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlights: " + highDefs.length + " ... " + _highlights.length);
    }
    var documant = win.document;
    var highlights = [];
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var bodyComputedStyle = win.getComputedStyle(documant.body);
    var docFrag = documant.createDocumentFragment();
    try {
        for (var highDefs_1 = tslib_1.__values(highDefs), highDefs_1_1 = highDefs_1.next(); !highDefs_1_1.done; highDefs_1_1 = highDefs_1.next()) {
            var highDef = highDefs_1_1.value;
            if (!highDef.selectionInfo && !highDef.range) {
                highlights.push(null);
                continue;
            }
            var _b = tslib_1.__read(createHighlight(win, highDef.selectionInfo, highDef.range, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, highDef.group, bodyRect, bodyComputedStyle), 2), high = _b[0], div = _b[1];
            highlights.push(high);
            if (div) {
                docFrag.append(div);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (highDefs_1_1 && !highDefs_1_1.done && (_a = highDefs_1.return)) _a.call(highDefs_1);
        }
        finally { if (e_2) throw e_2.error; }
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
function createHighlight(win, selectionInfo, range, color, pointerInteraction, drawType, expand, group, bodyRect, bodyComputedStyle) {
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
        group: group,
    };
    _highlights.push(highlight);
    var div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight, bodyRect, bodyComputedStyle) {
    var e_3, _a, e_4, _b, e_5, _c, e_6, _d, e_7, _e, e_8, _f;
    var _g;
    var DEBUG_RECTS = window.DEBUG_RECTS;
    var documant = win.document;
    var scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    var range = highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : highlight.range;
    if (!range) {
        return null;
    }
    var drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline;
    var drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough;
    var paginated = (0, readium_css_inject_1.isPaginated)(documant);
    var rtl = (0, readium_css_2.isRTL)();
    var vertical = (0, readium_css_1.isVerticalWritingMode)();
    var doDrawMargin = drawMargin(highlight);
    var highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", "".concat(styles_1.CLASS_HIGHLIGHT_CONTAINER, " ").concat(styles_1.CLASS_HIGHLIGHT_COMMON));
    highlightParent.setAttribute("data-type", "".concat(highlight.drawType));
    if (highlight.group) {
        highlightParent.setAttribute("data-group", highlight.group);
    }
    if (doDrawMargin) {
        highlightParent.classList.add(styles_1.CLASS_HIGHLIGHT_MARGIN);
    }
    var styleAttr = win.document.documentElement.getAttribute("style");
    var isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
    highlightParent.style.setProperty("mix-blend-mode", isNight ? "hard-light" : "multiply", "important");
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    var scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    var doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    var clientRects;
    var rangeClientRects = (0, rect_utils_1.DOMRectListToArray)(range.getClientRects());
    if (doNotMergeHorizontallyAlignedRects) {
        var textClientRects = (0, rect_utils_1.getTextClientRects)(range);
        var textReducedClientRects = (0, rect_utils_1.getClientRectsNoOverlap)(textClientRects, true, vertical, highlight.expand ? highlight.expand : 0);
        clientRects = (DEBUG_RECTS && drawStrikeThrough) ? textClientRects : textReducedClientRects;
    }
    else {
        clientRects = (0, rect_utils_1.getClientRectsNoOverlap)(rangeClientRects, false, vertical, highlight.expand ? highlight.expand : 0);
    }
    var underlineThickness = 3;
    var strikeThroughLineThickness = 4;
    var bodyWidth = parseInt(bodyComputedStyle.width, 10);
    var paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    var paginatedWidth = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
    var paginatedOffset = (paginatedWidth - bodyWidth) / 2 + parseInt(bodyComputedStyle.paddingLeft, 10);
    var gap = 2;
    var boxesNoGapExpanded = [];
    var boxesGapExpanded = [];
    try {
        for (var clientRects_1 = tslib_1.__values(clientRects), clientRects_1_1 = clientRects_1.next(); !clientRects_1_1.done; clientRects_1_1 = clientRects_1.next()) {
            var clientRect = clientRects_1_1.value;
            var rect = {
                height: clientRect.height,
                left: clientRect.left - xOffset,
                top: clientRect.top - yOffset,
                width: clientRect.width,
            };
            var w = rect.width * scale;
            var h = rect.height * scale;
            var x = rect.left * scale;
            var y = rect.top * scale;
            boxesGapExpanded.push(new core_1.Box(Number((x - gap).toPrecision(12)), Number((y - gap).toPrecision(12)), Number((x + w + gap).toPrecision(12)), Number((y + h + gap).toPrecision(12))));
            if (drawStrikeThrough) {
                var thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : strikeThroughLineThickness;
                var ww = (vertical ? thickness : rect.width) * scale;
                var hh = (vertical ? rect.height : thickness) * scale;
                var xx = (vertical
                    ?
                        (DEBUG_RECTS
                            ?
                                rect.left
                            :
                                (rect.left + (rect.width / 2) - (thickness / 2)))
                    :
                        rect.left) * scale;
                var yy = (vertical
                    ?
                        rect.top
                    :
                        (DEBUG_RECTS
                            ?
                                rect.top
                            :
                                (rect.top + (rect.height / 2) - (thickness / 2)))) * scale;
                boxesNoGapExpanded.push(new core_1.Box(Number((xx).toPrecision(12)), Number((yy).toPrecision(12)), Number((xx + ww).toPrecision(12)), Number((yy + hh).toPrecision(12))));
            }
            else {
                var thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : underlineThickness;
                if (drawUnderline) {
                    var ww = (vertical ? thickness : rect.width) * scale;
                    var hh = (vertical ? rect.height : thickness) * scale;
                    var xx = (vertical
                        ?
                            (DEBUG_RECTS
                                ?
                                    rect.left
                                :
                                    (rect.left - (thickness / 2)))
                        :
                            rect.left) * scale;
                    var yy = (vertical
                        ?
                            rect.top
                        :
                            (DEBUG_RECTS
                                ?
                                    rect.top
                                :
                                    (rect.top + rect.height - (thickness / 2)))) * scale;
                    boxesNoGapExpanded.push(new core_1.Box(Number((xx).toPrecision(12)), Number((yy).toPrecision(12)), Number((xx + ww).toPrecision(12)), Number((yy + hh).toPrecision(12))));
                }
                else {
                    boxesNoGapExpanded.push(new core_1.Box(Number((x).toPrecision(12)), Number((y).toPrecision(12)), Number((x + w).toPrecision(12)), Number((y + h).toPrecision(12))));
                }
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (clientRects_1_1 && !clientRects_1_1.done && (_a = clientRects_1.return)) _a.call(clientRects_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    var polygonCountourUnionPoly = boxesGapExpanded.reduce(function (previous, current) { return unify(previous, new core_1.Polygon(current)); }, new core_1.Polygon());
    Array.from(polygonCountourUnionPoly.faces).forEach(function (face) {
        if (face.orientation() !== core_1.ORIENTATION.CCW) {
            if (IS_DEV) {
                console.log("--HIGH WEBVIEW-- removing polygon clockwise face / inner hole (contour))");
            }
            polygonCountourUnionPoly.deleteFace(face);
        }
    });
    var polygonSurface;
    if (doNotMergeHorizontallyAlignedRects) {
        var singleSVGPath = !DEBUG_RECTS;
        if (singleSVGPath) {
            polygonSurface = new core_1.Polygon();
            try {
                for (var boxesNoGapExpanded_1 = tslib_1.__values(boxesNoGapExpanded), boxesNoGapExpanded_1_1 = boxesNoGapExpanded_1.next(); !boxesNoGapExpanded_1_1.done; boxesNoGapExpanded_1_1 = boxesNoGapExpanded_1.next()) {
                    var box = boxesNoGapExpanded_1_1.value;
                    polygonSurface.addFace(box);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (boxesNoGapExpanded_1_1 && !boxesNoGapExpanded_1_1.done && (_b = boxesNoGapExpanded_1.return)) _b.call(boxesNoGapExpanded_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        else {
            polygonSurface = [];
            try {
                for (var boxesNoGapExpanded_2 = tslib_1.__values(boxesNoGapExpanded), boxesNoGapExpanded_2_1 = boxesNoGapExpanded_2.next(); !boxesNoGapExpanded_2_1.done; boxesNoGapExpanded_2_1 = boxesNoGapExpanded_2.next()) {
                    var box = boxesNoGapExpanded_2_1.value;
                    var poly = new core_1.Polygon();
                    poly.addFace(box);
                    polygonSurface.push(poly);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (boxesNoGapExpanded_2_1 && !boxesNoGapExpanded_2_1.done && (_c = boxesNoGapExpanded_2.return)) _c.call(boxesNoGapExpanded_2);
                }
                finally { if (e_5) throw e_5.error; }
            }
        }
    }
    else {
        polygonSurface = boxesNoGapExpanded.reduce(function (previous, current) { return unify(previous, new core_1.Polygon(current)); }, new core_1.Polygon());
        Array.from(polygonSurface.faces).forEach(function (face) {
            if (face.orientation() !== core_1.ORIENTATION.CCW) {
                if (IS_DEV) {
                    console.log("--HIGH WEBVIEW-- removing polygon clockwise face / inner hole (surface))");
                }
                polygonSurface.deleteFace(face);
            }
        });
    }
    var highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
    highlightAreaSVG.setAttribute("class", "".concat(styles_1.CLASS_HIGHLIGHT_COMMON, " ").concat(styles_1.CLASS_HIGHLIGHT_CONTOUR));
    highlightAreaSVG.polygon = polygonCountourUnionPoly;
    highlightAreaSVG.innerHTML =
        (Array.isArray(polygonSurface)
            ?
                polygonSurface.reduce(function (prev, cur) {
                    return prev + cur.svg({
                        fill: DEBUG_RECTS ? "pink" : "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"),
                        fillRule: "evenodd",
                        stroke: DEBUG_RECTS ? "magenta" : "transparent",
                        strokeWidth: DEBUG_RECTS ? 1 : 0,
                        fillOpacity: 1,
                        className: undefined,
                    });
                }, "")
            :
                polygonSurface.svg({
                    fill: DEBUG_RECTS ? "yellow" : "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"),
                    fillRule: "evenodd",
                    stroke: DEBUG_RECTS ? "green" : "transparent",
                    strokeWidth: DEBUG_RECTS ? 1 : 0,
                    fillOpacity: 1,
                    className: undefined,
                }))
            +
                polygonCountourUnionPoly.svg({
                    fill: "transparent",
                    fillRule: "evenodd",
                    stroke: DEBUG_RECTS ? "red" : "transparent",
                    strokeWidth: DEBUG_RECTS ? 1 : 1,
                    fillOpacity: 1,
                    className: undefined,
                });
    highlightParent.append(highlightAreaSVG);
    if (doDrawMargin && highlight.pointerInteraction) {
        var MARGIN_MARKER_THICKNESS_1 = 14 * (win.READIUM2.isFixedLayout ? scale : 1);
        var MARGIN_MARKER_OFFSET_1 = 6 * (win.READIUM2.isFixedLayout ? scale : 1);
        var paginatedOffset_1 = paginatedOffset - MARGIN_MARKER_OFFSET_1 - MARGIN_MARKER_THICKNESS_1;
        var boundingRect_2;
        var polygonCountourMarginRects = Array.from(polygonCountourUnionPoly.faces).map(function (face) {
            var b = face.box;
            var left = vertical ?
                b.xmin :
                paginated ?
                    ((rtl
                        ?
                            paginatedWidth - MARGIN_MARKER_THICKNESS_1
                        :
                            0)
                        +
                            (rtl
                                ?
                                    -1 * paginatedOffset_1
                                :
                                    paginatedOffset_1)
                        +
                            Math.floor((b.xmin) / paginatedWidth) * paginatedWidth)
                    :
                        (rtl
                            ?
                                MARGIN_MARKER_OFFSET_1 + bodyRect.width - parseInt(bodyComputedStyle.paddingRight, 10)
                            :
                                win.READIUM2.isFixedLayout
                                    ?
                                        MARGIN_MARKER_OFFSET_1
                                    :
                                        parseInt(bodyComputedStyle.paddingLeft, 10) - MARGIN_MARKER_THICKNESS_1 - MARGIN_MARKER_OFFSET_1);
            var top = vertical
                ?
                    parseInt(bodyComputedStyle.paddingTop, 10) - MARGIN_MARKER_THICKNESS_1 - MARGIN_MARKER_OFFSET_1
                :
                    b.ymin;
            var width = vertical ? b.width : MARGIN_MARKER_THICKNESS_1;
            var height = vertical ? MARGIN_MARKER_THICKNESS_1 : b.height;
            var extra = 0;
            var r = {
                left: left - (vertical ? extra : 0),
                top: top - (vertical ? 0 : extra),
                right: left + width + (vertical ? extra : 0),
                bottom: top + height + (vertical ? 0 : extra),
                width: width + extra * 2,
                height: height + extra * 2,
            };
            boundingRect_2 = boundingRect_2 ? (0, rect_utils_1.getBoundingRect)(boundingRect_2, r) : r;
            return r;
        });
        var useFastBoundingRect = true;
        var polygonMarginUnionPoly = void 0;
        if (paginated) {
            var tolerance_1 = 1;
            var groups = [];
            var _loop_2 = function (r) {
                var group = groups.find(function (g) {
                    return !(r.left < (g.x - tolerance_1) || r.left > (g.x + tolerance_1));
                });
                if (!group) {
                    groups.push({
                        x: r.left,
                        boxes: [r],
                    });
                }
                else {
                    (_g = group.boxes) === null || _g === void 0 ? void 0 : _g.push(r);
                }
            };
            try {
                for (var polygonCountourMarginRects_1 = tslib_1.__values(polygonCountourMarginRects), polygonCountourMarginRects_1_1 = polygonCountourMarginRects_1.next(); !polygonCountourMarginRects_1_1.done; polygonCountourMarginRects_1_1 = polygonCountourMarginRects_1.next()) {
                    var r = polygonCountourMarginRects_1_1.value;
                    _loop_2(r);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (polygonCountourMarginRects_1_1 && !polygonCountourMarginRects_1_1.done && (_d = polygonCountourMarginRects_1.return)) _d.call(polygonCountourMarginRects_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
            boundingRect_2 = groups.map(function (g) {
                return g.boxes.reduce(function (prev, cur) {
                    if (prev === cur) {
                        return cur;
                    }
                    return (0, rect_utils_1.getBoundingRect)(prev, cur);
                }, g.boxes[0]);
            });
            if (boundingRect_2.length === 1) {
                boundingRect_2 = boundingRect_2[0];
            }
        }
        if (useFastBoundingRect) {
            if (boundingRect_2) {
                polygonMarginUnionPoly = new core_1.Polygon();
                if (Array.isArray(boundingRect_2)) {
                    try {
                        for (var boundingRect_1 = tslib_1.__values(boundingRect_2), boundingRect_1_1 = boundingRect_1.next(); !boundingRect_1_1.done; boundingRect_1_1 = boundingRect_1.next()) {
                            var b = boundingRect_1_1.value;
                            polygonMarginUnionPoly.addFace(new core_1.Box(b.left, b.top, b.right, b.bottom));
                        }
                    }
                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                    finally {
                        try {
                            if (boundingRect_1_1 && !boundingRect_1_1.done && (_e = boundingRect_1.return)) _e.call(boundingRect_1);
                        }
                        finally { if (e_7) throw e_7.error; }
                    }
                }
                else {
                    polygonMarginUnionPoly.addFace(new core_1.Box(boundingRect_2.left, boundingRect_2.top, boundingRect_2.right, boundingRect_2.bottom));
                }
            }
            else {
                var poly = new core_1.Polygon();
                try {
                    for (var polygonCountourMarginRects_2 = tslib_1.__values(polygonCountourMarginRects), polygonCountourMarginRects_2_1 = polygonCountourMarginRects_2.next(); !polygonCountourMarginRects_2_1.done; polygonCountourMarginRects_2_1 = polygonCountourMarginRects_2.next()) {
                        var r = polygonCountourMarginRects_2_1.value;
                        poly.addFace(new core_1.Box(r.left, r.top, r.right, r.bottom));
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (polygonCountourMarginRects_2_1 && !polygonCountourMarginRects_2_1.done && (_f = polygonCountourMarginRects_2.return)) _f.call(polygonCountourMarginRects_2);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
                polygonMarginUnionPoly = new core_1.Polygon();
                polygonMarginUnionPoly.addFace(poly.box);
            }
        }
        else {
            polygonMarginUnionPoly = polygonCountourMarginRects.reduce(function (previous, r) { return unify(previous, new core_1.Polygon(new core_1.Box(r.left, r.top, r.right, r.bottom))); }, new core_1.Polygon());
        }
        var highlightMarginSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightMarginSVG.setAttribute("class", "".concat(styles_1.CLASS_HIGHLIGHT_COMMON, " ").concat(styles_1.CLASS_HIGHLIGHT_CONTOUR_MARGIN));
        highlightMarginSVG.polygon = polygonMarginUnionPoly;
        highlightMarginSVG.innerHTML = polygonMarginUnionPoly.svg({
            fill: "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"),
            fillRule: "evenodd",
            stroke: "transparent",
            strokeWidth: 0,
            fillOpacity: 1,
            className: undefined,
        });
        highlightParent.append(highlightMarginSVG);
    }
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map