"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.CLASS_HIGHLIGHT_BOUNDING_AREA = exports.CLASS_HIGHLIGHT_AREA = exports.CLASS_HIGHLIGHT_CONTAINER = exports.ID_HIGHLIGHTS_CONTAINER = void 0;
const crypto = require("crypto");
const debounce_1 = require("debounce");
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const highlight_1 = require("../../common/highlight");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const rect_utils_1 = require("../common/rect-utils");
const readium_css_1 = require("./readium-css");
const selection_1 = require("./selection");
exports.ID_HIGHLIGHTS_CONTAINER = "R2_ID_HIGHLIGHTS_CONTAINER";
exports.CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
exports.CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
exports.CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const USE_SVG = false;
const USE_BLEND_MODE = true;
const DEFAULT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 0.6 : 0.3;
const ALT_BACKGROUND_COLOR_OPACITY = USE_BLEND_MODE ? 0.9 : 0.45;
const ALT_OTHER_BACKGROUND_COLOR_OPACITY = 0.35;
const DEFAULT_BACKGROUND_COLOR = {
    blue: 100,
    green: 50,
    red: 230,
};
const _highlights = [];
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
    highlightBounding.style.outline = "none";
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
    highlightBounding.style.outlineColor = `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, 1)`;
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
    const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    const useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
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
    const useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
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
    const scrollElement = readium_css_1.getScrollingElement(documant);
    const x = ev.clientX;
    const y = ev.clientY;
    const paginated = readium_css_inject_1.isPaginated(documant);
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
    const useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
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
    const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    if (!foundHighlight || !foundElement) {
        let highlightContainer = _highlightsContainer.firstElementChild;
        while (highlightContainer) {
            if (USE_BLEND_MODE) {
                highlightContainer.style.opacity = `${opacity}`;
            }
            if (win.READIUM2.DEBUG_VISUALS) {
                let highlightContainerChild = highlightContainer.firstElementChild;
                while (highlightContainerChild) {
                    if (highlightContainerChild.classList.contains(exports.CLASS_HIGHLIGHT_BOUNDING_AREA)) {
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
    if (foundElement.getAttribute("data-click")) {
        if (isMouseMove) {
            const foundElementHighlightAreas = foundElement.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_AREA}`);
            const foundElementHighlightBounding = foundElement.querySelector(`.${exports.CLASS_HIGHLIGHT_BOUNDING_AREA}`);
            let highlightContainer = _highlightsContainer.firstElementChild;
            while (highlightContainer) {
                if (USE_BLEND_MODE) {
                    if (highlightContainer !== foundElement) {
                        highlightContainer.style.opacity = `${ALT_OTHER_BACKGROUND_COLOR_OPACITY}`;
                    }
                }
                if (win.READIUM2.DEBUG_VISUALS) {
                    let highlightContainerChild = highlightContainer.firstElementChild;
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
                foundElement.style.opacity = `${ALT_BACKGROUND_COLOR_OPACITY}`;
            }
            else {
                setHighlightAreaStyle(win, foundElementHighlightAreas, foundHighlight);
            }
            if (foundElementHighlightBounding && win.READIUM2.DEBUG_VISUALS) {
                setHighlightBoundingStyle(win, foundElementHighlightBounding, foundHighlight);
            }
        }
        else if (ev.type === "mouseup" || ev.type === "click") {
            const payload = {
                highlight: foundHighlight,
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
        documant.body.style.position = "relative";
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
function recreateAllHighlightsRaw(win) {
    const documant = win.document;
    hideAllhighlights(documant);
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const docFrag = documant.createDocumentFragment();
    for (const highlight of _highlights) {
        const div = createHighlightDom(win, highlight, bodyRect);
        if (div) {
            docFrag.append(div);
        }
    }
    const highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
}
exports.recreateAllHighlightsRaw = recreateAllHighlightsRaw;
exports.recreateAllHighlightsDebounced = debounce_1.debounce((win) => {
    recreateAllHighlightsRaw(win);
}, 500);
function recreateAllHighlights(win) {
    hideAllhighlights(win.document);
    exports.recreateAllHighlightsDebounced(win);
}
exports.recreateAllHighlights = recreateAllHighlights;
function createHighlights(win, highDefs, pointerInteraction) {
    const documant = win.document;
    const highlights = [];
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const docFrag = documant.createDocumentFragment();
    for (const highDef of highDefs) {
        if (!highDef.selectionInfo) {
            highlights.push(null);
            continue;
        }
        const [high, div] = createHighlight(win, highDef.selectionInfo, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, bodyRect);
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
function createHighlight(win, selectionInfo, color, pointerInteraction, drawType, expand, bodyRect) {
    const uniqueStr = `${selectionInfo.rangeInfo.startContainerElementCssSelector}${selectionInfo.rangeInfo.startContainerChildTextNodeIndex}${selectionInfo.rangeInfo.startOffset}${selectionInfo.rangeInfo.endContainerElementCssSelector}${selectionInfo.rangeInfo.endContainerChildTextNodeIndex}${selectionInfo.rangeInfo.endOffset}`;
    const checkSum = crypto.createHash("sha1");
    checkSum.update(uniqueStr);
    const shaHex = checkSum.digest("hex");
    const idBase = "R2_HIGHLIGHT_" + shaHex;
    let id = idBase;
    let idIdx = 0;
    while (_highlights.find((h) => h.id === id) ||
        win.document.getElementById(id)) {
        if (IS_DEV) {
            console.log("HIGHLIGHT ID already exists, increment: " + id);
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
    };
    _highlights.push(highlight);
    const div = createHighlightDom(win, highlight, bodyRect);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight, bodyRect) {
    const documant = win.document;
    const scrollElement = readium_css_1.getScrollingElement(documant);
    const range = selection_1.convertRangeInfo(documant, highlight.selectionInfo.rangeInfo);
    if (!range) {
        return null;
    }
    const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
    const paginated = readium_css_inject_1.isPaginated(documant);
    const highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", exports.CLASS_HIGHLIGHT_CONTAINER);
    highlightParent.setAttribute("style", "background-color: transparent !important; position: absolute; width: 1px; height: 1px; top: 0; left: 0; overflow: visible;");
    highlightParent.style.setProperty("pointer-events", "none");
    if (highlight.pointerInteraction) {
        highlightParent.setAttribute("data-click", "1");
    }
    if (USE_BLEND_MODE) {
        highlightParent.style.setProperty("mix-blend-mode", "multiply");
        highlightParent.style.opacity = `${opacity}`;
    }
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const useSVG = !win.READIUM2.DEBUG_VISUALS && USE_SVG;
    const drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline && !win.READIUM2.DEBUG_VISUALS;
    const drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough && !win.READIUM2.DEBUG_VISUALS;
    const doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    const ex = highlight.expand ? highlight.expand : 0;
    const rangeClientRects = range.getClientRects();
    const clientRects = rect_utils_1.getClientRectsNoOverlap_(rangeClientRects, doNotMergeHorizontallyAlignedRects, ex);
    let highlightAreaSVGDocFrag;
    const roundedCorner = 3;
    const underlineThickness = 3;
    const strikeThroughLineThickness = 3;
    const rangeBoundingClientRect = range.getBoundingClientRect();
    const highlightBounding = documant.createElement("div");
    highlightBounding.setAttribute("class", exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
    if (win.READIUM2.DEBUG_VISUALS) {
        highlightBounding.setAttribute("style", `background-color: transparent !important; outline-color: magenta; outline-style: solid; outline-width: 1px; outline-offset: -1px;`);
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
    highlightBounding.style.width = `${highlightBounding.rect.width * scale}px`;
    highlightBounding.style.height = `${highlightBounding.rect.height * scale}px`;
    highlightBounding.style.minWidth = highlightBounding.style.width;
    highlightBounding.style.minHeight = highlightBounding.style.height;
    highlightBounding.style.left = `${highlightBounding.rect.left * scale}px`;
    highlightBounding.style.top = `${highlightBounding.rect.top * scale}px`;
    highlightParent.append(highlightBounding);
    for (const clientRect of clientRects) {
        if (useSVG) {
            const borderThickness = 0;
            if (!highlightAreaSVGDocFrag) {
                highlightAreaSVGDocFrag = documant.createDocumentFragment();
            }
            if (drawUnderline) {
                const highlightAreaSVGLine = documant.createElementNS(SVG_XML_NAMESPACE, "line");
                highlightAreaSVGLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                highlightAreaSVGLine.setAttribute("style", `stroke-linecap: round; stroke-width: ${underlineThickness * scale}; stroke: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` +
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
                highlightAreaSVGLine.setAttribute("style", `stroke-linecap: butt; stroke-width: ${strikeThroughLineThickness * scale}; stroke: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` +
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
                highlightAreaSVGRect.setAttribute("style", `fill: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important; stroke-width: 0;` +
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
                highlightAreaLine.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                highlightAreaLine.setAttribute("style", USE_BLEND_MODE ?
                    `background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` :
                    `background-color: rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important;`);
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
                highlightAreaLine.style.width = `${highlightAreaLine.rect.width * scale}px`;
                highlightAreaLine.style.height = `${strikeThroughLineThickness * scale}px`;
                highlightAreaLine.style.minWidth = highlightAreaLine.style.width;
                highlightAreaLine.style.minHeight = highlightAreaLine.style.height;
                highlightAreaLine.style.left = `${highlightAreaLine.rect.left * scale}px`;
                highlightAreaLine.style.top = `${(highlightAreaLine.rect.top + (highlightAreaLine.rect.height / 2) - (strikeThroughLineThickness / 2)) * scale}px`;
                highlightParent.append(highlightAreaLine);
            }
            else {
                const highlightArea = documant.createElement("div");
                highlightArea.setAttribute("class", exports.CLASS_HIGHLIGHT_AREA);
                let extra = "";
                if (win.READIUM2.DEBUG_VISUALS) {
                    const rgb = Math.round(0xffffff * Math.random());
                    const r = rgb >> 16;
                    const g = rgb >> 8 & 255;
                    const b = rgb & 255;
                    extra = `outline-color: rgb(${r}, ${g}, ${b}); outline-style: solid; outline-width: 1px; outline-offset: -1px;`;
                }
                else if (drawUnderline) {
                    extra = `border-bottom: ${underlineThickness * scale}px solid ` +
                        (USE_BLEND_MODE ?
                            `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important` :
                            `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important`);
                }
                highlightArea.setAttribute("style", "box-sizing: border-box; " +
                    (drawUnderline ?
                        "" :
                        (`border-radius: ${roundedCorner}px !important; background-color: ` +
                            (USE_BLEND_MODE ?
                                `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) !important;` :
                                `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important;`))) + ` ${extra}`);
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
                highlightArea.style.width = `${highlightArea.rect.width * scale}px`;
                highlightArea.style.height = `${highlightArea.rect.height * scale}px`;
                highlightArea.style.minWidth = highlightArea.style.width;
                highlightArea.style.minHeight = highlightArea.style.height;
                highlightArea.style.left = `${highlightArea.rect.left * scale}px`;
                highlightArea.style.top = `${highlightArea.rect.top * scale}px`;
                highlightParent.append(highlightArea);
            }
        }
    }
    if (useSVG && highlightAreaSVGDocFrag) {
        const highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
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