"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readiumCSS = exports.checkHiddenFootNotes = exports.computeVerticalRTL = exports.isRTL = exports.isVerticalWritingMode = exports.calculateColumnDimension = exports.calculateTotalColumns = exports.isTwoPageSpread = exports.calculateMaxScrollShift = exports.getScrollingElement = void 0;
var readium_css_inject_1 = require("../../common/readium-css-inject");
var styles_1 = require("../../common/styles");
var win = global.window;
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var getScrollingElement = function (documant) {
    if (documant.scrollingElement) {
        return documant.scrollingElement;
    }
    return documant.body;
};
exports.getScrollingElement = getScrollingElement;
var calculateDocumentColumnizedWidthAdjustedForTwoPageSpread = function () {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return 0;
    }
    var scrollElement = exports.getScrollingElement(win.document);
    var w = scrollElement.scrollWidth;
    var noChange = !readium_css_inject_1.isPaginated(win.document) || !exports.isTwoPageSpread() ||
        isVerticalWritingMode();
    if (!noChange) {
        var columnizedDocWidth = w;
        var twoColWidth = win.document.documentElement.offsetWidth;
        var nSpreads = columnizedDocWidth / twoColWidth;
        var nWholeSpread = Math.floor(nSpreads);
        var fractionalSpread = nSpreads - nWholeSpread;
        if (fractionalSpread > 0 && (Math.round(fractionalSpread * 10) / 10) <= 0.5) {
            w = twoColWidth * Math.ceil(nSpreads);
        }
    }
    return w;
};
var calculateMaxScrollShift = function () {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return { maxScrollShift: 0, maxScrollShiftAdjusted: 0 };
    }
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    var scrollElement = exports.getScrollingElement(win.document);
    var maxScrollShift = isPaged ?
        ((isVerticalWritingMode() ?
            (scrollElement.scrollHeight - win.document.documentElement.offsetHeight) :
            (scrollElement.scrollWidth - win.document.documentElement.offsetWidth))) :
        ((isVerticalWritingMode() ?
            (scrollElement.scrollWidth - win.document.documentElement.clientWidth) :
            (scrollElement.scrollHeight - win.document.documentElement.clientHeight)));
    var maxScrollShiftAdjusted = isPaged ?
        ((isVerticalWritingMode() ?
            maxScrollShift :
            (calculateDocumentColumnizedWidthAdjustedForTwoPageSpread() - win.document.documentElement.offsetWidth))) :
        ((isVerticalWritingMode() ?
            maxScrollShift :
            maxScrollShift));
    return { maxScrollShift: maxScrollShift, maxScrollShiftAdjusted: maxScrollShiftAdjusted };
};
exports.calculateMaxScrollShift = calculateMaxScrollShift;
var isTwoPageSpread = function () {
    if (!win || !win.document || !win.document.documentElement) {
        return false;
    }
    var docStyle = win.getComputedStyle(win.document.documentElement);
    var docColumnCount;
    if (docStyle) {
        docColumnCount = parseInt(docStyle.getPropertyValue("column-count"), 10);
    }
    return docColumnCount === 2;
};
exports.isTwoPageSpread = isTwoPageSpread;
var calculateTotalColumns = function () {
    if (!win || !win.document || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return 0;
    }
    var scrollElement = exports.getScrollingElement(win.document);
    var totalColumns = 0;
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
    if (!win.document || !win.document.documentElement || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return 0;
    }
    var isTwoPage = exports.isTwoPageSpread();
    var columnDimension = 0;
    if (isVerticalWritingMode()) {
        columnDimension = win.document.documentElement.offsetHeight;
    }
    else {
        columnDimension = (win.document.documentElement.offsetWidth * (isTwoPage ? 0.5 : 1));
    }
    return columnDimension;
}
exports.calculateColumnDimension = calculateColumnDimension;
var _isVerticalWritingMode = false;
function isVerticalWritingMode() {
    return _isVerticalWritingMode;
}
exports.isVerticalWritingMode = isVerticalWritingMode;
var _isRTL = false;
function isRTL() {
    return _isRTL;
}
exports.isRTL = isRTL;
function computeVerticalRTL() {
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var rtl = readium_css_inject_1.isDocRTL(win.document);
    var vertical = readium_css_inject_1.isDocVertical(win.document);
    var htmlStyle = win.getComputedStyle(win.document.documentElement);
    if (htmlStyle) {
        var prop = htmlStyle.getPropertyValue("writing-mode");
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
        var bodyStyle = win.getComputedStyle(win.document.body);
        if (bodyStyle) {
            var prop = void 0;
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
    var aNodeList = documant.querySelectorAll("a[href]");
    documant.querySelectorAll("aside").forEach(function (aside) {
        var id = aside.getAttribute("id");
        if (!id) {
            return;
        }
        id = "#" + id;
        var epubType = aside.getAttribute("epub:type");
        if (!epubType) {
            epubType = aside.getAttributeNS("http://www.idpf.org/2007/ops", "type");
        }
        if (!epubType) {
            return;
        }
        epubType = epubType.trim().replace(/\s\s+/g, " ");
        var isPotentiallyHiddenNote = epubType.indexOf("footnote") >= 0 ||
            epubType.indexOf("endnote") >= 0 ||
            epubType.indexOf("rearnote") >= 0 ||
            epubType.indexOf("note") >= 0;
        if (!isPotentiallyHiddenNote) {
            return;
        }
        var found = false;
        for (var i = 0; i < aNodeList.length; i++) {
            var aNode = aNodeList[i];
            var href = aNode.getAttribute("href");
            if (!href) {
                continue;
            }
            var iHash = href.indexOf("#");
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
var readiumCSS = function (documant, messageJson) {
    if (IS_DEV) {
        console.log("_____ readiumCssJson.urlRoot (readiumCSS()): ", messageJson.urlRoot);
    }
    readium_css_inject_1.readiumCSSSet(documant, messageJson, _isVerticalWritingMode, _isRTL);
    if ((messageJson && messageJson.setCSS && !messageJson.setCSS.noFootnotes)) {
        checkHiddenFootNotes(documant);
    }
};
exports.readiumCSS = readiumCSS;
//# sourceMappingURL=readium-css.js.map