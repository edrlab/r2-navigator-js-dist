"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readiumCSS = exports.checkHiddenFootNotes = exports.computeVerticalRTL = exports.isRTL = exports.isVerticalWritingMode = exports.calculateColumnDimension = exports.calculateTotalColumns = exports.isTwoPageSpread = exports.calculateMaxScrollShift = exports.getScrollingElement = exports.clearImageZoomOutline = exports.clearImageZoomOutlineDebounced = void 0;
const debounce_1 = require("debounce");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const styles_1 = require("../../common/styles");
const styles_2 = require("../../common/styles");
const win = global.window;
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
exports.clearImageZoomOutlineDebounced = (0, debounce_1.debounce)(() => {
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
        const twoColWidth = win.document.documentElement.offsetWidth;
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
    const maxScrollShift = isPaged ?
        ((isVerticalWritingMode() ?
            (scrollElement.scrollHeight - win.document.documentElement.offsetHeight) :
            (scrollElement.scrollWidth - win.document.documentElement.offsetWidth))) :
        ((isVerticalWritingMode() ?
            (scrollElement.scrollWidth - win.document.documentElement.clientWidth) :
            (scrollElement.scrollHeight - win.document.documentElement.clientHeight)));
    const maxScrollShiftAdjusted = isPaged ?
        ((isVerticalWritingMode() ?
            maxScrollShift :
            (calculateDocumentColumnizedWidthAdjustedForTwoPageSpread() - win.document.documentElement.offsetWidth))) :
        ((isVerticalWritingMode() ?
            maxScrollShift :
            maxScrollShift));
    return { maxScrollShift, maxScrollShiftAdjusted };
};
exports.calculateMaxScrollShift = calculateMaxScrollShift;
const isTwoPageSpread = () => {
    if (!win || !win.document || !win.document.documentElement) {
        return false;
    }
    const docStyle = win.getComputedStyle(win.document.documentElement);
    let docColumnCount;
    if (docStyle) {
        docColumnCount = parseInt(docStyle.getPropertyValue("column-count"), 10);
    }
    return docColumnCount === 2;
};
exports.isTwoPageSpread = isTwoPageSpread;
const calculateTotalColumns = () => {
    if (!win || !win.document || !win.document.body || !(0, readium_css_inject_1.isPaginated)(win.document)) {
        return 0;
    }
    const scrollElement = (0, exports.getScrollingElement)(win.document);
    let totalColumns = 0;
    if (isVerticalWritingMode()) {
        totalColumns = Math.ceil(win.document.body.offsetWidth / scrollElement.scrollWidth);
    }
    else {
        totalColumns = Math.ceil(win.document.body.offsetHeight / scrollElement.scrollHeight);
    }
    return totalColumns;
};
exports.calculateTotalColumns = calculateTotalColumns;
function calculateColumnDimension() {
    if (!win.document || !win.document.documentElement || !win.document.body || !(0, readium_css_inject_1.isPaginated)(win.document)) {
        return 0;
    }
    const isTwoPage = (0, exports.isTwoPageSpread)();
    let columnDimension = 0;
    if (isVerticalWritingMode()) {
        columnDimension = win.document.documentElement.offsetHeight;
    }
    else {
        columnDimension = (win.document.documentElement.offsetWidth * (isTwoPage ? 0.5 : 1));
    }
    return columnDimension;
}
exports.calculateColumnDimension = calculateColumnDimension;
let _isVerticalWritingMode = false;
function isVerticalWritingMode() {
    return _isVerticalWritingMode;
}
exports.isVerticalWritingMode = isVerticalWritingMode;
let _isRTL = false;
function isRTL() {
    return _isRTL;
}
exports.isRTL = isRTL;
function computeVerticalRTL() {
    if (!win.document || !win.document.documentElement) {
        return;
    }
    let rtl = (0, readium_css_inject_1.isDocRTL)(win.document);
    let vertical = (0, readium_css_inject_1.isDocVertical)(win.document);
    const htmlStyle = win.getComputedStyle(win.document.documentElement);
    if (htmlStyle) {
        let prop = htmlStyle.getPropertyValue("writing-mode");
        if (!prop) {
            prop = htmlStyle.getPropertyValue("-epub-writing-mode");
        }
        if (prop && prop.indexOf("vertical") >= 0) {
            vertical = true;
        }
        if (prop && prop.indexOf("-rl") > 0) {
            rtl = true;
        }
        if (!rtl) {
            prop = htmlStyle.getPropertyValue("direction");
            if (prop && prop.indexOf("rtl") >= 0) {
                rtl = true;
            }
        }
    }
    if ((!vertical || !rtl) && win.document.body) {
        const bodyStyle = win.getComputedStyle(win.document.body);
        if (bodyStyle) {
            let prop;
            if (!vertical) {
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
            if (!rtl) {
                prop = bodyStyle.getPropertyValue("direction");
                if (prop && prop.indexOf("rtl") >= 0) {
                    rtl = true;
                }
            }
        }
    }
    _isVerticalWritingMode = vertical;
    _isRTL = rtl;
}
exports.computeVerticalRTL = computeVerticalRTL;
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
exports.checkHiddenFootNotes = checkHiddenFootNotes;
const readiumCSS = (documant, messageJson) => {
    if (IS_DEV) {
        console.log("_____ readiumCssJson.urlRoot (readiumCSS()): ", messageJson.urlRoot);
    }
    (0, readium_css_inject_1.readiumCSSSet)(documant, messageJson, _isVerticalWritingMode, _isRTL);
    if ((messageJson && messageJson.setCSS && !messageJson.setCSS.noFootnotes)) {
        checkHiddenFootNotes(documant);
    }
};
exports.readiumCSS = readiumCSS;
//# sourceMappingURL=readium-css.js.map