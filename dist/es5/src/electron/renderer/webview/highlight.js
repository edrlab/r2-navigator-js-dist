"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.CLASS_HIGHLIGHT_BOUNDING_AREA = exports.CLASS_HIGHLIGHT_AREA = exports.CLASS_HIGHLIGHT_CONTAINER = exports.ID_HIGHLIGHTS_CONTAINER = void 0;
var tslib_1 = require("tslib");
var crypto = require("crypto");
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var readium_css_inject_1 = require("../../common/readium-css-inject");
var rect_utils_1 = require("../common/rect-utils");
var readium_css_1 = require("./readium-css");
var selection_1 = require("./selection");
exports.ID_HIGHLIGHTS_CONTAINER = "R2_ID_HIGHLIGHTS_CONTAINER";
exports.CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
exports.CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
exports.CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
var USE_SVG = false;
var USE_BLEND_MODE = true;
var DEFAULT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 0.6 : 0.3;
var ALT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 0.9 : 0.45;
var ALT_OTHER_BACKGROUND_COLOR_OPACITY = 0.35;
var DEFAULT_BACKGROUND_COLOR = {
    blue: 100,
    green: 50,
    red: 230,
};
var _highlights = [];
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
    highlightBounding.style.outline = "none";
    highlightBounding.style.setProperty("background-color", "transparent", "important");
}
function setHighlightBoundingStyle(_win, highlightBounding, highlight) {
    if (highlightBounding.active) {
        return;
    }
    highlightBounding.active = true;
    var opacity = ALT_BACKGROUND_COLOR_OPACITY;
    highlightBounding.style.setProperty("background-color", USE_BLEND_MODE ?
        "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")" :
        "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ")", "important");
    highlightBounding.style.outlineColor = "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", 1)";
    highlightBounding.style.outlineStyle = "solid";
    highlightBounding.style.outlineWidth = "1px";
    highlightBounding.style.outlineOffset = "0px";
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
    var useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
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
                    highlightArea.style.setProperty("fill", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                }
                highlightArea.style.setProperty("stroke", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                if (!USE_BLEND_MODE) {
                    if (!highlight.drawType) {
                        highlightArea.style.setProperty("fill-opacity", "" + opacity, "important");
                    }
                    highlightArea.style.setProperty("stroke-opacity", "" + opacity, "important");
                }
            }
            else {
                highlightArea.style.setProperty("background-color", highlight.drawType === 1 ? "transparent" :
                    (USE_BLEND_MODE ?
                        "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")" :
                        "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ")"), "important");
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
    var useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
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
                    highlightArea.style.setProperty("fill", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                }
                highlightArea.style.setProperty("stroke", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                if (!USE_BLEND_MODE) {
                    if (!highlight.drawType) {
                        highlightArea.style.setProperty("fill-opacity", "" + opacity, "important");
                    }
                    highlightArea.style.setProperty("stroke-opacity", "" + opacity, "important");
                }
            }
            else {
                highlightArea.style.setProperty("background-color", highlight.drawType === 1 ? "transparent" :
                    (USE_BLEND_MODE ?
                        "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")" :
                        "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ")"), "important");
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
    var scrollElement = readium_css_1.getScrollingElement(documant);
    var x = ev.clientX;
    var y = ev.clientY;
    var paginated = readium_css_inject_1.isPaginated(documant);
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
    var useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
    var foundHighlight;
    var foundElement;
    for (var i = _highlights.length - 1; i >= 0; i--) {
        var highlight = _highlights[i];
        var highlightParent = documant.getElementById("" + highlight.id);
        if (!highlightParent) {
            highlightParent = _highlightsContainer.querySelector("#" + highlight.id);
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
        var highlightContainer = _highlightsContainer.firstElementChild;
        while (highlightContainer) {
            if (USE_BLEND_MODE) {
                highlightContainer.style.opacity = "" + opacity;
            }
            if (win.READIUM2.DEBUG_VISUALS) {
                var highlightContainerChild = highlightContainer.firstElementChild;
                while (highlightContainerChild) {
                    if (highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA)) {
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
    if (foundElement.getAttribute("data-click")) {
        if (isMouseMove) {
            var foundElementHighlightAreas = foundElement.querySelectorAll("." + exports.CLASS_HIGHLIGHT_AREA);
            var foundElementHighlightBounding = foundElement.querySelector("." + exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
            var highlightContainer = _highlightsContainer.firstElementChild;
            while (highlightContainer) {
                if (USE_BLEND_MODE) {
                    if (highlightContainer !== foundElement) {
                        highlightContainer.style.opacity = "" + ALT_OTHER_BACKGROUND_COLOR_OPACITY;
                    }
                }
                if (win.READIUM2.DEBUG_VISUALS) {
                    var highlightContainerChild = highlightContainer.firstElementChild;
                    while (highlightContainerChild) {
                        if (highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA)) {
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
            if (USE_BLEND_MODE) {
                foundElement.style.opacity = "" + ALT_BACKGROUND_COLOR_OPACITY;
            }
            else {
                setHighlightAreaStyle(win, foundElementHighlightAreas, foundHighlight);
            }
            if (foundElementHighlightBounding && win.READIUM2.DEBUG_VISUALS) {
                setHighlightBoundingStyle(win, foundElementHighlightBounding, foundHighlight);
            }
        }
        else if (ev.type === "mouseup" || ev.type === "click") {
            var payload = {
                highlight: foundHighlight,
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
        documant.body.style.position = "relative";
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
        _highlightsContainer.setAttribute("id", exports.ID_HIGHLIGHTS_CONTAINER);
        _highlightsContainer.setAttribute("style", "background-color: transparent !important; position: absolute; width: auto; height: auto; top: 0; left: 0; overflow: visible;");
        _highlightsContainer.style.setProperty("pointer-events", "none");
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
    var docFrag = documant.createDocumentFragment();
    try {
        for (var _highlights_1 = tslib_1.__values(_highlights), _highlights_1_1 = _highlights_1.next(); !_highlights_1_1.done; _highlights_1_1 = _highlights_1.next()) {
            var highlight = _highlights_1_1.value;
            var div = createHighlightDom(win, highlight, bodyRect);
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
exports.recreateAllHighlightsDebounced = debounce_1.debounce(function (win) {
    recreateAllHighlightsRaw(win);
}, 500);
function recreateAllHighlights(win) {
    hideAllhighlights(win.document);
    exports.recreateAllHighlightsDebounced(win);
}
exports.recreateAllHighlights = recreateAllHighlights;
function createHighlights(win, highDefs, pointerInteraction) {
    var e_3, _a;
    var documant = win.document;
    var highlights = [];
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var docFrag = documant.createDocumentFragment();
    try {
        for (var highDefs_1 = tslib_1.__values(highDefs), highDefs_1_1 = highDefs_1.next(); !highDefs_1_1.done; highDefs_1_1 = highDefs_1.next()) {
            var highDef = highDefs_1_1.value;
            if (!highDef.selectionInfo) {
                highlights.push(null);
                continue;
            }
            var _b = tslib_1.__read(createHighlight(win, highDef.selectionInfo, highDef.color, pointerInteraction, highDef.drawType, bodyRect), 2), high = _b[0], div = _b[1];
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
function createHighlight(win, selectionInfo, color, pointerInteraction, drawType, bodyRect) {
    var uniqueStr = "" + selectionInfo.rangeInfo.cfi + selectionInfo.rangeInfo.startContainerElementCssSelector + selectionInfo.rangeInfo.startContainerChildTextNodeIndex + selectionInfo.rangeInfo.startOffset + selectionInfo.rangeInfo.endContainerElementCssSelector + selectionInfo.rangeInfo.endContainerChildTextNodeIndex + selectionInfo.rangeInfo.endOffset;
    var checkSum = crypto.createHash("sha256");
    checkSum.update(uniqueStr);
    var sha256Hex = checkSum.digest("hex");
    var id = "R2_HIGHLIGHT_" + sha256Hex;
    destroyHighlight(win.document, id);
    var highlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        drawType: drawType,
        id: id,
        pointerInteraction: pointerInteraction,
        selectionInfo: selectionInfo,
    };
    _highlights.push(highlight);
    var div = createHighlightDom(win, highlight, bodyRect);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight, bodyRect) {
    var e_4, _a;
    var documant = win.document;
    var scrollElement = readium_css_1.getScrollingElement(documant);
    var range = selection_1.convertRangeInfo(documant, highlight.selectionInfo.rangeInfo);
    if (!range) {
        return null;
    }
    var opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    var paginated = readium_css_inject_1.isPaginated(documant);
    var highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", exports.CLASS_HIGHLIGHT_CONTAINER);
    highlightParent.setAttribute("style", "background-color: transparent !important; position: absolute; width: 1px; height: 1px; top: 0; left: 0; overflow: visible;");
    highlightParent.style.setProperty("pointer-events", "none");
    if (highlight.pointerInteraction) {
        highlightParent.setAttribute("data-click", "1");
    }
    if (USE_BLEND_MODE) {
        highlightParent.style.setProperty("mix-blend-mode", "multiply");
        highlightParent.style.opacity = "" + opacity;
    }
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    var scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    var useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
    var drawUnderline = highlight.drawType === 1 && !win.READIUM2.DEBUG_VISUALS;
    var drawStrikeThrough = highlight.drawType === 2 && !win.READIUM2.DEBUG_VISUALS;
    var doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    var clientRects = win.READIUM2.DEBUG_VISUALS ? range.getClientRects() : rect_utils_1.getClientRectsNoOverlap(range, doNotMergeHorizontallyAlignedRects);
    var highlightAreaSVGDocFrag;
    var roundedCorner = 3;
    var underlineThickness = 3;
    var strikeThroughLineThickness = 3;
    var rangeBoundingClientRect = range.getBoundingClientRect();
    var highlightBounding = documant.createElement("div");
    highlightBounding.setAttribute("class", exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
    if (win.READIUM2.DEBUG_VISUALS) {
        highlightBounding.setAttribute("style", "background-color: transparent !important; outline-color: magenta; outline-style: solid; outline-width: 1px; outline-offset: -1px;");
    }
    else {
        highlightBounding.setAttribute("style", "background-color: transparent !important");
    }
    highlightBounding.style.setProperty("pointer-events", "none");
    highlightBounding.style.position = paginated ? "fixed" : "absolute";
    highlightBounding.scale = scale;
    highlightBounding.rect = {
        height: rangeBoundingClientRect.height,
        left: rangeBoundingClientRect.left - xOffset,
        top: rangeBoundingClientRect.top - yOffset,
        width: rangeBoundingClientRect.width,
    };
    highlightBounding.style.width = highlightBounding.rect.width * scale + "px";
    highlightBounding.style.height = highlightBounding.rect.height * scale + "px";
    highlightBounding.style.minWidth = highlightBounding.style.width;
    highlightBounding.style.minHeight = highlightBounding.style.height;
    highlightBounding.style.left = highlightBounding.rect.left * scale + "px";
    highlightBounding.style.top = highlightBounding.rect.top * scale + "px";
    highlightParent.append(highlightBounding);
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
                    highlightAreaSVGLine.setAttribute("style", "stroke-linecap: round; stroke-width: " + underlineThickness * scale + "; stroke: rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important;" +
                        (USE_BLEND_MODE ? "" : " stroke-opacity: " + opacity + " !important"));
                    highlightAreaSVGLine.scale = scale;
                    highlightAreaSVGLine.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    var lineOffset = (highlightAreaSVGLine.rect.width > roundedCorner) ? roundedCorner : 0;
                    highlightAreaSVGLine.setAttribute("x1", "" + (highlightAreaSVGLine.rect.left + lineOffset) * scale);
                    highlightAreaSVGLine.setAttribute("x2", "" + (highlightAreaSVGLine.rect.left + highlightAreaSVGLine.rect.width - lineOffset) * scale);
                    var y = (highlightAreaSVGLine.rect.top + highlightAreaSVGLine.rect.height - (underlineThickness / 2)) * scale;
                    highlightAreaSVGLine.setAttribute("y1", "" + y);
                    highlightAreaSVGLine.setAttribute("y2", "" + y);
                    highlightAreaSVGLine.setAttribute("height", "" + highlightAreaSVGLine.rect.height * scale);
                    highlightAreaSVGLine.setAttribute("width", "" + highlightAreaSVGLine.rect.width * scale);
                    highlightAreaSVGDocFrag.appendChild(highlightAreaSVGLine);
                }
                else if (drawStrikeThrough) {
                    var highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                    highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaSVGLine.setAttribute("style", "stroke-linecap: butt; stroke-width: " + strikeThroughLineThickness * scale + "; stroke: rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important;" +
                        (USE_BLEND_MODE ? "" : " stroke-opacity: " + opacity + " !important"));
                    highlightAreaSVGLine.scale = scale;
                    highlightAreaSVGLine.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    highlightAreaSVGLine.setAttribute("x1", "" + highlightAreaSVGLine.rect.left * scale);
                    highlightAreaSVGLine.setAttribute("x2", "" + (highlightAreaSVGLine.rect.left + highlightAreaSVGLine.rect.width) * scale);
                    var lineOffset = highlightAreaSVGLine.rect.height / 2;
                    var y = (highlightAreaSVGLine.rect.top + lineOffset) * scale;
                    highlightAreaSVGLine.setAttribute("y1", "" + y);
                    highlightAreaSVGLine.setAttribute("y2", "" + y);
                    highlightAreaSVGLine.setAttribute("height", "" + highlightAreaSVGLine.rect.height * scale);
                    highlightAreaSVGLine.setAttribute("width", "" + highlightAreaSVGLine.rect.width * scale);
                    highlightAreaSVGDocFrag.appendChild(highlightAreaSVGLine);
                }
                else {
                    var highlightAreaSVGRect = documant.createElementNS(SVG_XML_NAMESPACE, "rect");
                    highlightAreaSVGRect.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaSVGRect.setAttribute("style", "fill: rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important; stroke-width: 0;" +
                        (USE_BLEND_MODE ? "" : " fill-opacity: " + opacity + " !important;"));
                    highlightAreaSVGRect.scale = scale;
                    highlightAreaSVGRect.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    highlightAreaSVGRect.setAttribute("rx", "" + roundedCorner * scale);
                    highlightAreaSVGRect.setAttribute("ry", "" + roundedCorner * scale);
                    highlightAreaSVGRect.setAttribute("x", "" + (highlightAreaSVGRect.rect.left - borderThickness) * scale);
                    highlightAreaSVGRect.setAttribute("y", "" + (highlightAreaSVGRect.rect.top - borderThickness) * scale);
                    highlightAreaSVGRect.setAttribute("height", "" + (highlightAreaSVGRect.rect.height + (borderThickness * 2)) * scale);
                    highlightAreaSVGRect.setAttribute("width", "" + (highlightAreaSVGRect.rect.width + (borderThickness * 2)) * scale);
                    highlightAreaSVGDocFrag.appendChild(highlightAreaSVGRect);
                }
            }
            else {
                if (drawStrikeThrough) {
                    var highlightAreaLine = documant.createElement("div");
                    highlightAreaLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaLine.setAttribute("style", USE_BLEND_MODE ?
                        "background-color: rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important;" :
                        "background-color: rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ") !important;");
                    highlightAreaLine.style.setProperty("pointer-events", "none");
                    highlightAreaLine.style.transform = "translate3d(0px, 0px, 0px)";
                    highlightAreaLine.style.position = paginated ? "fixed" : "absolute";
                    highlightAreaLine.scale = scale;
                    highlightAreaLine.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    highlightAreaLine.style.width = highlightAreaLine.rect.width * scale + "px";
                    highlightAreaLine.style.height = strikeThroughLineThickness * scale + "px";
                    highlightAreaLine.style.minWidth = highlightAreaLine.style.width;
                    highlightAreaLine.style.minHeight = highlightAreaLine.style.height;
                    highlightAreaLine.style.left = highlightAreaLine.rect.left * scale + "px";
                    highlightAreaLine.style.top = (highlightAreaLine.rect.top + (highlightAreaLine.rect.height / 2) - (strikeThroughLineThickness / 2)) * scale + "px";
                    highlightParent.append(highlightAreaLine);
                }
                else {
                    var highlightArea = documant.createElement("div");
                    highlightArea.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    var extra = "";
                    if (win.READIUM2.DEBUG_VISUALS) {
                        var rgb = Math.round(0xffffff * Math.random());
                        var r = rgb >> 16;
                        var g = rgb >> 8 & 255;
                        var b = rgb & 255;
                        extra = "outline-color: rgb(" + r + ", " + g + ", " + b + "); outline-style: solid; outline-width: 1px; outline-offset: -1px;";
                    }
                    else if (drawUnderline) {
                        extra = "border-bottom: " + underlineThickness * scale + "px solid " +
                            (USE_BLEND_MODE ?
                                "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important" :
                                "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ") !important");
                    }
                    highlightArea.setAttribute("style", "box-sizing: border-box; " +
                        (drawUnderline ?
                            "" :
                            ("border-radius: " + roundedCorner + "px !important; background-color: " +
                                (USE_BLEND_MODE ?
                                    "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important;" :
                                    "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ") !important;"))) + (" " + extra));
                    highlightArea.style.setProperty("pointer-events", "none");
                    highlightArea.style.transform = "translate3d(0px, 0px, 0px)";
                    highlightArea.style.position = paginated ? "fixed" : "absolute";
                    highlightArea.scale = scale;
                    highlightArea.rect = {
                        height: clientRect.height,
                        left: clientRect.left - xOffset,
                        top: clientRect.top - yOffset,
                        width: clientRect.width,
                    };
                    highlightArea.style.width = highlightArea.rect.width * scale + "px";
                    highlightArea.style.height = highlightArea.rect.height * scale + "px";
                    highlightArea.style.minWidth = highlightArea.style.width;
                    highlightArea.style.minHeight = highlightArea.style.height;
                    highlightArea.style.left = highlightArea.rect.left * scale + "px";
                    highlightArea.style.top = highlightArea.rect.top * scale + "px";
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
        highlightAreaSVG.setAttribute("style", "background-color: transparent !important");
        highlightAreaSVG.setAttribute("pointer-events", "none");
        highlightAreaSVG.style.position = paginated ? "fixed" : "absolute";
        highlightAreaSVG.style.overflow = "visible";
        highlightAreaSVG.style.left = "0";
        highlightAreaSVG.style.top = "0";
        highlightAreaSVG.append(highlightAreaSVGDocFrag);
        highlightParent.append(highlightAreaSVG);
    }
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map