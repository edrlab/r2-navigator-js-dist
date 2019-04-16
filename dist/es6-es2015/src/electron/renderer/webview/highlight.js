"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debounce_1 = require("debounce");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const rect_utils_1 = require("../common/rect-utils");
const readium_css_1 = require("./readium-css");
const selection_1 = require("./selection");
exports.ID_HIGHLIGHTS_CONTAINER = "R2_ID_HIGHLIGHTS_CONTAINER";
exports.CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
exports.CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
exports.CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
const DEFAULT_BACKGROUND_COLOR_OPACITY = 0.1;
const ALT_BACKGROUND_COLOR_OPACITY = 0.4;
const DEFAULT_BACKGROUND_COLOR = {
    blue: 100,
    green: 50,
    red: 230,
};
const _highlights = [];
function resetHighlightBoundingStyle(_win, highlightBounding) {
    highlightBounding.style.outline = "none";
    highlightBounding.style.setProperty("background-color", "transparent", "important");
}
function setHighlightBoundingStyle(_win, highlightBounding, highlight) {
    const opacity = ALT_BACKGROUND_COLOR_OPACITY;
    highlightBounding.style.setProperty("background-color", `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`, "important");
    highlightBounding.style.outlineColor = `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, 1)`;
    highlightBounding.style.outlineStyle = "solid";
    highlightBounding.style.outlineWidth = "1px";
    highlightBounding.style.outlineOffset = "0px";
}
function resetHighlightAreaStyle(_win, highlightArea) {
    const id = (highlightArea.parentNode && highlightArea.parentNode.nodeType === Node.ELEMENT_NODE && highlightArea.parentNode.getAttribute) ?
        highlightArea.parentNode.getAttribute("id") : undefined;
    if (id) {
        const highlight = _highlights.find((h) => {
            return h.id === id;
        });
        if (highlight) {
            const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
            highlightArea.style.setProperty("background-color", `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`, "important");
        }
    }
}
function setHighlightAreaStyle(_win, highlightAreas, highlight) {
    for (const highlightArea of highlightAreas) {
        const opacity = ALT_BACKGROUND_COLOR_OPACITY;
        highlightArea.style.setProperty("background-color", `rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity})`, "important");
    }
}
function processMouseEvent(win, ev) {
    const documant = win.document;
    const scrollElement = readium_css_1.getScrollingElement(documant);
    const x = ev.clientX;
    const y = ev.clientY;
    if (!_highlightsContainer) {
        return;
    }
    const paginated = readium_css_inject_1.isPaginated(documant);
    const bodyRect = documant.body.getBoundingClientRect();
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
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
        const highlightFragments = highlightParent.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_AREA}`);
        for (const highlightFragment of highlightFragments) {
            const withRect = highlightFragment;
            const left = withRect.rect.left + xOffset;
            const top = withRect.rect.top + yOffset;
            if (x >= left &&
                x < (left + withRect.rect.width) &&
                y >= top &&
                y < (top + withRect.rect.height)) {
                hit = true;
                break;
            }
        }
        if (hit) {
            foundHighlight = highlight;
            foundElement = highlightParent;
            break;
        }
    }
    if (!foundHighlight || !foundElement) {
        const highlightBoundings = _highlightsContainer.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_BOUNDING_AREA}`);
        for (const highlightBounding of highlightBoundings) {
            resetHighlightBoundingStyle(win, highlightBounding);
        }
        const allHighlightAreas = Array.from(_highlightsContainer.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_AREA}`));
        for (const highlightArea of allHighlightAreas) {
            resetHighlightAreaStyle(win, highlightArea);
        }
        return;
    }
    if (foundElement.getAttribute("data-click")) {
        if (ev.type === "mousemove") {
            const foundElementHighlightAreas = Array.from(foundElement.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_AREA}`));
            const allHighlightAreas = _highlightsContainer.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_AREA}`);
            for (const highlightArea of allHighlightAreas) {
                if (foundElementHighlightAreas.indexOf(highlightArea) < 0) {
                    resetHighlightAreaStyle(win, highlightArea);
                }
            }
            setHighlightAreaStyle(win, foundElementHighlightAreas, foundHighlight);
            const foundElementHighlightBounding = foundElement.querySelector(`.${exports.CLASS_HIGHLIGHT_BOUNDING_AREA}`);
            const allHighlightBoundings = _highlightsContainer.querySelectorAll(`.${exports.CLASS_HIGHLIGHT_BOUNDING_AREA}`);
            for (const highlightBounding of allHighlightBoundings) {
                if (!foundElementHighlightBounding || highlightBounding !== foundElementHighlightBounding) {
                    resetHighlightBoundingStyle(win, highlightBounding);
                }
            }
            if (foundElementHighlightBounding) {
                if (win.READIUM2.DEBUG_VISUALS) {
                    setHighlightBoundingStyle(win, foundElementHighlightBounding, foundHighlight);
                }
            }
        }
        else if (ev.type === "click") {
            console.log("HIGHLIGHT CLICK: " + foundHighlight.id);
            console.log(JSON.stringify(foundHighlight, null, "  "));
        }
    }
}
let bodyEventListenersSet = false;
let _highlightsContainer;
function ensureHighlightsContainer(win) {
    const documant = win.document;
    if (!_highlightsContainer) {
        if (!bodyEventListenersSet) {
            bodyEventListenersSet = true;
            documant.body.addEventListener("click", (ev) => {
                processMouseEvent(win, ev);
            }, false);
            documant.body.addEventListener("mousemove", (ev) => {
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
    hideAllhighlights(win.document);
    for (const highlight of _highlights) {
        createHighlightDom(win, highlight);
    }
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
function createHighlight(win, selectionInfo, color, pointerInteraction) {
    const unique = new Buffer(`${selectionInfo.rangeInfo.cfi}${selectionInfo.rangeInfo.startContainerElementCssSelector}${selectionInfo.rangeInfo.startContainerChildTextNodeIndex}${selectionInfo.rangeInfo.startOffset}${selectionInfo.rangeInfo.endContainerElementCssSelector}${selectionInfo.rangeInfo.endContainerChildTextNodeIndex}${selectionInfo.rangeInfo.endOffset}`).toString("base64");
    const id = "R2_HIGHLIGHT_" + unique.replace(/\+/, "_").replace(/=/, "-").replace(/\//, ".");
    destroyHighlight(win.document, id);
    const highlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        id,
        pointerInteraction,
        selectionInfo,
    };
    _highlights.push(highlight);
    createHighlightDom(win, highlight);
    return id;
}
exports.createHighlight = createHighlight;
function createHighlightDom(win, highlight) {
    const documant = win.document;
    const scrollElement = readium_css_1.getScrollingElement(documant);
    const range = selection_1.convertRangeInfo(documant, highlight.selectionInfo.rangeInfo);
    if (!range) {
        return undefined;
    }
    const paginated = readium_css_inject_1.isPaginated(documant);
    const highlightsContainer = ensureHighlightsContainer(win);
    const highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", exports.CLASS_HIGHLIGHT_CONTAINER);
    highlightParent.style.setProperty("pointer-events", "none");
    if (highlight.pointerInteraction) {
        highlightParent.setAttribute("data-click", "1");
    }
    documant.body.style.position = "relative";
    const bodyRect = documant.body.getBoundingClientRect();
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const clientRects = win.READIUM2.DEBUG_VISUALS ? range.getClientRects() : rect_utils_1.getClientRectsNoOverlap(range);
    for (const clientRect of clientRects) {
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
        const opacity = DEFAULT_BACKGROUND_COLOR_OPACITY;
        highlightArea.setAttribute("style", `background-color: rgba(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}, ${opacity}) !important; ${extra}`);
        highlightArea.style.setProperty("pointer-events", "none");
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
        highlightArea.style.left = `${highlightArea.rect.left * scale}px`;
        highlightArea.style.top = `${highlightArea.rect.top * scale}px`;
        highlightParent.append(highlightArea);
    }
    const rangeBoundingClientRect = range.getBoundingClientRect();
    const highlightBounding = documant.createElement("div");
    highlightBounding.setAttribute("class", exports.CLASS_HIGHLIGHT_BOUNDING_AREA);
    if (win.READIUM2.DEBUG_VISUALS) {
        highlightBounding.setAttribute("style", `outline-color: magenta; outline-style: solid; outline-width: 1px; outline-offset: -1px;`);
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
    highlightBounding.style.left = `${highlightBounding.rect.left * scale}px`;
    highlightBounding.style.top = `${highlightBounding.rect.top * scale}px`;
    highlightParent.append(highlightBounding);
    highlightsContainer.append(highlightParent);
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map