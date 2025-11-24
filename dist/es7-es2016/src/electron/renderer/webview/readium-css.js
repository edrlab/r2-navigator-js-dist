"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readiumCSS = exports.calculateTotalColumns = exports.isTwoPageSpread = exports.calculateMaxScrollShift = exports.getScrollingElement = exports.clearImageZoomOutline = exports.clearImageZoomOutlineDebounced = void 0;
exports.calculateColumnDimension = calculateColumnDimension;
exports.isVerticalWritingMode = isVerticalWritingMode;
exports.isRTL = isRTL;
exports.computeVerticalRTL = computeVerticalRTL;
exports.checkHeightConstrainedTables = checkHeightConstrainedTables;
exports.checkHiddenFootNotes = checkHiddenFootNotes;
const debounce = require("debounce");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const styles_1 = require("../../common/styles");
const styles_2 = require("../../common/styles");
const styles_3 = require("../../common/styles");
const win = global.window;
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
exports.clearImageZoomOutlineDebounced = debounce(() => {
    if (win.document.documentElement.classList.contains(styles_2.R2_MO_CLASS_PAUSED) ||
        win.document.documentElement.classList.contains(styles_2.R2_MO_CLASS_PLAYING) ||
        win.READIUM2.ttsClickEnabled ||
        win.document.documentElement.classList.contains(styles_2.TTS_CLASS_PAUSED) ||
        win.document.documentElement.classList.contains(styles_2.TTS_CLASS_PLAYING)) {
        (0, exports.clearImageZoomOutline)();
    }
}, 200);
const clearImageZoomOutline = () => {
    const imgs = win.document.querySelectorAll(`img[data-${styles_2.POPOUTIMAGE_CONTAINER_ID}]`);
    imgs.forEach((img) => {
        img.removeAttribute(`data-${styles_2.POPOUTIMAGE_CONTAINER_ID}`);
    });
    const images = win.document.querySelectorAll(`image[data-${styles_2.POPOUTIMAGE_CONTAINER_ID}]`);
    images.forEach((img) => {
        img.removeAttribute(`data-${styles_2.POPOUTIMAGE_CONTAINER_ID}`);
    });
    const svgs = win.document.querySelectorAll(`svg[data-${styles_2.POPOUTIMAGE_CONTAINER_ID}]`);
    svgs.forEach((svg) => {
        svg.removeAttribute(`data-${styles_2.POPOUTIMAGE_CONTAINER_ID}`);
    });
};
exports.clearImageZoomOutline = clearImageZoomOutline;
const getScrollingElement = (documant) => {
    if (documant.scrollingElement) {
        return documant.scrollingElement;
    }
    return documant.body;
};
exports.getScrollingElement = getScrollingElement;
const calculateDocumentColumnizedWidthAdjustedForTwoPageSpread = () => {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return 0;
    }
    const scrollElement = (0, exports.getScrollingElement)(win.document);
    let w = scrollElement.scrollWidth;
    const noChange = !(0, readium_css_inject_1.isPaginated)(win.document) || !(0, exports.isTwoPageSpread)() ||
        isVerticalWritingMode();
    if (!noChange) {
        const columnizedDocWidth = w;
        const twoColWidth = scrollElement.offsetWidth;
        const nSpreads = columnizedDocWidth / twoColWidth;
        const nWholeSpread = Math.floor(nSpreads);
        const fractionalSpread = nSpreads - nWholeSpread;
        if (fractionalSpread > 0 && (Math.round(fractionalSpread * 10) / 10) <= 0.5) {
            w = twoColWidth * Math.ceil(nSpreads);
        }
    }
    return w;
};
const calculateMaxScrollShift = () => {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return { maxScrollShift: 0, maxScrollShiftAdjusted: 0 };
    }
    const isPaged = (0, readium_css_inject_1.isPaginated)(win.document);
    const scrollElement = (0, exports.getScrollingElement)(win.document);
    const isVWM = isVerticalWritingMode();
    const maxScrollShift = isPaged ?
        ((isVWM ?
            (scrollElement.scrollHeight - scrollElement.offsetHeight) :
            (scrollElement.scrollWidth - scrollElement.offsetWidth))) :
        ((isVWM ?
            (scrollElement.scrollWidth - scrollElement.clientWidth) :
            (scrollElement.scrollHeight - scrollElement.clientHeight)));
    const maxScrollShiftAdjusted = isPaged ?
        ((isVWM ?
            maxScrollShift :
            (calculateDocumentColumnizedWidthAdjustedForTwoPageSpread() - scrollElement.offsetWidth))) :
        ((isVWM ?
            maxScrollShift :
            maxScrollShift));
    return { maxScrollShift, maxScrollShiftAdjusted };
};
exports.calculateMaxScrollShift = calculateMaxScrollShift;
const isTwoPageSpread = () => {
    if (!win || !win.document || !win.document.documentElement || !win.document.body) {
        return false;
    }
    const docStyle = win.getComputedStyle(win.document.documentElement);
    let docColumnCount;
    if (docStyle) {
        docColumnCount = parseInt(docStyle.getPropertyValue("column-count"), 10);
    }
    const scrollElement = (0, exports.getScrollingElement)(win.document);
    const bodyComputedStyle = win.getComputedStyle(win.document.body);
    const bodyWidth = parseInt(bodyComputedStyle.width, 10);
    let paginatedTwo = docColumnCount === 2;
    if (paginatedTwo && (bodyWidth * 2) > scrollElement.clientWidth) {
        paginatedTwo = false;
    }
    if (docColumnCount && isNaN(docColumnCount)
        && (bodyWidth * 2) <= (scrollElement.clientWidth + 10)) {
        paginatedTwo = true;
    }
    return paginatedTwo;
};
exports.isTwoPageSpread = isTwoPageSpread;
const calculateTotalColumns = () => {
    if (!win || !win.document || !win.document.body || !(0, readium_css_inject_1.isPaginated)(win.document)) {
        return 0;
    }
    const scrollElement = (0, exports.getScrollingElement)(win.document);
    const bodyComputedStyle = win.getComputedStyle(win.document.body);
    const zoomStr = bodyComputedStyle.zoom || "1";
    const zoomFactor = parseFloat(zoomStr);
    let totalColumns = 0;
    if (isVerticalWritingMode()) {
        totalColumns = Math.ceil((win.document.body.scrollWidth * zoomFactor) / scrollElement.scrollWidth);
    }
    else {
        totalColumns = Math.ceil((win.document.body.scrollHeight * zoomFactor) / scrollElement.scrollHeight);
    }
    return totalColumns;
};
exports.calculateTotalColumns = calculateTotalColumns;
function calculateColumnDimension() {
    if (!win.document || !win.document.documentElement || !win.document.body || !(0, readium_css_inject_1.isPaginated)(win.document)) {
        return 0;
    }
    const scrollElement = (0, exports.getScrollingElement)(win.document);
    const isTwoPage = (0, exports.isTwoPageSpread)();
    let columnDimension = 0;
    if (isVerticalWritingMode()) {
        columnDimension = scrollElement.offsetHeight;
    }
    else {
        columnDimension = (scrollElement.offsetWidth * (isTwoPage ? 0.5 : 1));
    }
    return columnDimension;
}
let _isVerticalWritingMode = false;
function isVerticalWritingMode() {
    return _isVerticalWritingMode;
}
let _isRTL = false;
function isRTL() {
    return _isRTL;
}
function computeVerticalRTL() {
    if (!win.document || !win.document.documentElement) {
        return;
    }
    let rtl = (0, readium_css_inject_1.isDocRTL)(win.document);
    let vertical = (0, readium_css_inject_1.isDocVertical)(win.document);
    const htmlStyle = win.getComputedStyle(win.document.documentElement);
    if (htmlStyle) {
        let prop = htmlStyle.getPropertyValue("direction");
        if (prop && prop.indexOf("rtl") >= 0) {
            rtl = true;
        }
        prop = htmlStyle.getPropertyValue("writing-mode");
        if (!prop) {
            prop = htmlStyle.getPropertyValue("-epub-writing-mode");
        }
        if (prop && prop.indexOf("vertical") >= 0) {
            vertical = true;
        }
        if (prop && prop.indexOf("-rl") > 0) {
            rtl = true;
        }
    }
    if (win.document.body) {
        const bodyStyle = win.getComputedStyle(win.document.body);
        if (bodyStyle) {
            let prop = bodyStyle.getPropertyValue("direction");
            if (prop && prop.indexOf("rtl") >= 0) {
                rtl = true;
            }
            prop = bodyStyle.getPropertyValue("writing-mode");
            if (!prop) {
                prop = bodyStyle.getPropertyValue("-epub-writing-mode");
            }
            if (prop && prop.indexOf("vertical") >= 0) {
                vertical = true;
            }
            if (prop && prop.indexOf("-rl") > 0) {
                rtl = true;
            }
        }
        let singleChild;
        let childEl = win.document.body.firstElementChild;
        while (childEl) {
            if (singleChild) {
                singleChild = undefined;
                break;
            }
            const id = childEl.id || childEl.getAttribute("id");
            if (id === styles_3.SKIP_LINK_ID || id === styles_3.ID_HIGHLIGHTS_CONTAINER || id === styles_1.EXTRA_COLUMN_PAD_ID || id === styles_1.POPUP_DIALOG_CLASS) {
                continue;
            }
            singleChild = childEl;
            childEl = childEl.nextElementSibling;
        }
        if (singleChild) {
            const singleChildStyle = win.getComputedStyle(singleChild);
            if (singleChildStyle) {
                let prop = singleChildStyle.getPropertyValue("direction");
                if (prop && prop.indexOf("rtl") >= 0) {
                    rtl = true;
                }
                prop = singleChildStyle.getPropertyValue("writing-mode");
                if (!prop) {
                    prop = singleChildStyle.getPropertyValue("-epub-writing-mode");
                }
                if (prop && prop.indexOf("vertical") >= 0) {
                    vertical = true;
                }
                if (prop && prop.indexOf("-rl") > 0) {
                    rtl = true;
                }
            }
        }
    }
    _isVerticalWritingMode = vertical;
    _isRTL = rtl;
}
let __checkHeightConstrainedTables_DONE = false;
function checkHeightConstrainedTables(documant) {
    if (__checkHeightConstrainedTables_DONE) {
        return;
    }
    __checkHeightConstrainedTables_DONE = true;
    if (!documant.querySelectorAll) {
        return;
    }
    documant.querySelectorAll("table").forEach((table) => {
        var _a;
        let parent = table;
        while (parent) {
            const computedStyle = win.getComputedStyle(parent);
            if (!parent.style.maxHeight && computedStyle.maxHeight && computedStyle.maxHeight !== "none") {
                for (const styleSheet of documant.styleSheets) {
                    for (const cssRule of styleSheet.cssRules) {
                        if (cssRule instanceof CSSStyleRule) {
                            if (((_a = cssRule.style) === null || _a === void 0 ? void 0 : _a.maxHeight) && cssRule.selectorText && !cssRule.selectorText.includes("epub|")) {
                                try {
                                    if (parent.matches(cssRule.selectorText)) {
                                        const maxHeightTrimmed = cssRule.style.maxHeight.trim();
                                        const hasImportant = maxHeightTrimmed.endsWith("!important");
                                        const maxHeight = hasImportant ? maxHeightTrimmed.replace("!important", "").trim() : maxHeightTrimmed;
                                        if (/[0-9]+(\.[0-9]+)?vh/.test(maxHeight)) {
                                            const vhFactor = parseFloat(maxHeight.replace("vh", ""));
                                            cssRule.style.maxHeight = `calc(${vhFactor}vh / var(--USER__fontXSizeX, 1.0))${hasImportant ? " !important" : ""}`;
                                            return;
                                        }
                                    }
                                }
                                catch (e) {
                                    console.log(e);
                                }
                            }
                        }
                    }
                }
            }
            parent = parent.parentElement;
        }
    });
}
function checkHiddenFootNotes(documant) {
    if (documant.documentElement.classList.contains(styles_1.ROOT_CLASS_NO_FOOTNOTES)) {
        return;
    }
    if (!documant.querySelectorAll) {
        return;
    }
    const aNodeList = documant.querySelectorAll("a[href]");
    documant.querySelectorAll("aside").forEach((aside) => {
        let id = aside.getAttribute("id");
        if (!id) {
            return;
        }
        id = "#" + id;
        let epubType = aside.getAttribute("epub:type");
        if (!epubType) {
            epubType = aside.getAttributeNS("http://www.idpf.org/2007/ops", "type");
            if (!epubType) {
                epubType = aside.getAttribute("role");
            }
        }
        if (!epubType) {
            return;
        }
        epubType = epubType.trim().replace(/\s\s+/g, " ");
        const isPotentiallyHiddenNote = epubType.indexOf("note") >= 0;
        if (!isPotentiallyHiddenNote) {
            return;
        }
        let found = false;
        for (let i = 0; i < aNodeList.length; i++) {
            const aNode = aNodeList[i];
            const href = aNode.getAttribute("href");
            if (!href) {
                continue;
            }
            const iHash = href.indexOf("#");
            if (iHash < 0) {
                continue;
            }
            if (href.substring(iHash) === id) {
                found = true;
                break;
            }
        }
        if (!found) {
            aside.classList.add(styles_1.FOOTNOTE_FORCE_SHOW);
        }
    });
}
const readiumCSS = (documant, messageJson) => {
    if (IS_DEV) {
        console.log("_____ readiumCssJson.urlRoot (readiumCSS()): ", messageJson.urlRoot);
    }
    (0, readium_css_inject_1.readiumCSSSet)(documant, messageJson, _isVerticalWritingMode, _isRTL);
    if (messageJson && messageJson.setCSS && !messageJson.setCSS.noFootnotes) {
        checkHiddenFootNotes(documant);
    }
};
exports.readiumCSS = readiumCSS;
//# sourceMappingURL=readium-css.js.map