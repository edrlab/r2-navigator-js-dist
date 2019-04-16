"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readium_css_inject_1 = require("../../common/readium-css-inject");
const readium_css_settings_1 = require("../../common/readium-css-settings");
const sessions_1 = require("../../common/sessions");
const styles_1 = require("../../common/styles");
const win = global.window;
let origin = win.location.origin;
if (origin.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
    origin = sessions_1.convertCustomSchemeToHttpUrl(win.location.href);
    origin = origin.replace(/\/pub\/.*/, "");
}
const urlRootReadiumCSS = origin + "/" + readium_css_settings_1.READIUM_CSS_URL_PATH + "/";
exports.getScrollingElement = (documant) => {
    if (documant.scrollingElement) {
        return documant.scrollingElement;
    }
    return documant.body;
};
const calculateDocumentColumnizedWidthAdjustedForTwoPageSpread = () => {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return 0;
    }
    const scrollElement = exports.getScrollingElement(win.document);
    let w = scrollElement.scrollWidth;
    const noChange = !readium_css_inject_1.isPaginated(win.document) || !exports.isTwoPageSpread() ||
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
exports.calculateMaxScrollShift = () => {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return { maxScrollShift: 0, maxScrollShiftAdjusted: 0 };
    }
    const isPaged = readium_css_inject_1.isPaginated(win.document);
    const scrollElement = exports.getScrollingElement(win.document);
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
exports.isTwoPageSpread = () => {
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
exports.calculateTotalColumns = () => {
    if (!win || !win.document || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return 0;
    }
    const scrollElement = exports.getScrollingElement(win.document);
    let totalColumns = 0;
    if (isVerticalWritingMode()) {
        totalColumns = Math.ceil(win.document.body.offsetWidth / scrollElement.scrollWidth);
    }
    else {
        totalColumns = Math.ceil(win.document.body.offsetHeight / scrollElement.scrollHeight);
    }
    return totalColumns;
};
function calculateColumnDimension() {
    if (!win.document || !win.document.documentElement || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return 0;
    }
    const isTwoPage = exports.isTwoPageSpread();
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
    let rtl = readium_css_inject_1.isDocRTL(win.document);
    let vertical = readium_css_inject_1.isDocVertical(win.document);
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
        }
        if (!epubType) {
            return;
        }
        epubType = epubType.trim().replace(/\s\s+/g, " ");
        const isPotentiallyHiddenNote = epubType.indexOf("footnote") >= 0 ||
            epubType.indexOf("endnote") >= 0 ||
            epubType.indexOf("rearnote") >= 0 ||
            epubType.indexOf("note") >= 0;
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
            if (href.substr(iHash) === id) {
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
exports.readiumCSS = (documant, messageJson) => {
    readium_css_inject_1.readiumCSSSet(documant, messageJson, urlRootReadiumCSS, _isVerticalWritingMode, _isRTL);
    if ((messageJson && messageJson.setCSS && !messageJson.setCSS.noFootnotes)) {
        checkHiddenFootNotes(documant);
    }
};
//# sourceMappingURL=readium-css.js.map