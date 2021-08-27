"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readiumCssTransformHtml = exports.injectReadPosCSS = exports.injectDefaultCSS = exports.removeAllCSS = exports.removeCSS = exports.appendCSS = exports.appendCSSInline = exports.ensureHead = exports.configureFixedLayout = exports.readiumCSSSet = exports.isPaginated = exports.isDocRTL = exports.isDocVertical = exports.READIUM2_BASEURL_ID = void 0;
var debug_ = require("debug");
var dom_1 = require("./dom");
var readium_css_settings_1 = require("./readium-css-settings");
var sessions_1 = require("./sessions");
var styles_1 = require("./styles");
exports.READIUM2_BASEURL_ID = "r2_BASEURL_ID";
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var debug = debug_("r2:navigator#electron/common/readium-css-inject");
function isDEBUG_VISUALS(documant) {
    if (!IS_DEV) {
        return false;
    }
    if (documant.defaultView && documant.defaultView.READIUM2 &&
        documant.defaultView.READIUM2.DEBUG_VISUALS) {
        return true;
    }
    return false;
}
function isDocVertical(documant) {
    if (!documant || !documant.documentElement) {
        return false;
    }
    return false;
}
exports.isDocVertical = isDocVertical;
function isDocRTL(documant) {
    if (!documant || !documant.documentElement) {
        return false;
    }
    var rtl = false;
    var foundDir = false;
    var dirAttr = documant.documentElement.getAttribute("dir");
    if (dirAttr === "rtl") {
        foundDir = true;
        rtl = true;
    }
    if (!rtl && documant.body) {
        dirAttr = documant.body.getAttribute("dir");
        if (dirAttr === "rtl") {
            foundDir = true;
            rtl = true;
        }
    }
    if (!rtl) {
        var langAttr = documant.documentElement.getAttribute("lang");
        if (!langAttr) {
            langAttr = documant.documentElement.getAttribute("xml:lang");
        }
        if (!langAttr) {
            langAttr = documant.documentElement.getAttributeNS("http://www.w3.org/XML/1998/", "lang");
        }
        if (langAttr &&
            (langAttr === "ar" || langAttr.startsWith("ar-") ||
                langAttr === "he" || langAttr.startsWith("he-") ||
                langAttr === "fa" || langAttr.startsWith("fa-")) ||
            langAttr === "zh-Hant" ||
            langAttr === "zh-TW") {
            rtl = true;
        }
    }
    if (rtl) {
        if (!foundDir) {
            documant.documentElement.setAttribute("dir", "rtl");
        }
    }
    return rtl;
}
exports.isDocRTL = isDocRTL;
function isPaginated(documant) {
    return documant && documant.documentElement &&
        documant.documentElement.classList.contains(styles_1.CLASS_PAGINATED);
}
exports.isPaginated = isPaginated;
function readiumCSSSet(documant, messageJson, isVerticalWritingMode, isRTL) {
    if (!messageJson) {
        return;
    }
    if (!documant || !documant.documentElement) {
        return;
    }
    if (!messageJson.urlRoot) {
        var baseEl = documant.getElementById(exports.READIUM2_BASEURL_ID);
        if (baseEl) {
            var baseUrl = baseEl.getAttribute("href");
            if (baseUrl) {
                var u = baseUrl;
                if (baseUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
                    u = (0, sessions_1.convertCustomSchemeToHttpUrl)(baseUrl);
                }
                u = u.replace(/\/pub\/.*/, "");
                messageJson.urlRoot = u;
            }
        }
    }
    if (IS_DEV) {
        debug("_____ readiumCssJson.urlRoot (readiumCSSSet()): ", messageJson.urlRoot);
    }
    var docElement = documant.documentElement;
    if (messageJson.isFixedLayout) {
        docElement.classList.add(styles_1.ROOT_CLASS_FIXED_LAYOUT);
        return;
    }
    var setCSS = messageJson.setCSS;
    if (!setCSS) {
        docElement.classList.remove(styles_1.ROOT_CLASS_NO_FOOTNOTES);
        docElement.removeAttribute("data-readiumcss");
        removeAllCSS(documant);
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
        return;
    }
    if (!docElement.hasAttribute("data-readiumcss")) {
        docElement.setAttribute("data-readiumcss", "yes");
        var needsDefaultCSS = true;
        if (documant.head && documant.head.childNodes && documant.head.childNodes.length) {
            for (var i = 0; i < documant.head.childNodes.length; i++) {
                var child = documant.head.childNodes[i];
                if (child.nodeType === 1) {
                    var element = child;
                    if ((element.localName && element.localName.toLowerCase() === "style") ||
                        (element.getAttribute &&
                            (element.getAttribute("rel") === "stylesheet" ||
                                element.getAttribute("type") === "text/css" ||
                                (element.getAttribute("src") &&
                                    element.getAttribute("src").endsWith(".css"))))) {
                        needsDefaultCSS = false;
                        break;
                    }
                }
            }
        }
        if (needsDefaultCSS && documant.body) {
            var styleAttr = documant.body.getAttribute("style");
            if (styleAttr) {
                needsDefaultCSS = false;
            }
        }
        var urlRoot = messageJson.urlRoot + "/" + readium_css_settings_1.READIUM_CSS_URL_PATH + "/";
        appendCSS(documant, "before", urlRoot);
        if (needsDefaultCSS) {
            appendCSS(documant, "default", urlRoot);
        }
        appendCSS(documant, "after", urlRoot);
    }
    if (isDEBUG_VISUALS(documant)) {
        debug("---- setCSS -----");
        debug(setCSS);
        debug("-----");
    }
    if (setCSS.noFootnotes) {
        docElement.classList.add(styles_1.ROOT_CLASS_NO_FOOTNOTES);
    }
    else {
        docElement.classList.remove(styles_1.ROOT_CLASS_NO_FOOTNOTES);
    }
    if (setCSS.mathJax) {
        docElement.classList.add(styles_1.ROOT_CLASS_MATHJAX);
    }
    else {
        docElement.classList.remove(styles_1.ROOT_CLASS_MATHJAX);
    }
    if (setCSS.reduceMotion) {
        docElement.classList.add(styles_1.ROOT_CLASS_REDUCE_MOTION);
    }
    else {
        docElement.classList.remove(styles_1.ROOT_CLASS_REDUCE_MOTION);
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
        docElement.classList.add(styles_1.CLASS_PAGINATED);
    }
    else {
        docElement.style.overflow = "auto";
        docElement.classList.remove(styles_1.CLASS_PAGINATED);
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
    if (setCSS.fontSize && setCSS.fontSize.trim() !== "0" && setCSS.fontSize.trim() !== "100%") {
        docElement.style.setProperty("--USER__fontSize", setCSS.fontSize);
    }
    else {
        docElement.style.removeProperty("--USER__fontSize");
    }
    if (setCSS.lineHeight && setCSS.lineHeight.trim() !== "0") {
        docElement.style.setProperty("--USER__lineHeight", setCSS.lineHeight);
    }
    else {
        docElement.style.removeProperty("--USER__lineHeight");
    }
    if (setCSS.typeScale && setCSS.typeScale.trim() !== "0") {
        docElement.style.setProperty("--USER__typeScale", setCSS.typeScale);
    }
    else {
        docElement.style.removeProperty("--USER__typeScale");
    }
    if (setCSS.paraSpacing && setCSS.paraSpacing.trim() !== "0") {
        docElement.style.setProperty("--USER__paraSpacing", setCSS.paraSpacing);
    }
    else {
        docElement.style.removeProperty("--USER__paraSpacing");
    }
    var isCJK = false;
    if (isVerticalWritingMode || (isRTL || isCJK)) {
        docElement.style.removeProperty("--USER__bodyHyphens");
        docElement.style.removeProperty("--USER__wordSpacing");
        docElement.style.removeProperty("--USER__letterSpacing");
        if (isVerticalWritingMode || isCJK) {
            if (isVerticalWritingMode) {
                docElement.style.removeProperty("--USER__colCount");
            }
            docElement.style.removeProperty("--USER__paraIndent");
            docElement.style.removeProperty("--USER__textAlign");
        }
        else if (isRTL) {
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
        if (setCSS.wordSpacing && setCSS.wordSpacing.trim() !== "0") {
            docElement.style.setProperty("--USER__wordSpacing", setCSS.wordSpacing);
        }
        else {
            docElement.style.removeProperty("--USER__wordSpacing");
        }
        if (setCSS.letterSpacing && setCSS.letterSpacing.trim() !== "0") {
            docElement.style.setProperty("--USER__letterSpacing", setCSS.letterSpacing);
        }
        else {
            docElement.style.removeProperty("--USER__letterSpacing");
        }
    }
    if (!isVerticalWritingMode) {
        if (setCSS.colCount) {
            docElement.style.setProperty("--USER__colCount", setCSS.colCount);
        }
        else {
            docElement.style.removeProperty("--USER__colCount");
        }
        if (setCSS.paraIndent && setCSS.paraIndent.trim() !== "0") {
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
    else if (!isRTL) {
        docElement.style.removeProperty("--USER__ligatures");
    }
    if (setCSS.pageMargins && setCSS.pageMargins.trim() !== "0") {
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
exports.readiumCSSSet = readiumCSSSet;
function configureFixedLayout(documant, isFixedLayout, fxlViewportWidth, fxlViewportHeight, innerWidth, innerHeight, wvSlot) {
    if (!documant || !documant.head || !documant.body) {
        return undefined;
    }
    var wh;
    var width = fxlViewportWidth;
    var height = fxlViewportHeight;
    if (!width || !height) {
        var metaViewport = null;
        if (documant.head.querySelector) {
            metaViewport = documant.head.querySelector("meta[name=viewport]");
        }
        else {
            if (documant.head.childNodes && documant.head.childNodes.length) {
                for (var i = 0; i < documant.head.childNodes.length; i++) {
                    var child = documant.head.childNodes[i];
                    if (child.nodeType === 1) {
                        var element = child;
                        if (element.localName && element.localName.toLowerCase() === "meta") {
                            if (element.getAttribute("name") === "viewport") {
                                metaViewport = element;
                                break;
                            }
                        }
                    }
                }
            }
        }
        if (!metaViewport) {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport]");
            }
            return undefined;
        }
        var attr = metaViewport.getAttribute("content");
        if (!attr) {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport && content]");
            }
            return undefined;
        }
        var wMatch = attr.match(/\s*width\s*=\s*([0-9]+)/);
        if (wMatch && wMatch.length >= 2) {
            try {
                width = parseInt(wMatch[1], 10);
            }
            catch (err) {
                debug(err);
            }
        }
        else {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport && content WIDTH]");
            }
        }
        var hMatch = attr.match(/\s*height\s*=\s*([0-9]+)/);
        if (hMatch && hMatch.length >= 2) {
            try {
                height = parseInt(hMatch[1], 10);
            }
            catch (err) {
                debug(err);
            }
        }
        else {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport && content HEIGHT]");
            }
        }
        if (width && height) {
            if (isDEBUG_VISUALS(documant)) {
                debug("READIUM_FXL_VIEWPORT_WIDTH: " + width);
                debug("READIUM_FXL_VIEWPORT_HEIGHT: " + height);
            }
            wh = {
                height: height,
                scale: 1,
                tx: 0,
                ty: 0,
                width: width,
            };
        }
    }
    else {
        wh = {
            height: height,
            scale: 1,
            tx: 0,
            ty: 0,
            width: width,
        };
    }
    if (innerWidth && innerHeight && width && height && isFixedLayout
        && documant && documant.documentElement && documant.body) {
        documant.documentElement.classList.add(styles_1.ROOT_CLASS_FIXED_LAYOUT);
        documant.body.style.width = width + "px";
        documant.body.style.height = height + "px";
        documant.body.style.overflow = "hidden";
        documant.body.style.margin = "0";
        if (isDEBUG_VISUALS(documant)) {
            debug("FXL width: " + width);
            debug("FXL height: " + height);
        }
        var visibleWidth = innerWidth;
        var visibleHeight = innerHeight;
        if (isDEBUG_VISUALS(documant)) {
            debug("FXL visible width: " + visibleWidth);
            debug("FXL visible height: " + visibleHeight);
        }
        var ratioX = visibleWidth / width;
        var ratioY = visibleHeight / height;
        var ratio = Math.min(ratioX, ratioY);
        var tx = (visibleWidth - (width * ratio)) *
            (wvSlot === styles_1.WebViewSlotEnum.center ? 0.5 : (wvSlot === styles_1.WebViewSlotEnum.right ? 0 : 1));
        var ty = (visibleHeight - (height * ratio)) / 2;
        if (isDEBUG_VISUALS(documant)) {
            debug("FXL trans X: " + tx);
            debug("FXL trans Y: " + ty);
            debug("FXL scale XY: " + ratio);
        }
        if (wh) {
            wh.scale = ratio;
            wh.tx = tx;
            wh.ty = ty;
        }
        documant.documentElement.style.transformOrigin = "0 0";
        documant.documentElement.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + ratio + ")";
    }
    return wh;
}
exports.configureFixedLayout = configureFixedLayout;
function ensureHead(documant) {
    if (!documant || !documant.documentElement) {
        return;
    }
    var docElement = documant.documentElement;
    if (!documant.head) {
        var headElement = documant.createElement("head");
        if (documant.body) {
            docElement.insertBefore(headElement, documant.body);
        }
        else {
            docElement.appendChild(headElement);
        }
    }
}
exports.ensureHead = ensureHead;
function appendCSSInline(documant, id, css) {
    ensureHead(documant);
    if (!documant || !documant.head) {
        return;
    }
    var idz = "Readium2-" + id;
    var s = documant.getElementById(idz);
    if (s) {
        return;
    }
    var styleElement = documant.createElement("style");
    styleElement.setAttribute("id", idz);
    styleElement.setAttribute("type", "text/css");
    styleElement.appendChild(documant.createTextNode(css));
    documant.head.appendChild(styleElement);
}
exports.appendCSSInline = appendCSSInline;
function appendCSS(documant, mod, urlRoot) {
    ensureHead(documant);
    if (!documant || !documant.head) {
        return;
    }
    var idz = "ReadiumCSS-" + mod;
    var s = documant.getElementById(idz);
    if (s) {
        return;
    }
    var linkElement = documant.createElement("link");
    linkElement.setAttribute("id", idz);
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", urlRoot + "ReadiumCSS-" + mod + ".css");
    var childElementCount = 0;
    var firstElementChild = null;
    if (typeof documant.head.childElementCount !== "undefined") {
        childElementCount = documant.head.childElementCount;
        firstElementChild = documant.head.firstElementChild;
    }
    else {
        if (documant.head && documant.head.childNodes && documant.head.childNodes.length) {
            for (var i = 0; i < documant.head.childNodes.length; i++) {
                var child = documant.head.childNodes[i];
                if (child.nodeType === 1) {
                    childElementCount++;
                    if (!firstElementChild) {
                        firstElementChild = child;
                    }
                }
            }
        }
    }
    if (mod === "before" && childElementCount && firstElementChild) {
        documant.head.insertBefore(linkElement, firstElementChild);
    }
    else {
        documant.head.appendChild(linkElement);
    }
}
exports.appendCSS = appendCSS;
function removeCSS(documant, mod) {
    var linkElement = documant.getElementById("ReadiumCSS-" + mod);
    if (linkElement && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
    }
}
exports.removeCSS = removeCSS;
function removeAllCSS(documant) {
    removeCSS(documant, "before");
    removeCSS(documant, "after");
    removeCSS(documant, "default");
}
exports.removeAllCSS = removeAllCSS;
function injectDefaultCSS(documant) {
    appendCSSInline(documant, "electron-mo", styles_1.mediaOverlaysCssStyles);
    appendCSSInline(documant, "electron-tts", styles_1.ttsCssStyles);
    appendCSSInline(documant, "electron-footnotes", styles_1.footnotesCssStyles);
    appendCSSInline(documant, "electron-selection", styles_1.selectionCssStyles);
    appendCSSInline(documant, "electron-focus", styles_1.focusCssStyles);
    appendCSSInline(documant, "electron-target", styles_1.targetCssStyles);
    appendCSSInline(documant, "electron-scrollbars", styles_1.scrollBarCssStyles);
    appendCSSInline(documant, "electron-visibility-mask", styles_1.visibilityMaskCssStyles);
    appendCSSInline(documant, "electron-audiobook", styles_1.audioCssStyles);
}
exports.injectDefaultCSS = injectDefaultCSS;
function injectReadPosCSS(documant) {
    appendCSSInline(documant, "electron-readPos", styles_1.readPosCssStyles);
}
exports.injectReadPosCSS = injectReadPosCSS;
function readiumCssTransformHtml(htmlStr, readiumcssJson, mediaType) {
    var iHtmlStart = htmlStr.indexOf("<html");
    if (iHtmlStart < 0) {
        return htmlStr;
    }
    var iBodyStart = htmlStr.indexOf("<body");
    if (iBodyStart < 0) {
        return htmlStr;
    }
    var iBodyEnd = htmlStr.indexOf(">", iBodyStart);
    if (iBodyEnd <= 0) {
        return htmlStr;
    }
    var parseableChunk = htmlStr.substr(iHtmlStart, iBodyEnd - iHtmlStart + 1);
    var htmlStrToParse = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + parseableChunk + "TXT</body></html>";
    var documant = (0, dom_1.parseDOM)(htmlStrToParse, mediaType);
    documant.documentElement.setAttribute("data-readiumcss-injected", "yes");
    documant.documentElement.classList.add(styles_1.ROOT_CLASS_INVISIBLE_MASK);
    documant.documentElement.classList.remove(styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED);
    var rtl = isDocRTL(documant);
    var vertical = isDocVertical(documant);
    if (readiumcssJson) {
        if (IS_DEV) {
            debug("_____ readiumCssJson.urlRoot (readiumCssTransformHtml()): ", readiumcssJson.urlRoot);
        }
        readiumCSSSet(documant, readiumcssJson, vertical, rtl);
    }
    injectDefaultCSS(documant);
    if (IS_DEV) {
        injectReadPosCSS(documant);
    }
    var serialized = (0, dom_1.serializeDOM)(documant);
    var prefix = htmlStr.substr(0, iHtmlStart);
    var suffix = htmlStr.substr(iBodyEnd + 1);
    var iHtmlStart_ = serialized.indexOf("<html");
    if (iHtmlStart_ < 0) {
        return htmlStr;
    }
    var iBodyStart_ = serialized.indexOf("<body");
    if (iBodyStart_ < 0) {
        return htmlStr;
    }
    var iBodyEnd_ = serialized.indexOf(">", iBodyStart_);
    if (iBodyEnd_ <= 0) {
        return htmlStr;
    }
    var middle = serialized.substr(iHtmlStart_, iBodyEnd_ - iHtmlStart_ + 1);
    var newStr = "" + prefix + middle + suffix;
    return newStr;
}
exports.readiumCssTransformHtml = readiumCssTransformHtml;
//# sourceMappingURL=readium-css-inject.js.map