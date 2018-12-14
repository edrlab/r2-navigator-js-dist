"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var xmldom = require("xmldom");
var styles_1 = require("../renderer/webview/styles");
var readium_css_settings_1 = require("./readium-css-settings");
exports.DEBUG_VISUALS = false;
var CSS_CLASS_DARK_THEME = "mdc-theme--dark";
function isDocVertical(document) {
    if (!document || !document.documentElement) {
        return false;
    }
    return false;
}
exports.isDocVertical = isDocVertical;
function isDocRTL(document) {
    if (!document || !document.documentElement) {
        return false;
    }
    var rtl = false;
    var foundDir = false;
    var dirAttr = document.documentElement.getAttribute("dir");
    if (dirAttr === "rtl") {
        foundDir = true;
        rtl = true;
    }
    if (!rtl && document.body) {
        dirAttr = document.body.getAttribute("dir");
        if (dirAttr === "rtl") {
            foundDir = true;
            rtl = true;
        }
    }
    if (!rtl) {
        var langAttr = document.documentElement.getAttribute("lang");
        if (!langAttr) {
            langAttr = document.documentElement.getAttribute("xml:lang");
        }
        if (!langAttr) {
            langAttr = document.documentElement.getAttributeNS("http://www.w3.org/XML/1998/", "lang");
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
            document.documentElement.setAttribute("dir", "rtl");
        }
    }
    return rtl;
}
exports.isDocRTL = isDocRTL;
function isPaginated(document) {
    return document && document.documentElement &&
        document.documentElement.classList.contains("readium-paginated");
}
exports.isPaginated = isPaginated;
function readiumCSSSet(document, messageJson, urlRootReadiumCSS, isVerticalWritingMode, isRTL) {
    if (!messageJson) {
        return;
    }
    if (!document || !document.documentElement) {
        return;
    }
    var docElement = document.documentElement;
    if (!messageJson.setCSS) {
        docElement.removeAttribute("data-readiumcss");
        removeAllCSS(document);
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
        if (document.head && document.head.childNodes && document.head.childNodes.length) {
            for (var i = 0; i < document.head.childNodes.length; i++) {
                var child = document.head.childNodes[i];
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
        if (needsDefaultCSS && document.body) {
            var styleAttr = document.body.getAttribute("style");
            if (styleAttr) {
                needsDefaultCSS = false;
            }
        }
        var urlRoot = messageJson.urlRoot ?
            (messageJson.urlRoot + "/" + readium_css_settings_1.READIUM_CSS_URL_PATH + "/") :
            (urlRootReadiumCSS ? urlRootReadiumCSS : ("/" + readium_css_settings_1.READIUM_CSS_URL_PATH + "/"));
        appendCSS(document, "before", urlRoot);
        if (needsDefaultCSS) {
            appendCSS(document, "default", urlRoot);
        }
        appendCSS(document, "after", urlRoot);
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
function configureFixedLayout(document, isFixedLayout, fxlViewportWidth, fxlViewportHeight, innerWidth, innerHeight) {
    if (!document || !document.head || !document.body) {
        return undefined;
    }
    var wh;
    var width = fxlViewportWidth;
    var height = fxlViewportHeight;
    if (!width || !height) {
        var metaViewport = null;
        if (document.head.querySelector) {
            metaViewport = document.head.querySelector("meta[name=viewport]");
        }
        else {
            if (document.head.childNodes && document.head.childNodes.length) {
                for (var i = 0; i < document.head.childNodes.length; i++) {
                    var child = document.head.childNodes[i];
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
            console.log("configureFixedLayout NO meta[name=viewport]");
            return undefined;
        }
        var attr = metaViewport.getAttribute("content");
        if (!attr) {
            console.log("configureFixedLayout NO meta[name=viewport && content]");
            return undefined;
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
            wh = {
                height: height,
                width: width,
            };
        }
    }
    if (innerWidth && innerHeight && width && height && isFixedLayout
        && document && document.documentElement && document.body) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.width = width + "px";
        document.body.style.height = height + "px";
        document.body.style.overflow = "hidden";
        document.body.style.margin = "0";
        console.log("FXL width: " + width);
        console.log("FXL height: " + height);
        var visibleWidth = innerWidth;
        var visibleHeight = innerHeight;
        console.log("FXL visible width: " + visibleWidth);
        console.log("FXL visible height: " + visibleHeight);
        var ratioX = visibleWidth / width;
        var ratioY = visibleHeight / height;
        var ratio = Math.min(ratioX, ratioY);
        var tx = (visibleWidth - (width * ratio)) / 2;
        var ty = (visibleHeight - (height * ratio)) / 2;
        console.log("FXL trans X: " + tx);
        console.log("FXL trans Y: " + ty);
        document.documentElement.style.transformOrigin = "0 0";
        document.documentElement.style.transform = "translateX(" + tx + "px) translateY(" + ty + "px) scale(" + ratio + ")";
    }
    return wh;
}
exports.configureFixedLayout = configureFixedLayout;
function ensureHead(document) {
    if (!document || !document.documentElement) {
        return;
    }
    var docElement = document.documentElement;
    if (!document.head) {
        var headElement = document.createElement("head");
        if (document.body) {
            docElement.insertBefore(headElement, document.body);
        }
        else {
            docElement.appendChild(headElement);
        }
    }
}
exports.ensureHead = ensureHead;
function appendCSSInline(document, id, css) {
    ensureHead(document);
    if (!document || !document.head) {
        return;
    }
    var styleElement = document.createElement("style");
    styleElement.setAttribute("id", "Readium2-" + id);
    styleElement.setAttribute("type", "text/css");
    styleElement.appendChild(document.createTextNode(css));
    document.head.appendChild(styleElement);
}
exports.appendCSSInline = appendCSSInline;
function appendCSS(document, mod, urlRoot) {
    ensureHead(document);
    if (!document || !document.head) {
        return;
    }
    var linkElement = document.createElement("link");
    linkElement.setAttribute("id", "ReadiumCSS-" + mod);
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", urlRoot + "ReadiumCSS-" + mod + ".css");
    var childElementCount = 0;
    var firstElementChild = null;
    if (typeof document.head.childElementCount !== "undefined") {
        childElementCount = document.head.childElementCount;
        firstElementChild = document.head.firstElementChild;
    }
    else {
        if (document.head && document.head.childNodes && document.head.childNodes.length) {
            for (var i = 0; i < document.head.childNodes.length; i++) {
                var child = document.head.childNodes[i];
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
        document.head.insertBefore(linkElement, firstElementChild);
    }
    else {
        document.head.appendChild(linkElement);
    }
}
exports.appendCSS = appendCSS;
function removeCSS(document, mod) {
    var linkElement = document.getElementById("ReadiumCSS-" + mod);
    if (linkElement && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
    }
}
exports.removeCSS = removeCSS;
function removeAllCSS(document) {
    removeCSS(document, "before");
    removeCSS(document, "after");
    removeCSS(document, "default");
}
exports.removeAllCSS = removeAllCSS;
function injectDefaultCSS(document) {
    appendCSSInline(document, "electron-selection", styles_1.selectionCssStyles);
    appendCSSInline(document, "electron-focus", styles_1.focusCssStyles);
    appendCSSInline(document, "electron-target", styles_1.targetCssStyles);
    appendCSSInline(document, "electron-scrollbars", styles_1.scrollBarCssStyles);
}
exports.injectDefaultCSS = injectDefaultCSS;
function injectReadPosCSS(document) {
    appendCSSInline(document, "electron-readPos", styles_1.readPosCssStyles);
}
exports.injectReadPosCSS = injectReadPosCSS;
function definePropertyGetterSetter_DocHeadBody(docu, elementName) {
    Object.defineProperty(docu, elementName, {
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
                            if (exports.DEBUG_VISUALS) {
                                console.log("XMLDOM - cached document." + elementName);
                            }
                            return element;
                        }
                    }
                }
            }
            return undefined;
        },
        set: function (_val) {
            console.log("document." + elementName + " CANNOT BE SET!!");
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
    if (exports.DEBUG_VISUALS) {
        console.log("XMLDOM - cssStyleItem: " + i);
    }
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
                        if (exports.DEBUG_VISUALS) {
                            console.log("XMLDOM - cssStyleItem: " + i + " => " + regexMatch[1]);
                        }
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
    if (exports.DEBUG_VISUALS) {
        console.log("XMLDOM - cssStyleGet: " + cssProperty);
    }
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
                if (exports.DEBUG_VISUALS) {
                    console.log("XMLDOM - cssStyleGet: " + cssProperty + " => " + cssPropertyValue);
                }
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
    if (exports.DEBUG_VISUALS) {
        console.log("XMLDOM - cssStyleSet: " + cssProperty + ": " + val + ";");
    }
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
            if (exports.DEBUG_VISUALS) {
                console.log("XMLDOM - style.length");
            }
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
            if (exports.DEBUG_VISUALS) {
                console.log("XMLDOM - style.length: " + count);
            }
            return count;
        },
        set: function (_val) {
            console.log("style.length CANNOT BE SET!!");
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
    if (exports.DEBUG_VISUALS) {
        console.log("XMLDOM - classListContains: " + className);
    }
    var classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return false;
    }
    var classes = classAttr.split(" ");
    try {
        for (var classes_1 = tslib_1.__values(classes), classes_1_1 = classes_1.next(); !classes_1_1.done; classes_1_1 = classes_1.next()) {
            var clazz = classes_1_1.value;
            if (clazz === className) {
                if (exports.DEBUG_VISUALS) {
                    console.log("XMLDOM - classListContains TRUE: " + className);
                }
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
    if (exports.DEBUG_VISUALS) {
        console.log("XMLDOM - classListAdd: " + className);
    }
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
    if (exports.DEBUG_VISUALS) {
        console.log("XMLDOM - classListRemove: " + className);
    }
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
    var doc = typeof mediaType === "string" ?
        new xmldom.DOMParser().parseFromString(htmlStr, mediaType) :
        new xmldom.DOMParser().parseFromString(htmlStr);
    if (!doc.head) {
        definePropertyGetterSetter_DocHeadBody(doc, "head");
    }
    if (!doc.body) {
        definePropertyGetterSetter_DocHeadBody(doc, "body");
    }
    if (!doc.documentElement.style) {
        definePropertyGetterSetter_ElementStyle(doc.documentElement);
    }
    if (!doc.body.style) {
        definePropertyGetterSetter_ElementStyle(doc.body);
    }
    if (!doc.documentElement.classList) {
        definePropertyGetterSetter_ElementClassList(doc.documentElement);
    }
    injectDefaultCSS(doc);
    if (exports.DEBUG_VISUALS) {
        injectReadPosCSS(doc);
    }
    var rtl = isDocRTL(doc);
    var vertical = isDocVertical(doc);
    if (readiumcssJson) {
        readiumCSSSet(doc, readiumcssJson, undefined, vertical, rtl);
    }
    return new xmldom.XMLSerializer().serializeToString(doc);
}
exports.transformHTML = transformHTML;
//# sourceMappingURL=readium-css-inject.js.map