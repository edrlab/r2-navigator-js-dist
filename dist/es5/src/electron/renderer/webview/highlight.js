"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var DEFAULT_BACKGROUND_COLOR_OPACITY = 0.3;
var ALT_BACKGROUND_COLOR_OPACITY = 0.45;
var DEFAULT_BACKGROUND_COLOR = {
    blue: 100,
    green: 50,
    red: 230,
};
var _highlights = [];
var SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
function resetHighlightBoundingStyle(_win, highlightBounding) {
    highlightBounding.style.outline = "none";
    highlightBounding.style.setProperty("background-color", "transparent", "important");
}
function setHighlightBoundingStyle(_win, highlightBounding, highlight) {
    var opacity = ALT_BACKGROUND_COLOR_OPACITY;
    highlightBounding.style.setProperty("background-color", "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ")", "important");
    highlightBounding.style.outlineColor = "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", 1)";
    highlightBounding.style.outlineStyle = "solid";
    highlightBounding.style.outlineWidth = "1px";
    highlightBounding.style.outlineOffset = "0px";
}
function resetHighlightAreaStyle(win, highlightArea) {
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
            var opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
            if (isSVG) {
                highlightArea.style.setProperty("fill", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                highlightArea.style.setProperty("fill-opacity", "" + opacity, "important");
                highlightArea.style.setProperty("stroke", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                highlightArea.style.setProperty("stroke-opacity", "" + opacity, "important");
            }
            else {
                highlightArea.style.setProperty("background-color", "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ")", "important");
            }
        }
    }
}
function setHighlightAreaStyle(win, highlightAreas, highlight) {
    var e_1, _a;
    var useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
    try {
        for (var highlightAreas_1 = tslib_1.__values(highlightAreas), highlightAreas_1_1 = highlightAreas_1.next(); !highlightAreas_1_1.done; highlightAreas_1_1 = highlightAreas_1.next()) {
            var highlightArea = highlightAreas_1_1.value;
            var isSVG = useSVG && highlightArea.namespaceURI === SVG_XML_NAMESPACE;
            var opacity = ALT_BACKGROUND_COLOR_OPACITY;
            if (isSVG) {
                highlightArea.style.setProperty("fill", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                highlightArea.style.setProperty("fill-opacity", "" + opacity, "important");
                highlightArea.style.setProperty("stroke", "rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ")", "important");
                highlightArea.style.setProperty("stroke-opacity", "" + opacity, "important");
            }
            else {
                highlightArea.style.setProperty("background-color", "rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ")", "important");
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
    var e_2, _a, e_3, _b, e_4, _c, e_5, _d, e_6, _e;
    var documant = win.document;
    var scrollElement = readium_css_1.getScrollingElement(documant);
    var x = ev.clientX;
    var y = ev.clientY;
    if (!_highlightsContainer) {
        return;
    }
    var paginated = readium_css_inject_1.isPaginated(documant);
    var bodyRect = documant.body.getBoundingClientRect();
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
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
        var highlightFragments = highlightParent.querySelectorAll("." + exports.CLASS_HIGHLIGHT_AREA);
        try {
            for (var highlightFragments_1 = (e_2 = void 0, tslib_1.__values(highlightFragments)), highlightFragments_1_1 = highlightFragments_1.next(); !highlightFragments_1_1.done; highlightFragments_1_1 = highlightFragments_1.next()) {
                var highlightFragment = highlightFragments_1_1.value;
                var withRect = highlightFragment;
                var left = withRect.rect.left + xOffset;
                var top_1 = withRect.rect.top + yOffset;
                if (x >= left &&
                    x < (left + withRect.rect.width) &&
                    y >= top_1 &&
                    y < (top_1 + withRect.rect.height)) {
                    hit = true;
                    break;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (highlightFragments_1_1 && !highlightFragments_1_1.done && (_a = highlightFragments_1.return)) _a.call(highlightFragments_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        if (hit) {
            foundHighlight = highlight;
            foundElement = highlightParent;
            break;
        }
    }
    if (!foundHighlight || !foundElement) {
        var highlightBoundings = _highlightsContainer.querySelectorAll("." + exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
        try {
            for (var highlightBoundings_1 = tslib_1.__values(highlightBoundings), highlightBoundings_1_1 = highlightBoundings_1.next(); !highlightBoundings_1_1.done; highlightBoundings_1_1 = highlightBoundings_1.next()) {
                var highlightBounding = highlightBoundings_1_1.value;
                resetHighlightBoundingStyle(win, highlightBounding);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (highlightBoundings_1_1 && !highlightBoundings_1_1.done && (_b = highlightBoundings_1.return)) _b.call(highlightBoundings_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        var allHighlightAreas = Array.from(_highlightsContainer.querySelectorAll("." + exports.CLASS_HIGHLIGHT_AREA));
        try {
            for (var allHighlightAreas_1 = tslib_1.__values(allHighlightAreas), allHighlightAreas_1_1 = allHighlightAreas_1.next(); !allHighlightAreas_1_1.done; allHighlightAreas_1_1 = allHighlightAreas_1.next()) {
                var highlightArea = allHighlightAreas_1_1.value;
                resetHighlightAreaStyle(win, highlightArea);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (allHighlightAreas_1_1 && !allHighlightAreas_1_1.done && (_c = allHighlightAreas_1.return)) _c.call(allHighlightAreas_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return;
    }
    if (foundElement.getAttribute("data-click")) {
        if (ev.type === "mousemove") {
            var foundElementHighlightAreas = Array.from(foundElement.querySelectorAll("." + exports.CLASS_HIGHLIGHT_AREA));
            var allHighlightAreas = _highlightsContainer.querySelectorAll("." + exports.CLASS_HIGHLIGHT_AREA);
            try {
                for (var allHighlightAreas_2 = tslib_1.__values(allHighlightAreas), allHighlightAreas_2_1 = allHighlightAreas_2.next(); !allHighlightAreas_2_1.done; allHighlightAreas_2_1 = allHighlightAreas_2.next()) {
                    var highlightArea = allHighlightAreas_2_1.value;
                    if (foundElementHighlightAreas.indexOf(highlightArea) < 0) {
                        resetHighlightAreaStyle(win, highlightArea);
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (allHighlightAreas_2_1 && !allHighlightAreas_2_1.done && (_d = allHighlightAreas_2.return)) _d.call(allHighlightAreas_2);
                }
                finally { if (e_5) throw e_5.error; }
            }
            setHighlightAreaStyle(win, foundElementHighlightAreas, foundHighlight);
            var foundElementHighlightBounding = foundElement.querySelector("." + exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
            var allHighlightBoundings = _highlightsContainer.querySelectorAll("." + exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
            try {
                for (var allHighlightBoundings_1 = tslib_1.__values(allHighlightBoundings), allHighlightBoundings_1_1 = allHighlightBoundings_1.next(); !allHighlightBoundings_1_1.done; allHighlightBoundings_1_1 = allHighlightBoundings_1.next()) {
                    var highlightBounding = allHighlightBoundings_1_1.value;
                    if (!foundElementHighlightBounding || highlightBounding !== foundElementHighlightBounding) {
                        resetHighlightBoundingStyle(win, highlightBounding);
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (allHighlightBoundings_1_1 && !allHighlightBoundings_1_1.done && (_e = allHighlightBoundings_1.return)) _e.call(allHighlightBoundings_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
            if (foundElementHighlightBounding) {
                if (win.READIUM2.DEBUG_VISUALS) {
                    setHighlightBoundingStyle(win, foundElementHighlightBounding, foundHighlight);
                }
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
    var e_7, _a;
    hideAllhighlights(win.document);
    try {
        for (var _highlights_1 = tslib_1.__values(_highlights), _highlights_1_1 = _highlights_1.next(); !_highlights_1_1.done; _highlights_1_1 = _highlights_1.next()) {
            var highlight = _highlights_1_1.value;
            createHighlightDom(win, highlight);
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (_highlights_1_1 && !_highlights_1_1.done && (_a = _highlights_1.return)) _a.call(_highlights_1);
        }
        finally { if (e_7) throw e_7.error; }
    }
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
function createHighlight(win, selectionInfo, color, pointerInteraction) {
    var uniqueStr = "" + selectionInfo.rangeInfo.cfi + selectionInfo.rangeInfo.startContainerElementCssSelector + selectionInfo.rangeInfo.startContainerChildTextNodeIndex + selectionInfo.rangeInfo.startOffset + selectionInfo.rangeInfo.endContainerElementCssSelector + selectionInfo.rangeInfo.endContainerChildTextNodeIndex + selectionInfo.rangeInfo.endOffset;
    var checkSum = crypto.createHash("sha256");
    checkSum.update(uniqueStr);
    var sha256Hex = checkSum.digest("hex");
    var id = "R2_HIGHLIGHT_" + sha256Hex;
    destroyHighlight(win.document, id);
    var highlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        id: id,
        pointerInteraction: pointerInteraction,
        selectionInfo: selectionInfo,
    };
    _highlights.push(highlight);
    createHighlightDom(win, highlight);
    return highlight;
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight) {
    var e_8, _a;
    var documant = win.document;
    var scrollElement = readium_css_1.getScrollingElement(documant);
    var range = selection_1.convertRangeInfo(documant, highlight.selectionInfo.rangeInfo);
    if (!range) {
        return undefined;
    }
    var paginated = readium_css_inject_1.isPaginated(documant);
    var highlightsContainer = ensureHighlightsContainer(win);
    var highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", exports.CLASS_HIGHLIGHT_CONTAINER);
    highlightParent.style.setProperty("pointer-events", "none");
    if (highlight.pointerInteraction) {
        highlightParent.setAttribute("data-click", "1");
    }
    documant.body.style.position = "relative";
    var bodyRect = documant.body.getBoundingClientRect();
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    var scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    var useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
    var drawUnderline = true;
    var drawStrikeThrough = false;
    var doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    var clientRects = win.READIUM2.DEBUG_VISUALS ? range.getClientRects() : rect_utils_1.getClientRectsNoOverlap(range, doNotMergeHorizontallyAlignedRects);
    var highlightAreaSVGDocFrag;
    var roundedCorner = 3;
    var underlineThickness = 2;
    var strikeThroughLineThickness = 3;
    try {
        for (var clientRects_1 = tslib_1.__values(clientRects), clientRects_1_1 = clientRects_1.next(); !clientRects_1_1.done; clientRects_1_1 = clientRects_1.next()) {
            var clientRect = clientRects_1_1.value;
            var opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
            if (useSVG) {
                var borderThickness = 0;
                if (!highlightAreaSVGDocFrag) {
                    highlightAreaSVGDocFrag = documant.createDocumentFragment();
                }
                var highlightAreaSVGRect = documant.createElementNS(SVG_XML_NAMESPACE, "rect");
                highlightAreaSVGRect.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                highlightAreaSVGRect.setAttribute("style", "fill: rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important; fill-opacity: " + opacity + " !important; stroke-width: 0;");
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
                if (drawUnderline) {
                    var highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                    highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaSVGLine.setAttribute("style", "stroke-linecap: round; stroke-width: " + underlineThickness * scale + "; stroke: rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important; stroke-opacity: " + opacity + " !important");
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
                if (drawStrikeThrough) {
                    var highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                    highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaSVGLine.setAttribute("style", "stroke-linecap: butt; stroke-width: " + strikeThroughLineThickness * scale + "; stroke: rgb(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ") !important; stroke-opacity: " + opacity + " !important");
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
                else {
                    if (drawUnderline) {
                        extra += "border-bottom: " + underlineThickness * scale + "px solid rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ") !important";
                    }
                }
                highlightArea.setAttribute("style", "border-radius: " + roundedCorner + "px !important; background-color: rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ") !important; " + extra);
                highlightArea.style.setProperty("pointer-events", "none");
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
                highlightArea.style.left = highlightArea.rect.left * scale + "px";
                highlightArea.style.top = highlightArea.rect.top * scale + "px";
                highlightParent.append(highlightArea);
                if (!win.READIUM2.DEBUG_VISUALS && drawStrikeThrough) {
                    var highlightAreaLine = documant.createElement("div");
                    highlightAreaLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                    highlightAreaLine.setAttribute("style", "background-color: rgba(" + highlight.color.red + ", " + highlight.color.green + ", " + highlight.color.blue + ", " + opacity + ") !important;");
                    highlightAreaLine.style.setProperty("pointer-events", "none");
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
                    highlightAreaLine.style.left = highlightAreaLine.rect.left * scale + "px";
                    highlightAreaLine.style.top = (highlightAreaLine.rect.top + (highlightAreaLine.rect.height / 2) - (strikeThroughLineThickness / 2)) * scale + "px";
                    highlightParent.append(highlightAreaLine);
                }
            }
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (clientRects_1_1 && !clientRects_1_1.done && (_a = clientRects_1.return)) _a.call(clientRects_1);
        }
        finally { if (e_8) throw e_8.error; }
    }
    if (useSVG && highlightAreaSVGDocFrag) {
        var highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightAreaSVG.setAttribute("pointer-events", "none");
        highlightAreaSVG.style.position = paginated ? "fixed" : "absolute";
        highlightAreaSVG.style.overflow = "visible";
        highlightAreaSVG.style.left = "0";
        highlightAreaSVG.style.top = "0";
        highlightAreaSVG.append(highlightAreaSVGDocFrag);
        highlightParent.append(highlightAreaSVG);
    }
    var rangeBoundingClientRect = range.getBoundingClientRect();
    var highlightBounding = documant.createElement("div");
    highlightBounding.setAttribute("class", exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
    if (win.READIUM2.DEBUG_VISUALS) {
        highlightBounding.setAttribute("style", "outline-color: magenta; outline-style: solid; outline-width: 1px; outline-offset: -1px;");
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
    highlightBounding.style.left = highlightBounding.rect.left * scale + "px";
    highlightBounding.style.top = highlightBounding.rect.top * scale + "px";
    highlightParent.append(highlightBounding);
    highlightsContainer.append(highlightParent);
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map