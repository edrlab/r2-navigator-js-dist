"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var sessions_1 = require("../../common/sessions");
var styles_1 = require("./styles");
var win = global.window;
var CSS_CLASS_DARK_THEME = "mdc-theme--dark";
var origin = win.location.origin;
if (origin.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
    origin = sessions_1.convertCustomSchemeToHttpUrl(win.location.href);
    origin = origin.replace(/\/pub\/.*/, "");
}
var urlRootReadiumCSS = origin + "/readium-css/";
console.log(urlRootReadiumCSS);
exports.DEBUG_VISUALS = false;
exports.configureFixedLayout = function (isFixedLayout) {
    if (!win.document || !win.document.head || !win.document.body) {
        return;
    }
    var width = win.READIUM2.fxlViewportWidth;
    var height = win.READIUM2.fxlViewportHeight;
    if (!width || !height) {
        var metaViewport = win.document.head.querySelector("meta[name=viewport]");
        if (!metaViewport) {
            console.log("configureFixedLayout NO meta[name=viewport]");
            return;
        }
        var attr = metaViewport.getAttribute("content");
        if (!attr) {
            console.log("configureFixedLayout NO meta[name=viewport && content]");
            return;
        }
        var wMatch = attr.match(/\s*width\s*=\s*([0-9]+)/);
        if (wMatch && wMatch.length >= 2) {
            try {
                width = parseInt(wMatch[1], 10);
            }
            catch (err) {
                console.log(err);
            }
        }
        else {
            console.log("configureFixedLayout NO meta[name=viewport && content WIDTH]");
        }
        var hMatch = attr.match(/\s*height\s*=\s*([0-9]+)/);
        if (hMatch && hMatch.length >= 2) {
            try {
                height = parseInt(hMatch[1], 10);
            }
            catch (err) {
                console.log(err);
            }
        }
        else {
            console.log("configureFixedLayout NO meta[name=viewport && content HEIGHT]");
        }
        if (width && height) {
            console.log("READIUM_FXL_VIEWPORT_WIDTH: " + width);
            console.log("READIUM_FXL_VIEWPORT_HEIGHT: " + height);
            win.READIUM2.fxlViewportWidth = width;
            win.READIUM2.fxlViewportHeight = height;
        }
    }
    if (width && height && isFixedLayout
        && win.document && win.document.documentElement && win.document.body) {
        win.document.documentElement.style.overflow = "hidden";
        win.document.body.style.width = width + "px";
        win.document.body.style.height = height + "px";
        win.document.body.style.overflow = "hidden";
        win.document.body.style.margin = "0";
        console.log("FXL width: " + width);
        console.log("FXL height: " + height);
        var visibleWidth = win.innerWidth;
        var visibleHeight = win.innerHeight;
        console.log("FXL visible width: " + visibleWidth);
        console.log("FXL visible height: " + visibleHeight);
        var ratioX = visibleWidth / width;
        var ratioY = visibleHeight / height;
        var ratio = Math.min(ratioX, ratioY);
        var tx = (visibleWidth - (width * ratio)) / 2;
        var ty = (visibleHeight - (height * ratio)) / 2;
        console.log("FXL trans X: " + tx);
        console.log("FXL trans Y: " + ty);
        win.document.documentElement.style.transformOrigin = "0 0";
        win.document.documentElement.style.transform = "translateX(" + tx + "px) translateY(" + ty + "px) scale(" + ratio + ")";
    }
};
exports.injectDefaultCSS = function () {
    appendCSSInline("electron-selection", styles_1.selectionCssStyles);
    appendCSSInline("electron-focus", styles_1.focusCssStyles);
    appendCSSInline("electron-target", styles_1.targetCssStyles);
    appendCSSInline("electron-scrollbars", styles_1.scrollBarCssStyles);
};
exports.injectReadPosCSS = function () {
    if (!exports.DEBUG_VISUALS) {
        return;
    }
    appendCSSInline("electron-readPos", styles_1.readPosCssStyles);
};
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
exports.isPaginated = function () {
    return win && win.document && win.document.documentElement &&
        win.document.documentElement.classList.contains("readium-paginated");
};
exports.calculateMaxScrollShift = function () {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return 0;
    }
    var isPaged = exports.isPaginated();
    var maxScrollShift = isPaged ?
        ((isVerticalWritingMode() ?
            (win.document.body.scrollHeight - win.document.documentElement.offsetHeight) :
            (win.document.body.scrollWidth - win.document.documentElement.offsetWidth))) :
        ((isVerticalWritingMode() ?
            (win.document.body.scrollWidth - win.document.documentElement.clientWidth) :
            (win.document.body.scrollHeight - win.document.documentElement.clientHeight)));
    return maxScrollShift;
};
exports.isTwoPageSpread = function () {
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
exports.calculateTotalColumns = function () {
    if (!win || !win.document || !win.document.body || !exports.isPaginated()) {
        return 0;
    }
    var totalColumns = 0;
    if (isVerticalWritingMode()) {
        totalColumns = Math.ceil(win.document.body.offsetWidth / win.document.body.scrollWidth);
    }
    else {
        totalColumns = Math.ceil(win.document.body.offsetHeight / win.document.body.scrollHeight);
    }
    return totalColumns;
};
function calculateColumnDimension() {
    if (!win.document || !win.document.documentElement || !win.document.body || !exports.isPaginated()) {
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
function computeVerticalRTL() {
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var dirAttr = win.document.documentElement.getAttribute("dir");
    if (dirAttr === "rtl") {
        _isRTL = true;
    }
    if (!_isRTL && win.document.body) {
        dirAttr = win.document.body.getAttribute("dir");
        if (dirAttr === "rtl") {
            _isRTL = true;
        }
    }
    var htmlStyle = win.getComputedStyle(win.document.documentElement);
    if (htmlStyle) {
        var prop = htmlStyle.getPropertyValue("writing-mode");
        if (!prop) {
            prop = htmlStyle.getPropertyValue("-epub-writing-mode");
        }
        if (prop && prop.indexOf("vertical") >= 0) {
            _isVerticalWritingMode = true;
        }
        if (prop && prop.indexOf("-rl") > 0) {
            _isRTL = true;
        }
        if (!_isRTL) {
            prop = htmlStyle.getPropertyValue("direction");
            if (prop && prop.indexOf("rtl") >= 0) {
                _isRTL = true;
            }
        }
    }
    if ((!_isVerticalWritingMode || !_isRTL) && win.document.body) {
        var bodyStyle = win.getComputedStyle(win.document.body);
        if (bodyStyle) {
            var prop = void 0;
            if (!_isVerticalWritingMode) {
                prop = bodyStyle.getPropertyValue("writing-mode");
                if (!prop) {
                    prop = bodyStyle.getPropertyValue("-epub-writing-mode");
                }
                if (prop && prop.indexOf("vertical") >= 0) {
                    _isVerticalWritingMode = true;
                }
                if (prop && prop.indexOf("-rl") > 0) {
                    _isRTL = true;
                }
            }
            if (!_isRTL) {
                prop = bodyStyle.getPropertyValue("direction");
                if (prop && prop.indexOf("rtl") >= 0) {
                    _isRTL = true;
                }
            }
        }
    }
    console.log("_isVerticalWritingMode: " + _isVerticalWritingMode);
    console.log("_isRTL: " + _isRTL);
}
win.addEventListener("load", function () {
    computeVerticalRTL();
});
var ensureHead = function () {
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var docElement = win.document.documentElement;
    if (!win.document.head) {
        var headElement = win.document.createElement("head");
        if (win.document.body) {
            docElement.insertBefore(headElement, win.document.body);
        }
        else {
            docElement.appendChild(headElement);
        }
    }
};
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, function (_event, payload) {
    exports.readiumCSS(payload);
});
function readiumCSSSet(messageJson) {
    if (!messageJson) {
        return;
    }
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var docElement = win.document.documentElement;
    if (!messageJson.setCSS) {
        docElement.removeAttribute("data-readiumcss");
        removeAllCSS();
        removeAllCSSInline();
        if (messageJson.isFixedLayout) {
            docElement.style.overflow = "hidden";
        }
        else {
            docElement.style.overflow = "auto";
        }
        var toRemove = [];
        for (var i = 0; i < docElement.style.length; i++) {
            var item = docElement.style.item(i);
            if (item.indexOf("--USER__") === 0) {
                toRemove.push(item);
            }
        }
        toRemove.forEach(function (item) {
            docElement.style.removeProperty(item);
        });
        docElement.classList.remove(CSS_CLASS_DARK_THEME);
        return;
    }
    if (!docElement.hasAttribute("data-readiumcss")) {
        docElement.setAttribute("data-readiumcss", "yes");
        var needsDefaultCSS = true;
        if (win.document.head && win.document.head.childElementCount) {
            var elem = win.document.head.firstElementChild;
            while (elem) {
                if ((elem.localName && elem.localName.toLowerCase() === "style") ||
                    (elem.getAttribute &&
                        (elem.getAttribute("rel") === "stylesheet" ||
                            elem.getAttribute("type") === "text/css" ||
                            (elem.getAttribute("src") &&
                                elem.getAttribute("src").endsWith(".css"))))) {
                    needsDefaultCSS = false;
                    break;
                }
                elem = elem.nextElementSibling;
            }
        }
        if (needsDefaultCSS && win.document.body) {
            var styleAttr = win.document.body.querySelector("*[style]");
            if (styleAttr) {
                needsDefaultCSS = false;
            }
        }
        var urlRoot = messageJson.urlRoot ?
            messageJson.urlRoot + "/readium-css/" :
            urlRootReadiumCSS;
        appendCSS("before", urlRoot);
        if (needsDefaultCSS) {
            appendCSS("default", urlRoot);
        }
        appendCSS("after", urlRoot);
    }
    var setCSS = messageJson.setCSS;
    if (exports.DEBUG_VISUALS) {
        console.log("---- setCSS -----");
        console.log(setCSS);
        console.log("-----");
    }
    if (setCSS.night) {
        docElement.classList.add(CSS_CLASS_DARK_THEME);
    }
    else {
        docElement.classList.remove(CSS_CLASS_DARK_THEME);
    }
    var needsAdvanced = true;
    docElement.style.setProperty("--USER__advancedSettings", needsAdvanced ? "readium-advanced-on" : "readium-advanced-off");
    if (typeof setCSS.darken === "undefined") {
        docElement.style.removeProperty("--USER__darkenFilter");
    }
    else {
        docElement.style.setProperty("--USER__darkenFilter", setCSS.darken ? "readium-darken-on" : "readium-darken-off");
    }
    if (typeof setCSS.invert === "undefined") {
        docElement.style.removeProperty("--USER__invertFilter");
    }
    else {
        docElement.style.setProperty("--USER__invertFilter", setCSS.invert ? "readium-invert-on" : "readium-invert-off");
    }
    docElement.style.setProperty("--USER__appearance", setCSS.sepia ? "readium-sepia-on" :
        (setCSS.night ? "readium-night-on" : "readium-default-on"));
    docElement.style.setProperty("--USER__view", setCSS.paged ? "readium-paged-on" : "readium-scroll-on");
    if (setCSS.paged) {
        docElement.style.overflow = "hidden";
        docElement.classList.add("readium-paginated");
    }
    else {
        docElement.style.overflow = "auto";
        docElement.classList.remove("readium-paginated");
    }
    var defaultPublisherFont = !setCSS.font || setCSS.font === "DEFAULT";
    var a11yNormalize = ((typeof setCSS.a11yNormalize !== "undefined") ?
        (setCSS.a11yNormalize ? "readium-a11y-on" : "readium-a11y-off") :
        "readium-a11y-off");
    var needsFontOverride = a11yNormalize === "readium-a11y-on" || !defaultPublisherFont;
    docElement.style.setProperty("--USER__fontOverride", needsFontOverride ? "readium-font-on" : "readium-font-off");
    if (typeof setCSS.a11yNormalize === "undefined") {
        docElement.style.removeProperty("--USER__a11yNormalize");
    }
    else {
        docElement.style.setProperty("--USER__a11yNormalize", a11yNormalize);
    }
    if (defaultPublisherFont) {
        docElement.style.removeProperty("--USER__fontFamily");
    }
    else {
        var font = setCSS.font;
        var fontValue = "";
        if (font === "DUO" || font === "IA Writer Duospace") {
            fontValue = "IA Writer Duospace";
        }
        else if (font === "DYS" || font === "AccessibleDfa") {
            fontValue = "AccessibleDfa";
        }
        else if (font === "OLD" || font === "oldStyleTf") {
            fontValue = "var(--RS__oldStyleTf)";
        }
        else if (font === "MODERN" || font === "modernTf") {
            fontValue = "var(--RS__modernTf)";
        }
        else if (font === "SANS" || font === "sansTf") {
            fontValue = "var(--RS__sansTf)";
        }
        else if (font === "HUMAN" || font === "humanistTf") {
            fontValue = "var(--RS__humanistTf)";
        }
        else if (font === "MONO" || font === "monospaceTf") {
            fontValue = "var(--RS__monospaceTf)";
        }
        else if (font === "JA" || font === "serif-ja") {
            fontValue = "var(--RS__serif-ja)";
        }
        else if (font === "JA-SANS" || font === "sans-serif-ja") {
            fontValue = "var(--RS__sans-serif-ja)";
        }
        else if (font === "JA-V" || font === "serif-ja-v") {
            fontValue = "var(--RS__serif-ja-v)";
        }
        else if (font === "JA-V-SANS" || font === "sans-serif-ja-v") {
            fontValue = "var(--RS__sans-serif-ja-v)";
        }
        else if (typeof font === "string") {
            fontValue = font;
        }
        if (fontValue) {
            docElement.style.setProperty("--USER__fontFamily", fontValue);
        }
        else {
            docElement.style.removeProperty("--USER__fontFamily");
        }
    }
    if (setCSS.fontSize) {
        docElement.style.setProperty("--USER__fontSize", setCSS.fontSize);
    }
    else {
        docElement.style.removeProperty("--USER__fontSize");
    }
    if (setCSS.lineHeight) {
        docElement.style.setProperty("--USER__lineHeight", setCSS.lineHeight);
    }
    else {
        docElement.style.removeProperty("--USER__lineHeight");
    }
    if (setCSS.typeScale) {
        docElement.style.setProperty("--USER__typeScale", setCSS.typeScale);
    }
    else {
        docElement.style.removeProperty("--USER__typeScale");
    }
    if (setCSS.paraSpacing) {
        docElement.style.setProperty("--USER__paraSpacing", setCSS.paraSpacing);
    }
    else {
        docElement.style.removeProperty("--USER__paraSpacing");
    }
    var isCJK = false;
    if (_isVerticalWritingMode || (_isRTL || isCJK)) {
        docElement.style.removeProperty("--USER__bodyHyphens");
        docElement.style.removeProperty("--USER__wordSpacing");
        docElement.style.removeProperty("--USER__letterSpacing");
        if (_isVerticalWritingMode || isCJK) {
            if (_isVerticalWritingMode) {
                docElement.style.removeProperty("--USER__colCount");
            }
            docElement.style.removeProperty("--USER__paraIndent");
            docElement.style.removeProperty("--USER__textAlign");
        }
        else if (_isRTL) {
            if (setCSS.ligatures) {
                docElement.style.setProperty("--USER__ligatures", setCSS.ligatures);
            }
            else {
                docElement.style.removeProperty("--USER__ligatures");
            }
        }
    }
    else {
        if (setCSS.bodyHyphens) {
            docElement.style.setProperty("--USER__bodyHyphens", setCSS.bodyHyphens);
        }
        else {
            docElement.style.removeProperty("--USER__bodyHyphens");
        }
        if (setCSS.wordSpacing) {
            docElement.style.setProperty("--USER__wordSpacing", setCSS.wordSpacing);
        }
        else {
            docElement.style.removeProperty("--USER__wordSpacing");
        }
        if (setCSS.letterSpacing) {
            docElement.style.setProperty("--USER__letterSpacing", setCSS.letterSpacing);
        }
        else {
            docElement.style.removeProperty("--USER__letterSpacing");
        }
        if (!_isVerticalWritingMode) {
            if (setCSS.colCount) {
                docElement.style.setProperty("--USER__colCount", setCSS.colCount);
            }
            else {
                docElement.style.removeProperty("--USER__colCount");
            }
            if (setCSS.paraIndent) {
                docElement.style.setProperty("--USER__paraIndent", setCSS.paraIndent);
            }
            else {
                docElement.style.removeProperty("--USER__paraIndent");
            }
            if (setCSS.textAlign) {
                docElement.style.setProperty("--USER__textAlign", setCSS.textAlign);
            }
            else {
                docElement.style.removeProperty("--USER__textAlign");
            }
        }
        else if (!_isRTL) {
            docElement.style.removeProperty("--USER__ligatures");
        }
    }
    if (setCSS.pageMargins) {
        docElement.style.setProperty("--USER__pageMargins", setCSS.pageMargins);
    }
    else {
        docElement.style.removeProperty("--USER__pageMargins");
    }
    if (setCSS.backgroundColor) {
        docElement.style.setProperty("--USER__backgroundColor", setCSS.backgroundColor);
    }
    else {
        docElement.style.removeProperty("--USER__backgroundColor");
    }
    if (setCSS.textColor) {
        docElement.style.setProperty("--USER__textColor", setCSS.textColor);
    }
    else {
        docElement.style.removeProperty("--USER__textColor");
    }
}
exports.readiumCSS = function (messageJson) {
    readiumCSSSet(messageJson);
};
function appendCSSInline(id, css) {
    ensureHead();
    if (!win.document || !win.document.head) {
        return;
    }
    var styleElement = win.document.createElement("style");
    styleElement.setAttribute("id", "Readium2-" + id);
    styleElement.setAttribute("type", "text/css");
    styleElement.appendChild(document.createTextNode(css));
    win.document.head.appendChild(styleElement);
}
function appendCSS(mod, urlRoot) {
    ensureHead();
    if (!win.document || !win.document.head) {
        return;
    }
    var linkElement = win.document.createElement("link");
    linkElement.setAttribute("id", "ReadiumCSS-" + mod);
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", urlRoot + "ReadiumCSS-" + mod + ".css");
    if (mod === "before" && win.document.head.childElementCount) {
        win.document.head.insertBefore(linkElement, win.document.head.firstElementChild);
    }
    else {
        win.document.head.appendChild(linkElement);
    }
}
function removeCSS(mod) {
    var linkElement = win.document.getElementById("ReadiumCSS-" + mod);
    if (linkElement && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
    }
}
function removeAllCSSInline() {
}
function removeAllCSS() {
    removeCSS("before");
    removeCSS("after");
    removeCSS("default");
}
//# sourceMappingURL=readium-css.js.map