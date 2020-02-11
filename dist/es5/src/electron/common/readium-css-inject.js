"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var debug_ = require("debug");
var xmldom = require("xmldom");
var readium_css_settings_1 = require("./readium-css-settings");
var styles_1 = require("./styles");
exports.CLASS_PAGINATED = "r2-css-paginated";
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
        documant.documentElement.classList.contains(exports.CLASS_PAGINATED);
}
exports.isPaginated = isPaginated;
function readiumCSSSet(documant, messageJson, urlRootReadiumCSS, isVerticalWritingMode, isRTL) {
    if (!messageJson) {
        return;
    }
    if (!documant || !documant.documentElement) {
        return;
    }
    var docElement = documant.documentElement;
    if (messageJson.isFixedLayout) {
        docElement.style.overflow = "hidden";
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
        var urlRoot = messageJson.urlRoot ?
            (messageJson.urlRoot + "/" + readium_css_settings_1.READIUM_CSS_URL_PATH + "/") :
            (urlRootReadiumCSS ? urlRootReadiumCSS : ("/" + readium_css_settings_1.READIUM_CSS_URL_PATH + "/"));
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
        docElement.classList.add(exports.CLASS_PAGINATED);
    }
    else {
        docElement.style.overflow = "auto";
        docElement.classList.remove(exports.CLASS_PAGINATED);
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
    }
    if (!isVerticalWritingMode) {
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
    else if (!isRTL) {
        docElement.style.removeProperty("--USER__ligatures");
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
exports.readiumCSSSet = readiumCSSSet;
function configureFixedLayout(documant, isFixedLayout, fxlViewportWidth, fxlViewportHeight, innerWidth, innerHeight) {
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
        documant.documentElement.style.overflow = "hidden";
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
        var tx = (visibleWidth - (width * ratio)) / 2;
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
function definePropertyGetterSetter_DocHeadBody(documant, elementName) {
    Object.defineProperty(documant, elementName, {
        get: function () {
            var doc = this;
            var key = elementName + "_";
            if (doc[key]) {
                return doc[key];
            }
            if (doc.documentElement.childNodes && doc.documentElement.childNodes.length) {
                for (var i = 0; i < doc.documentElement.childNodes.length; i++) {
                    var child = doc.documentElement.childNodes[i];
                    if (child.nodeType === 1) {
                        var element = child;
                        if (element.localName && element.localName.toLowerCase() === elementName) {
                            doc[key] = element;
                            return element;
                        }
                    }
                }
            }
            return undefined;
        },
        set: function (_val) {
            debug("documant." + elementName + " CANNOT BE SET!!");
        },
    });
}
function cssSetProperty(cssProperty, val) {
    var style = this;
    var elem = style.element;
    cssStyleSet(cssProperty, val, elem);
}
function cssRemoveProperty(cssProperty) {
    var style = this;
    var elem = style.element;
    cssStyleSet(cssProperty, undefined, elem);
}
function cssStyleItem(i) {
    var e_1, _a;
    var style = this;
    var elem = style.element;
    var styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    var count = -1;
    var cssProps = styleAttr.split(";");
    try {
        for (var cssProps_1 = tslib_1.__values(cssProps), cssProps_1_1 = cssProps_1.next(); !cssProps_1_1.done; cssProps_1_1 = cssProps_1.next()) {
            var cssProp = cssProps_1_1.value;
            var trimmed = cssProp.trim();
            if (trimmed.length) {
                count++;
                if (count === i) {
                    var regExStr = "(.+)[s]*:[s]*(.+)";
                    var regex = new RegExp(regExStr, "g");
                    var regexMatch = regex.exec(trimmed);
                    if (regexMatch) {
                        return regexMatch[1];
                    }
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (cssProps_1_1 && !cssProps_1_1.done && (_a = cssProps_1.return)) _a.call(cssProps_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return undefined;
}
function cssStyleGet(cssProperty, elem) {
    var e_2, _a;
    var styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    var regExStr = cssProperty + "[s]*:[s]*(.+)";
    var cssProps = styleAttr.split(";");
    var cssPropertyValue;
    try {
        for (var cssProps_2 = tslib_1.__values(cssProps), cssProps_2_1 = cssProps_2.next(); !cssProps_2_1.done; cssProps_2_1 = cssProps_2.next()) {
            var cssProp = cssProps_2_1.value;
            var regex = new RegExp(regExStr, "g");
            var regexMatch = regex.exec(cssProp.trim());
            if (regexMatch) {
                cssPropertyValue = regexMatch[1];
                break;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (cssProps_2_1 && !cssProps_2_1.done && (_a = cssProps_2.return)) _a.call(cssProps_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return cssPropertyValue ? cssPropertyValue : undefined;
}
function cssStyleSet(cssProperty, val, elem) {
    var str = val ? cssProperty + ": " + val : undefined;
    var styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        if (str) {
            elem.setAttribute("style", str);
        }
    }
    else {
        var regExStr = cssProperty + "[s]*:[s]*(.+)";
        var regex = new RegExp(regExStr, "g");
        var regexMatch = regex.exec(styleAttr);
        if (regexMatch) {
            elem.setAttribute("style", styleAttr.replace(regex, str ? "" + str : ""));
        }
        else {
            if (str) {
                elem.setAttribute("style", styleAttr + "; " + str);
            }
        }
    }
}
function definePropertyGetterSetter_ElementStyle(element) {
    var styleObj = {};
    styleObj.element = element;
    styleObj.setProperty = cssSetProperty.bind(styleObj);
    styleObj.removeProperty = cssRemoveProperty.bind(styleObj);
    styleObj.item = cssStyleItem.bind(styleObj);
    Object.defineProperty(styleObj, "length", {
        get: function () {
            var e_3, _a;
            var style = this;
            var elem = style.element;
            var styleAttr = elem.getAttribute("style");
            if (!styleAttr) {
                return 0;
            }
            var count = 0;
            var cssProps = styleAttr.split(";");
            try {
                for (var cssProps_3 = tslib_1.__values(cssProps), cssProps_3_1 = cssProps_3.next(); !cssProps_3_1.done; cssProps_3_1 = cssProps_3.next()) {
                    var cssProp = cssProps_3_1.value;
                    if (cssProp.trim().length) {
                        count++;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (cssProps_3_1 && !cssProps_3_1.done && (_a = cssProps_3.return)) _a.call(cssProps_3);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return count;
        },
        set: function (_val) {
            debug("style.length CANNOT BE SET!!");
        },
    });
    var cssProperties = ["overflow", "width", "height", "margin", "transformOrigin", "transform"];
    cssProperties.forEach(function (cssProperty) {
        Object.defineProperty(styleObj, cssProperty, {
            get: function () {
                var style = this;
                var elem = style.element;
                return cssStyleGet(cssProperty, elem);
            },
            set: function (val) {
                var style = this;
                var elem = style.element;
                cssStyleSet(cssProperty, val, elem);
            },
        });
    });
    element.style = styleObj;
}
function classListContains(className) {
    var e_4, _a;
    var style = this;
    var elem = style.element;
    var classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return false;
    }
    var classes = classAttr.split(" ");
    try {
        for (var classes_1 = tslib_1.__values(classes), classes_1_1 = classes_1.next(); !classes_1_1.done; classes_1_1 = classes_1.next()) {
            var clazz = classes_1_1.value;
            if (clazz === className) {
                return true;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (classes_1_1 && !classes_1_1.done && (_a = classes_1.return)) _a.call(classes_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return false;
}
function classListAdd(className) {
    var e_5, _a;
    var style = this;
    var elem = style.element;
    var classAttr = elem.getAttribute("class");
    if (!classAttr) {
        elem.setAttribute("class", className);
        return;
    }
    var needsAdding = true;
    var classes = classAttr.split(" ");
    try {
        for (var classes_2 = tslib_1.__values(classes), classes_2_1 = classes_2.next(); !classes_2_1.done; classes_2_1 = classes_2.next()) {
            var clazz = classes_2_1.value;
            if (clazz === className) {
                needsAdding = false;
                break;
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (classes_2_1 && !classes_2_1.done && (_a = classes_2.return)) _a.call(classes_2);
        }
        finally { if (e_5) throw e_5.error; }
    }
    if (needsAdding) {
        elem.setAttribute("class", classAttr + " " + className);
    }
}
function classListRemove(className) {
    var e_6, _a;
    var style = this;
    var elem = style.element;
    var classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return;
    }
    var arr = [];
    var classes = classAttr.split(" ");
    try {
        for (var classes_3 = tslib_1.__values(classes), classes_3_1 = classes_3.next(); !classes_3_1.done; classes_3_1 = classes_3.next()) {
            var clazz = classes_3_1.value;
            if (clazz !== className) {
                arr.push(clazz);
            }
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (classes_3_1 && !classes_3_1.done && (_a = classes_3.return)) _a.call(classes_3);
        }
        finally { if (e_6) throw e_6.error; }
    }
    elem.setAttribute("class", arr.join(" "));
}
function definePropertyGetterSetter_ElementClassList(element) {
    var classListObj = {};
    classListObj.element = element;
    classListObj.contains = classListContains.bind(classListObj);
    classListObj.add = classListAdd.bind(classListObj);
    classListObj.remove = classListRemove.bind(classListObj);
    element.classList = classListObj;
}
function transformHTML(htmlStr, readiumcssJson, mediaType) {
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
    var documant = typeof mediaType === "string" ?
        new xmldom.DOMParser().parseFromString(htmlStrToParse, mediaType) :
        new xmldom.DOMParser().parseFromString(htmlStrToParse);
    documant.documentElement.setAttribute("data-readiumcss-injected", "yes");
    if (!documant.head) {
        definePropertyGetterSetter_DocHeadBody(documant, "head");
    }
    if (!documant.body) {
        definePropertyGetterSetter_DocHeadBody(documant, "body");
    }
    if (!documant.documentElement.style) {
        definePropertyGetterSetter_ElementStyle(documant.documentElement);
    }
    if (!documant.body.style) {
        definePropertyGetterSetter_ElementStyle(documant.body);
    }
    if (!documant.documentElement.classList) {
        definePropertyGetterSetter_ElementClassList(documant.documentElement);
    }
    var rtl = isDocRTL(documant);
    var vertical = isDocVertical(documant);
    if (readiumcssJson) {
        readiumCSSSet(documant, readiumcssJson, undefined, vertical, rtl);
    }
    injectDefaultCSS(documant);
    if (IS_DEV) {
        injectReadPosCSS(documant);
    }
    var serialized = new xmldom.XMLSerializer().serializeToString(documant);
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
exports.transformHTML = transformHTML;
//# sourceMappingURL=readium-css-inject.js.map