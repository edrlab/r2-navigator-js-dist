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
const core_1 = require("@flatten-js/core");
const { unify } = core_1.BooleanOperations;
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
window.DEBUG_RECTS = IS_DEV && rect_utils_1.VERBOSE;
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
const SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
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
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    let hit = false;
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
        let highlightFragment = highlightParent.firstElementChild;
        while (highlightFragment) {
            if (highlightFragment.namespaceURI === SVG_XML_NAMESPACE) {
                const svg = highlightFragment;
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
    let highlightContainer = _highlightsContainer.firstElementChild;
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
    var _a;
    const DEBUG_RECTS = window.DEBUG_RECTS;
    const documant = win.document;
    const scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    const range = highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : highlight.range;
    if (!range) {
        return null;
    }
    const drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline;
    const drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough;
    const paginated = (0, readium_css_inject_1.isPaginated)(documant);
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
    let clientRects;
    const rangeClientRects = (0, rect_utils_1.DOMRectListToArray)(range.getClientRects());
    if (doNotMergeHorizontallyAlignedRects) {
        const textClientRects = (0, rect_utils_1.getTextClientRects)(range);
        const textReducedClientRects = (0, rect_utils_1.getClientRectsNoOverlap)(textClientRects, true, vertical, highlight.expand ? highlight.expand : 0);
        clientRects = (DEBUG_RECTS && drawStrikeThrough) ? textClientRects : textReducedClientRects;
    }
    else {
        clientRects = (0, rect_utils_1.getClientRectsNoOverlap)(rangeClientRects, false, vertical, highlight.expand ? highlight.expand : 0);
    }
    const underlineThickness = 3;
    const strikeThroughLineThickness = 4;
    const bodyWidth = parseInt(bodyComputedStyle.width, 10);
    const paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    const paginatedWidth = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
    const paginatedOffset = (paginatedWidth - bodyWidth) / 2 + parseInt(bodyComputedStyle.paddingLeft, 10);
    const gap = 2;
    const boxesNoGapExpanded = [];
    const boxesGapExpanded = [];
    for (const clientRect of clientRects) {
        const rect = {
            height: clientRect.height,
            left: clientRect.left - xOffset,
            top: clientRect.top - yOffset,
            width: clientRect.width,
        };
        const w = rect.width * scale;
        const h = rect.height * scale;
        const x = rect.left * scale;
        const y = rect.top * scale;
        boxesGapExpanded.push(new core_1.Box(Number((x - gap).toPrecision(12)), Number((y - gap).toPrecision(12)), Number((x + w + gap).toPrecision(12)), Number((y + h + gap).toPrecision(12))));
        if (drawStrikeThrough) {
            const thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : strikeThroughLineThickness;
            const ww = (vertical ? thickness : rect.width) * scale;
            const hh = (vertical ? rect.height : thickness) * scale;
            const xx = (vertical
                ?
                    (DEBUG_RECTS
                        ?
                            rect.left
                        :
                            (rect.left + (rect.width / 2) - (thickness / 2)))
                :
                    rect.left) * scale;
            const yy = (vertical
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
            const thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : underlineThickness;
            if (drawUnderline) {
                const ww = (vertical ? thickness : rect.width) * scale;
                const hh = (vertical ? rect.height : thickness) * scale;
                const xx = (vertical
                    ?
                        (DEBUG_RECTS
                            ?
                                rect.left
                            :
                                (rect.left - (thickness / 2)))
                    :
                        rect.left) * scale;
                const yy = (vertical
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
    const polygonCountourUnionPoly = boxesGapExpanded.reduce((previous, current) => unify(previous, new core_1.Polygon(current)), new core_1.Polygon());
    Array.from(polygonCountourUnionPoly.faces).forEach((face) => {
        if (face.orientation() !== core_1.ORIENTATION.CCW) {
            if (IS_DEV) {
                console.log("--HIGH WEBVIEW-- removing polygon clockwise face / inner hole (contour))");
            }
            polygonCountourUnionPoly.deleteFace(face);
        }
    });
    let polygonSurface;
    if (doNotMergeHorizontallyAlignedRects) {
        const singleSVGPath = !DEBUG_RECTS;
        if (singleSVGPath) {
            polygonSurface = new core_1.Polygon();
            for (const box of boxesNoGapExpanded) {
                polygonSurface.addFace(box);
            }
        }
        else {
            polygonSurface = [];
            for (const box of boxesNoGapExpanded) {
                const poly = new core_1.Polygon();
                poly.addFace(box);
                polygonSurface.push(poly);
            }
        }
    }
    else {
        polygonSurface = boxesNoGapExpanded.reduce((previous, current) => unify(previous, new core_1.Polygon(current)), new core_1.Polygon());
        Array.from(polygonSurface.faces).forEach((face) => {
            if (face.orientation() !== core_1.ORIENTATION.CCW) {
                if (IS_DEV) {
                    console.log("--HIGH WEBVIEW-- removing polygon clockwise face / inner hole (surface))");
                }
                polygonSurface.deleteFace(face);
            }
        });
    }
    const highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
    highlightAreaSVG.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_COMMON} ${styles_1.CLASS_HIGHLIGHT_CONTOUR}`);
    highlightAreaSVG.polygon = polygonCountourUnionPoly;
    highlightAreaSVG.innerHTML =
        (Array.isArray(polygonSurface)
            ?
                polygonSurface.reduce((prev, cur) => {
                    return prev + cur.svg({
                        fill: DEBUG_RECTS ? "pink" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
                        fillRule: "evenodd",
                        stroke: DEBUG_RECTS ? "magenta" : "transparent",
                        strokeWidth: DEBUG_RECTS ? 1 : 0,
                        fillOpacity: 1,
                        className: undefined,
                    });
                }, "")
            :
                polygonSurface.svg({
                    fill: DEBUG_RECTS ? "yellow" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
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
        const MARGIN_MARKER_THICKNESS = 14 * (win.READIUM2.isFixedLayout ? scale : 1);
        const MARGIN_MARKER_OFFSET = 6 * (win.READIUM2.isFixedLayout ? scale : 1);
        const paginatedOffset_ = paginatedOffset - MARGIN_MARKER_OFFSET - MARGIN_MARKER_THICKNESS;
        let boundingRect;
        const polygonCountourMarginRects = Array.from(polygonCountourUnionPoly.faces).map((face) => {
            const b = face.box;
            const left = vertical ?
                b.xmin :
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
                            Math.floor((b.xmin) / paginatedWidth) * paginatedWidth)
                    :
                        (rtl
                            ?
                                MARGIN_MARKER_OFFSET + bodyRect.width - parseInt(bodyComputedStyle.paddingRight, 10)
                            :
                                win.READIUM2.isFixedLayout
                                    ?
                                        MARGIN_MARKER_OFFSET
                                    :
                                        parseInt(bodyComputedStyle.paddingLeft, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET);
            const top = vertical
                ?
                    parseInt(bodyComputedStyle.paddingTop, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET
                :
                    b.ymin;
            const width = vertical ? b.width : MARGIN_MARKER_THICKNESS;
            const height = vertical ? MARGIN_MARKER_THICKNESS : b.height;
            const extra = 0;
            const r = {
                left: left - (vertical ? extra : 0),
                top: top - (vertical ? 0 : extra),
                right: left + width + (vertical ? extra : 0),
                bottom: top + height + (vertical ? 0 : extra),
                width: width + extra * 2,
                height: height + extra * 2,
            };
            boundingRect = boundingRect ? (0, rect_utils_1.getBoundingRect)(boundingRect, r) : r;
            return r;
        });
        const useFastBoundingRect = true;
        let polygonMarginUnionPoly;
        if (paginated) {
            const tolerance = 1;
            const groups = [];
            for (const r of polygonCountourMarginRects) {
                const group = groups.find((g) => {
                    return !(r.left < (g.x - tolerance) || r.left > (g.x + tolerance));
                });
                if (!group) {
                    groups.push({
                        x: r.left,
                        boxes: [r],
                    });
                }
                else {
                    (_a = group.boxes) === null || _a === void 0 ? void 0 : _a.push(r);
                }
            }
            boundingRect = groups.map((g) => {
                return g.boxes.reduce((prev, cur) => {
                    if (prev === cur) {
                        return cur;
                    }
                    return (0, rect_utils_1.getBoundingRect)(prev, cur);
                }, g.boxes[0]);
            });
            if (boundingRect.length === 1) {
                boundingRect = boundingRect[0];
            }
        }
        if (useFastBoundingRect) {
            if (boundingRect) {
                polygonMarginUnionPoly = new core_1.Polygon();
                if (Array.isArray(boundingRect)) {
                    for (const b of boundingRect) {
                        polygonMarginUnionPoly.addFace(new core_1.Box(b.left, b.top, b.right, b.bottom));
                    }
                }
                else {
                    polygonMarginUnionPoly.addFace(new core_1.Box(boundingRect.left, boundingRect.top, boundingRect.right, boundingRect.bottom));
                }
            }
            else {
                const poly = new core_1.Polygon();
                for (const r of polygonCountourMarginRects) {
                    poly.addFace(new core_1.Box(r.left, r.top, r.right, r.bottom));
                }
                polygonMarginUnionPoly = new core_1.Polygon();
                polygonMarginUnionPoly.addFace(poly.box);
            }
        }
        else {
            polygonMarginUnionPoly = polygonCountourMarginRects.reduce((previous, r) => unify(previous, new core_1.Polygon(new core_1.Box(r.left, r.top, r.right, r.bottom))), new core_1.Polygon());
        }
        const highlightMarginSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightMarginSVG.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_COMMON} ${styles_1.CLASS_HIGHLIGHT_CONTOUR_MARGIN}`);
        highlightMarginSVG.polygon = polygonMarginUnionPoly;
        highlightMarginSVG.innerHTML = polygonMarginUnionPoly.svg({
            fill: `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
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