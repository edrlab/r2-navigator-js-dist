"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const readium_css_settings_1 = require("../../common/readium-css-settings");
const sessions_1 = require("../../common/sessions");
const win = global.window;
let origin = win.location.origin;
if (origin.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
    origin = sessions_1.convertCustomSchemeToHttpUrl(win.location.href);
    origin = origin.replace(/\/pub\/.*/, "");
}
const urlRootReadiumCSS = origin + "/" + readium_css_settings_1.READIUM_CSS_URL_PATH + "/";
exports.calculateMaxScrollShift = () => {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return 0;
    }
    const isPaged = readium_css_inject_1.isPaginated(win.document);
    const maxScrollShift = isPaged ?
        ((isVerticalWritingMode() ?
            (win.document.body.scrollHeight - win.document.documentElement.offsetHeight) :
            (win.document.body.scrollWidth - win.document.documentElement.offsetWidth))) :
        ((isVerticalWritingMode() ?
            (win.document.body.scrollWidth - win.document.documentElement.clientWidth) :
            (win.document.body.scrollHeight - win.document.documentElement.clientHeight)));
    return maxScrollShift;
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
    let totalColumns = 0;
    if (isVerticalWritingMode()) {
        totalColumns = Math.ceil(win.document.body.offsetWidth / win.document.body.scrollWidth);
    }
    else {
        totalColumns = Math.ceil(win.document.body.offsetHeight / win.document.body.scrollHeight);
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
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, (_event, payload) => {
    exports.readiumCSS(win.document, payload);
});
exports.readiumCSS = (documant, messageJson) => {
    console.log("urlRootReadiumCSS: ", urlRootReadiumCSS);
    console.log("messageJson.urlRoot: ", messageJson.urlRoot);
    readium_css_inject_1.readiumCSSSet(documant, messageJson, urlRootReadiumCSS, _isVerticalWritingMode, _isRTL);
};
//# sourceMappingURL=readium-css.js.map