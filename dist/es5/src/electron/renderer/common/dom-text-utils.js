"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTtsQueue = exports.findTtsQueueItemIndex = exports.getTtsQueueItemRef = exports.getTtsQueueItemRefText = exports.getTtsQueueLength = exports.consoleLogTtsQueue = exports.consoleLogTtsQueueItem = exports.normalizeText = exports.normalizeHtmlText = exports.getDirection = exports.getLanguage = exports.combineTextNodes = void 0;
var tslib_1 = require("tslib");
var sentence_splitter_1 = require("sentence-splitter");
var styles_1 = require("../../common/styles");
var cssselector2_3_1 = require("../common/cssselector2-3");
var win = global.window;
function combineTextNodes(textNodes, skipNormalize) {
    var e_1, _a;
    if (textNodes && textNodes.length) {
        var str = "";
        try {
            for (var textNodes_1 = tslib_1.__values(textNodes), textNodes_1_1 = textNodes_1.next(); !textNodes_1_1.done; textNodes_1_1 = textNodes_1.next()) {
                var textNode = textNodes_1_1.value;
                var txt = textNode.nodeValue;
                if (txt) {
                    if (!txt.trim().length) {
                        txt = " ";
                        str += txt;
                    }
                    else {
                        str += (skipNormalize ? txt : normalizeText(txt));
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (textNodes_1_1 && !textNodes_1_1.done && (_a = textNodes_1.return)) _a.call(textNodes_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return str;
    }
    return "";
}
exports.combineTextNodes = combineTextNodes;
function getLanguage(el) {
    var currentElement = el;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        var lang = currentElement.getAttribute("xml:lang");
        if (!lang) {
            lang = currentElement.getAttributeNS("http://www.w3.org/XML/1998/namespace", "lang");
        }
        if (!lang) {
            lang = currentElement.getAttribute("lang");
        }
        if (lang) {
            return lang;
        }
        currentElement = currentElement.parentNode;
    }
    return undefined;
}
exports.getLanguage = getLanguage;
function getDirection(el) {
    var currentElement = el;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        var dir = currentElement.getAttribute("dir");
        if (dir) {
            return dir;
        }
        currentElement = currentElement.parentNode;
    }
    return undefined;
}
exports.getDirection = getDirection;
function normalizeHtmlText(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
exports.normalizeHtmlText = normalizeHtmlText;
function normalizeText(str) {
    return normalizeHtmlText(str).replace(/[\r\n]/g, " ").replace(/\s\s+/g, " ");
}
exports.normalizeText = normalizeText;
function consoleLogTtsQueueItem(i) {
    var e_2, _a;
    console.log("<<----");
    console.log(i.dir);
    console.log(i.lang);
    var cssSelector = (0, cssselector2_3_1.uniqueCssSelector)(i.parentElement, i.parentElement.ownerDocument);
    console.log(cssSelector);
    console.log(i.parentElement.tagName);
    console.log(i.combinedText);
    if (i.combinedTextSentences) {
        console.log(".......");
        try {
            for (var _b = tslib_1.__values(i.combinedTextSentences), _c = _b.next(); !_c.done; _c = _b.next()) {
                var j = _c.value;
                console.log(j);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        console.log(".......");
    }
    console.log("---->>");
}
exports.consoleLogTtsQueueItem = consoleLogTtsQueueItem;
function consoleLogTtsQueue(f) {
    var e_3, _a;
    try {
        for (var f_1 = tslib_1.__values(f), f_1_1 = f_1.next(); !f_1_1.done; f_1_1 = f_1.next()) {
            var i = f_1_1.value;
            consoleLogTtsQueueItem(i);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (f_1_1 && !f_1_1.done && (_a = f_1.return)) _a.call(f_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
}
exports.consoleLogTtsQueue = consoleLogTtsQueue;
function getTtsQueueLength(items) {
    var e_4, _a;
    var l = 0;
    try {
        for (var items_1 = tslib_1.__values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
            var it = items_1_1.value;
            if (it.combinedTextSentences) {
                l += it.combinedTextSentences.length;
            }
            else {
                l++;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return l;
}
exports.getTtsQueueLength = getTtsQueueLength;
function getTtsQueueItemRefText(obj) {
    if (obj.iSentence === -1) {
        return obj.item.combinedText;
    }
    if (obj.item.combinedTextSentences) {
        return obj.item.combinedTextSentences[obj.iSentence];
    }
    return "";
}
exports.getTtsQueueItemRefText = getTtsQueueItemRefText;
function getTtsQueueItemRef(items, index) {
    var e_5, _a, e_6, _b;
    var i = -1;
    var k = -1;
    try {
        for (var items_2 = tslib_1.__values(items), items_2_1 = items_2.next(); !items_2_1.done; items_2_1 = items_2.next()) {
            var it = items_2_1.value;
            k++;
            if (it.combinedTextSentences) {
                var j = -1;
                try {
                    for (var _c = (e_6 = void 0, tslib_1.__values(it.combinedTextSentences)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var _sent = _d.value;
                        j++;
                        i++;
                        if (index === i) {
                            return { item: it, iArray: k, iGlobal: i, iSentence: j };
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
            else {
                i++;
                if (index === i) {
                    return { item: it, iArray: k, iGlobal: i, iSentence: -1 };
                }
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (items_2_1 && !items_2_1.done && (_a = items_2.return)) _a.call(items_2);
        }
        finally { if (e_5) throw e_5.error; }
    }
    return undefined;
}
exports.getTtsQueueItemRef = getTtsQueueItemRef;
function findTtsQueueItemIndex(ttsQueue, element, startTextNode, startTextNodeOffset, rootElem) {
    var e_7, _a, e_8, _b, e_9, _c, e_10, _d, e_11, _e, e_12, _f;
    var _g, _h, _j;
    var i = 0;
    try {
        for (var ttsQueue_1 = tslib_1.__values(ttsQueue), ttsQueue_1_1 = ttsQueue_1.next(); !ttsQueue_1_1.done; ttsQueue_1_1 = ttsQueue_1.next()) {
            var ttsQueueItem = ttsQueue_1_1.value;
            if (startTextNode) {
                if ((_g = ttsQueueItem.textNodes) === null || _g === void 0 ? void 0 : _g.includes(startTextNode)) {
                    if (ttsQueueItem.combinedTextSentences &&
                        ttsQueueItem.combinedTextSentencesRangeBegin &&
                        ttsQueueItem.combinedTextSentencesRangeEnd) {
                        var offset = 0;
                        try {
                            for (var _k = (e_8 = void 0, tslib_1.__values(ttsQueueItem.textNodes)), _l = _k.next(); !_l.done; _l = _k.next()) {
                                var txtNode = _l.value;
                                if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                                    continue;
                                }
                                if (txtNode === startTextNode) {
                                    offset += startTextNodeOffset;
                                    break;
                                }
                                offset += txtNode.nodeValue.length;
                            }
                        }
                        catch (e_8_1) { e_8 = { error: e_8_1 }; }
                        finally {
                            try {
                                if (_l && !_l.done && (_b = _k.return)) _b.call(_k);
                            }
                            finally { if (e_8) throw e_8.error; }
                        }
                        var j = i - 1;
                        try {
                            for (var _m = (e_9 = void 0, tslib_1.__values(ttsQueueItem.combinedTextSentencesRangeEnd)), _o = _m.next(); !_o.done; _o = _m.next()) {
                                var end = _o.value;
                                j++;
                                if (end < offset) {
                                    continue;
                                }
                                return j;
                            }
                        }
                        catch (e_9_1) { e_9 = { error: e_9_1 }; }
                        finally {
                            try {
                                if (_o && !_o.done && (_c = _m.return)) _c.call(_m);
                            }
                            finally { if (e_9) throw e_9.error; }
                        }
                        return i;
                    }
                    else {
                        return i;
                    }
                }
            }
            else if ((element === ttsQueueItem.parentElement
                ||
                    (ttsQueueItem.parentElement !== element.ownerDocument.body &&
                        ttsQueueItem.parentElement !== rootElem &&
                        ttsQueueItem.parentElement.contains(element))
                ||
                    element.contains(ttsQueueItem.parentElement))) {
                return i;
            }
            if (ttsQueueItem.combinedTextSentences) {
                i += ttsQueueItem.combinedTextSentences.length;
            }
            else {
                i++;
            }
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (ttsQueue_1_1 && !ttsQueue_1_1.done && (_a = ttsQueue_1.return)) _a.call(ttsQueue_1);
        }
        finally { if (e_7) throw e_7.error; }
    }
    i = 0;
    try {
        for (var ttsQueue_2 = tslib_1.__values(ttsQueue), ttsQueue_2_1 = ttsQueue_2.next(); !ttsQueue_2_1.done; ttsQueue_2_1 = ttsQueue_2.next()) {
            var ttsQueueItem = ttsQueue_2_1.value;
            if (startTextNode && ((_h = ttsQueueItem.textNodes) === null || _h === void 0 ? void 0 : _h.includes(startTextNode))) {
                if (ttsQueueItem.combinedTextSentences &&
                    ttsQueueItem.combinedTextSentencesRangeBegin &&
                    ttsQueueItem.combinedTextSentencesRangeEnd) {
                    var offset = 0;
                    try {
                        for (var _p = (e_11 = void 0, tslib_1.__values(ttsQueueItem.textNodes)), _q = _p.next(); !_q.done; _q = _p.next()) {
                            var txtNode = _q.value;
                            if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                                continue;
                            }
                            if (txtNode === startTextNode) {
                                offset += startTextNodeOffset;
                                break;
                            }
                            offset += txtNode.nodeValue.length;
                        }
                    }
                    catch (e_11_1) { e_11 = { error: e_11_1 }; }
                    finally {
                        try {
                            if (_q && !_q.done && (_e = _p.return)) _e.call(_p);
                        }
                        finally { if (e_11) throw e_11.error; }
                    }
                    var j = i - 1;
                    try {
                        for (var _r = (e_12 = void 0, tslib_1.__values(ttsQueueItem.combinedTextSentencesRangeEnd)), _s = _r.next(); !_s.done; _s = _r.next()) {
                            var end = _s.value;
                            j++;
                            if (end < offset) {
                                continue;
                            }
                            return j;
                        }
                    }
                    catch (e_12_1) { e_12 = { error: e_12_1 }; }
                    finally {
                        try {
                            if (_s && !_s.done && (_f = _r.return)) _f.call(_r);
                        }
                        finally { if (e_12) throw e_12.error; }
                    }
                    return i;
                }
                else {
                    return i;
                }
            }
            else if ((!startTextNode || !((_j = ttsQueueItem.textNodes) === null || _j === void 0 ? void 0 : _j.length)) &&
                (element === ttsQueueItem.parentElement
                    ||
                        (ttsQueueItem.parentElement !== element.ownerDocument.body &&
                            ttsQueueItem.parentElement !== rootElem &&
                            ttsQueueItem.parentElement.contains(element))
                    ||
                        element.contains(ttsQueueItem.parentElement))) {
                return i;
            }
            if (ttsQueueItem.combinedTextSentences) {
                i += ttsQueueItem.combinedTextSentences.length;
            }
            else {
                i++;
            }
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (ttsQueue_2_1 && !ttsQueue_2_1.done && (_d = ttsQueue_2.return)) _d.call(ttsQueue_2);
        }
        finally { if (e_10) throw e_10.error; }
    }
    return -1;
}
exports.findTtsQueueItemIndex = findTtsQueueItemIndex;
var _putInElementStackTagNames = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "th", "td", "caption", "li", "blockquote", "q", "dt", "dd", "figcaption", "div", "pre"];
var _doNotProcessDeepChildTagNames = ["svg", "img", "sup", "sub", "audio", "video", "source", "button", "canvas", "del", "dialog", "embed", "form", "head", "iframe", "meter", "noscript", "object", "s", "script", "select", "style", "textarea"];
var _skippables = [
    "footnote",
    "endnote",
    "pagebreak",
    "note",
    "rearnote",
    "sidebar",
    "marginalia",
    "annotation",
];
var computeEpubTypes = function (childElement) {
    var epubType = childElement.getAttribute("epub:type");
    if (!epubType) {
        epubType = childElement.getAttributeNS("http://www.idpf.org/2007/ops", "type");
        if (!epubType) {
            epubType = childElement.getAttribute("role");
            if (epubType) {
                epubType = epubType.replace(/doc-/g, "");
            }
        }
    }
    if (epubType) {
        epubType = epubType.replace(/\s\s+/g, " ").trim();
        if (epubType.length === 0) {
            epubType = null;
        }
    }
    var epubTypes = epubType ? epubType.split(" ") : [];
    return epubTypes;
};
function generateTtsQueue(rootElement, splitSentences) {
    var e_13, _a;
    var ttsQueue = [];
    var elementStack = [];
    function processTextNode(textNode) {
        if (textNode.nodeType !== Node.TEXT_NODE) {
            return;
        }
        if (!textNode.nodeValue) {
            return;
        }
        var parentElement = elementStack[elementStack.length - 1];
        if (!parentElement) {
            return;
        }
        var current = ttsQueue[ttsQueue.length - 1];
        var lang = textNode.parentElement ? getLanguage(textNode.parentElement) : undefined;
        var dir = textNode.parentElement ? getDirection(textNode.parentElement) : undefined;
        if (!current || current.parentElement !== parentElement || current.lang !== lang || current.dir !== dir) {
            if (win.READIUM2.ttsSkippabilityEnabled) {
                var epubTypes = computeEpubTypes(parentElement);
                var isSkippable = epubTypes.find(function (et) { return _skippables.includes(et); }) ? true : undefined;
                if (isSkippable) {
                    return;
                }
            }
            current = {
                combinedText: "",
                combinedTextSentences: undefined,
                combinedTextSentencesRangeBegin: undefined,
                combinedTextSentencesRangeEnd: undefined,
                dir: dir,
                lang: lang,
                parentElement: parentElement,
                textNodes: [],
            };
            ttsQueue.push(current);
        }
        current.textNodes.push(textNode);
    }
    var first = true;
    function processElement(element) {
        var e_14, _a, e_15, _b, e_16, _c, e_17, _d;
        var _e, _f, _g, _h, _j, _k, _l;
        if (element.nodeType !== Node.ELEMENT_NODE) {
            first = false;
            return;
        }
        function isHidden(el) {
            var _a, _b;
            if (el.getAttribute("id") === styles_1.SKIP_LINK_ID) {
                return true;
            }
            if (((_a = el.tagName) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "rt") {
                return true;
            }
            var curEl = el;
            do {
                if (curEl.nodeType === Node.ELEMENT_NODE &&
                    ((_b = curEl.tagName) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "details" &&
                    !curEl.open) {
                    return true;
                }
            } while (curEl.parentNode && curEl.parentNode.nodeType === Node.ELEMENT_NODE &&
                (curEl = curEl.parentNode));
            var elStyle = win.getComputedStyle(el);
            if (elStyle) {
                var display = elStyle.getPropertyValue("display");
                if (display === "none") {
                    return true;
                }
                else {
                    var opacity = elStyle.getPropertyValue("opacity");
                    if (opacity === "0") {
                        return true;
                    }
                }
            }
            if (el.getAttribute("hidden") ||
                el.getAttribute("aria-hidden") === "true") {
                return true;
            }
            return false;
        }
        var hidden = isHidden(element);
        if (hidden) {
            first = false;
            return;
        }
        if (win.READIUM2.ttsSkippabilityEnabled) {
            var epubTypes = computeEpubTypes(element);
            var isSkippable = epubTypes.find(function (et) { return _skippables.includes(et); }) ? true : undefined;
            if (isSkippable) {
                first = false;
                return;
            }
        }
        var tagNameLow = element.tagName ? element.tagName.toLowerCase() : undefined;
        var putInElementStack = first ||
            tagNameLow && _putInElementStackTagNames.includes(tagNameLow);
        first = false;
        if (putInElementStack) {
            elementStack.push(element);
        }
        try {
            for (var _m = tslib_1.__values(element.childNodes), _o = _m.next(); !_o.done; _o = _m.next()) {
                var childNode = _o.value;
                switch (childNode.nodeType) {
                    case Node.ELEMENT_NODE:
                        var childElement = childNode;
                        var childTagNameLow = childElement.tagName ? childElement.tagName.toLowerCase() : undefined;
                        var hidden_1 = isHidden(childElement);
                        var epubTypes = computeEpubTypes(childElement);
                        var isSkippable = epubTypes.find(function (et) { return _skippables.includes(et); }) ? true : undefined;
                        if (win.READIUM2.ttsSkippabilityEnabled && isSkippable) {
                            continue;
                        }
                        var isPageBreak = epubTypes.find(function (et) { return et === "pagebreak"; }) ? true : false;
                        var pageBreakNeedsDeepDive = isPageBreak && !hidden_1;
                        if (pageBreakNeedsDeepDive) {
                            var altAttr = childElement.getAttribute("title");
                            if (altAttr) {
                                var txt = altAttr.trim();
                                if (txt) {
                                    pageBreakNeedsDeepDive = false;
                                    var lang = getLanguage(childElement);
                                    var dir = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir: dir,
                                        lang: lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                            else {
                                altAttr = childElement.getAttribute("aria-label");
                                if (altAttr) {
                                    var txt = altAttr.trim();
                                    if (txt) {
                                        pageBreakNeedsDeepDive = false;
                                        var lang = getLanguage(childElement);
                                        var dir = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir: dir,
                                            lang: lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                            }
                        }
                        var isLink = childTagNameLow === "a" && childElement.href;
                        var linkNeedsDeepDive = isLink && !hidden_1;
                        if (linkNeedsDeepDive) {
                            var altAttr = childElement.getAttribute("title");
                            if (altAttr) {
                                var txt = altAttr.trim();
                                if (txt) {
                                    linkNeedsDeepDive = false;
                                    var lang = getLanguage(childElement);
                                    var dir = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir: dir,
                                        lang: lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                            else {
                                altAttr = childElement.getAttribute("aria-label");
                                if (altAttr) {
                                    var txt = altAttr.trim();
                                    if (txt) {
                                        linkNeedsDeepDive = false;
                                        var lang = getLanguage(childElement);
                                        var dir = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir: dir,
                                            lang: lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                            }
                        }
                        var isMathJax = childTagNameLow && childTagNameLow.startsWith("mjx-");
                        var isMathML = childTagNameLow === "math";
                        var processDeepChild = pageBreakNeedsDeepDive ||
                            linkNeedsDeepDive ||
                            (!isPageBreak &&
                                !isLink &&
                                !isMathJax &&
                                !isMathML &&
                                childTagNameLow && !_doNotProcessDeepChildTagNames.includes(childTagNameLow));
                        if (processDeepChild) {
                            processElement(childElement);
                        }
                        else if (!hidden_1) {
                            if (isPageBreak || isLink) {
                            }
                            else if (isMathML) {
                                var altAttr = childElement.getAttribute("alttext");
                                if (altAttr) {
                                    var txt = altAttr.trim();
                                    if (txt) {
                                        var lang = getLanguage(childElement);
                                        var dir = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir: dir,
                                            lang: lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                                else {
                                    var txt = (_e = childElement.textContent) === null || _e === void 0 ? void 0 : _e.trim();
                                    if (txt) {
                                        var lang = getLanguage(childElement);
                                        var dir = getDirection(childElement);
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir: dir,
                                            lang: lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                            }
                            else if (isMathJax) {
                                if (childTagNameLow === "mjx-container") {
                                    var mathJaxEl = void 0;
                                    var mathJaxElMathML = void 0;
                                    var mathJaxContainerChildren = Array.from(childElement.children);
                                    try {
                                        for (var mathJaxContainerChildren_1 = (e_15 = void 0, tslib_1.__values(mathJaxContainerChildren)), mathJaxContainerChildren_1_1 = mathJaxContainerChildren_1.next(); !mathJaxContainerChildren_1_1.done; mathJaxContainerChildren_1_1 = mathJaxContainerChildren_1.next()) {
                                            var mathJaxContainerChild = mathJaxContainerChildren_1_1.value;
                                            if (((_f = mathJaxContainerChild.tagName) === null || _f === void 0 ? void 0 : _f.toLowerCase()) === "mjx-math") {
                                                mathJaxEl = mathJaxContainerChild;
                                            }
                                            else if (((_g = mathJaxContainerChild.tagName) === null || _g === void 0 ? void 0 : _g.toLowerCase()) === "mjx-assistive-mml") {
                                                var mathJaxAMMLChildren = Array.from(mathJaxContainerChild.children);
                                                try {
                                                    for (var mathJaxAMMLChildren_1 = (e_16 = void 0, tslib_1.__values(mathJaxAMMLChildren)), mathJaxAMMLChildren_1_1 = mathJaxAMMLChildren_1.next(); !mathJaxAMMLChildren_1_1.done; mathJaxAMMLChildren_1_1 = mathJaxAMMLChildren_1.next()) {
                                                        var mathJaxAMMLChild = mathJaxAMMLChildren_1_1.value;
                                                        if (((_h = mathJaxAMMLChild.tagName) === null || _h === void 0 ? void 0 : _h.toLowerCase()) === "math") {
                                                            mathJaxElMathML = mathJaxAMMLChild;
                                                            break;
                                                        }
                                                    }
                                                }
                                                catch (e_16_1) { e_16 = { error: e_16_1 }; }
                                                finally {
                                                    try {
                                                        if (mathJaxAMMLChildren_1_1 && !mathJaxAMMLChildren_1_1.done && (_c = mathJaxAMMLChildren_1.return)) _c.call(mathJaxAMMLChildren_1);
                                                    }
                                                    finally { if (e_16) throw e_16.error; }
                                                }
                                            }
                                        }
                                    }
                                    catch (e_15_1) { e_15 = { error: e_15_1 }; }
                                    finally {
                                        try {
                                            if (mathJaxContainerChildren_1_1 && !mathJaxContainerChildren_1_1.done && (_b = mathJaxContainerChildren_1.return)) _b.call(mathJaxContainerChildren_1);
                                        }
                                        finally { if (e_15) throw e_15.error; }
                                    }
                                    var altAttr = childElement.getAttribute("aria-label");
                                    if (altAttr) {
                                        var txt = altAttr.trim();
                                        if (txt) {
                                            var lang = getLanguage(childElement);
                                            var dir = undefined;
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir: dir,
                                                lang: lang,
                                                parentElement: mathJaxEl !== null && mathJaxEl !== void 0 ? mathJaxEl : childElement,
                                                textNodes: [],
                                            });
                                        }
                                    }
                                    else if (mathJaxElMathML) {
                                        var altAttr_1 = mathJaxElMathML.getAttribute("alttext");
                                        if (altAttr_1) {
                                            var txt = altAttr_1.trim();
                                            if (txt) {
                                                var lang = getLanguage(mathJaxElMathML);
                                                var dir = undefined;
                                                ttsQueue.push({
                                                    combinedText: txt,
                                                    combinedTextSentences: undefined,
                                                    combinedTextSentencesRangeBegin: undefined,
                                                    combinedTextSentencesRangeEnd: undefined,
                                                    dir: dir,
                                                    lang: lang,
                                                    parentElement: mathJaxEl !== null && mathJaxEl !== void 0 ? mathJaxEl : childElement,
                                                    textNodes: [],
                                                });
                                            }
                                        }
                                        else {
                                            var txt = (_j = mathJaxElMathML.textContent) === null || _j === void 0 ? void 0 : _j.trim();
                                            if (txt) {
                                                var lang = getLanguage(mathJaxElMathML);
                                                var dir = getDirection(mathJaxElMathML);
                                                ttsQueue.push({
                                                    combinedText: txt,
                                                    combinedTextSentences: undefined,
                                                    combinedTextSentencesRangeBegin: undefined,
                                                    combinedTextSentencesRangeEnd: undefined,
                                                    dir: dir,
                                                    lang: lang,
                                                    parentElement: mathJaxEl !== null && mathJaxEl !== void 0 ? mathJaxEl : childElement,
                                                    textNodes: [],
                                                });
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                            else if (childTagNameLow === "img" &&
                                childElement.src) {
                                var altAttr = childElement.getAttribute("alt");
                                if (altAttr) {
                                    var txt = altAttr.trim();
                                    if (txt) {
                                        var lang = getLanguage(childElement);
                                        var dir = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir: dir,
                                            lang: lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                                else {
                                    altAttr = childElement.getAttribute("aria-label");
                                    if (altAttr) {
                                        var txt = altAttr.trim();
                                        if (txt) {
                                            var lang = getLanguage(childElement);
                                            var dir = undefined;
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir: dir,
                                                lang: lang,
                                                parentElement: childElement,
                                                textNodes: [],
                                            });
                                        }
                                    }
                                }
                            }
                            else if (childTagNameLow === "svg") {
                                var altAttr = childElement.getAttribute("aria-label");
                                if (altAttr) {
                                    var txt = altAttr.trim();
                                    if (txt) {
                                        var lang = getLanguage(childElement);
                                        var dir = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir: dir,
                                            lang: lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                                else {
                                    var svgChildren = Array.from(childElement.children);
                                    try {
                                        for (var svgChildren_1 = (e_17 = void 0, tslib_1.__values(svgChildren)), svgChildren_1_1 = svgChildren_1.next(); !svgChildren_1_1.done; svgChildren_1_1 = svgChildren_1.next()) {
                                            var svgChild = svgChildren_1_1.value;
                                            if (((_k = svgChild.tagName) === null || _k === void 0 ? void 0 : _k.toLowerCase()) === "title") {
                                                var txt = (_l = svgChild.textContent) === null || _l === void 0 ? void 0 : _l.trim();
                                                if (txt) {
                                                    var lang = getLanguage(svgChild);
                                                    var dir = getDirection(svgChild);
                                                    ttsQueue.push({
                                                        combinedText: txt,
                                                        combinedTextSentences: undefined,
                                                        combinedTextSentencesRangeBegin: undefined,
                                                        combinedTextSentencesRangeEnd: undefined,
                                                        dir: dir,
                                                        lang: lang,
                                                        parentElement: childElement,
                                                        textNodes: [],
                                                    });
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    catch (e_17_1) { e_17 = { error: e_17_1 }; }
                                    finally {
                                        try {
                                            if (svgChildren_1_1 && !svgChildren_1_1.done && (_d = svgChildren_1.return)) _d.call(svgChildren_1);
                                        }
                                        finally { if (e_17) throw e_17.error; }
                                    }
                                }
                            }
                        }
                        break;
                    case Node.TEXT_NODE:
                        if (elementStack.length !== 0) {
                            processTextNode(childNode);
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (_o && !_o.done && (_a = _m.return)) _a.call(_m);
            }
            finally { if (e_14) throw e_14.error; }
        }
        if (putInElementStack) {
            elementStack.pop();
        }
    }
    processElement(rootElement);
    function finalizeTextNodes(ttsQueueItem) {
        var e_18, _a;
        if (!ttsQueueItem.textNodes || !ttsQueueItem.textNodes.length) {
            if (!ttsQueueItem.combinedText || !ttsQueueItem.combinedText.length) {
                ttsQueueItem.combinedText = "";
            }
            ttsQueueItem.combinedTextSentences = undefined;
            return;
        }
        ttsQueueItem.combinedText = combineTextNodes(ttsQueueItem.textNodes, true).replace(/[\r\n]/g, " ");
        if (!ttsQueueItem.combinedText.trim().length) {
            ttsQueueItem.combinedText = "";
            ttsQueueItem.combinedTextSentences = undefined;
            return;
        }
        var skipSplitSentences = false;
        var parent = ttsQueueItem.parentElement;
        while (parent) {
            if (parent.tagName) {
                var tag = parent.tagName.toLowerCase();
                if (tag === "pre" || tag === "code" ||
                    tag === "video" || tag === "audio" ||
                    tag === "img" || tag === "svg" ||
                    tag === "math" || tag.startsWith("mjx-")) {
                    skipSplitSentences = true;
                    break;
                }
            }
            parent = parent.parentElement;
        }
        if (splitSentences && !skipSplitSentences) {
            try {
                var txt = ttsQueueItem.combinedText;
                ttsQueueItem.combinedTextSentences = undefined;
                var sentences = (0, sentence_splitter_1.split)(txt);
                ttsQueueItem.combinedTextSentences = [];
                ttsQueueItem.combinedTextSentencesRangeBegin = [];
                ttsQueueItem.combinedTextSentencesRangeEnd = [];
                try {
                    for (var sentences_1 = tslib_1.__values(sentences), sentences_1_1 = sentences_1.next(); !sentences_1_1.done; sentences_1_1 = sentences_1.next()) {
                        var sentence = sentences_1_1.value;
                        if (sentence.type === "Sentence") {
                            ttsQueueItem.combinedTextSentences.push(sentence.raw);
                            ttsQueueItem.combinedTextSentencesRangeBegin.push(sentence.range[0]);
                            ttsQueueItem.combinedTextSentencesRangeEnd.push(sentence.range[1]);
                        }
                    }
                }
                catch (e_18_1) { e_18 = { error: e_18_1 }; }
                finally {
                    try {
                        if (sentences_1_1 && !sentences_1_1.done && (_a = sentences_1.return)) _a.call(sentences_1);
                    }
                    finally { if (e_18) throw e_18.error; }
                }
                if (ttsQueueItem.combinedTextSentences.length === 0 ||
                    ttsQueueItem.combinedTextSentences.length === 1) {
                    ttsQueueItem.combinedTextSentences = undefined;
                }
                else {
                }
            }
            catch (err) {
                console.log(err);
                ttsQueueItem.combinedTextSentences = undefined;
            }
        }
        else {
            ttsQueueItem.combinedTextSentences = undefined;
        }
    }
    try {
        for (var ttsQueue_3 = tslib_1.__values(ttsQueue), ttsQueue_3_1 = ttsQueue_3.next(); !ttsQueue_3_1.done; ttsQueue_3_1 = ttsQueue_3.next()) {
            var ttsQueueItem = ttsQueue_3_1.value;
            finalizeTextNodes(ttsQueueItem);
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (ttsQueue_3_1 && !ttsQueue_3_1.done && (_a = ttsQueue_3.return)) _a.call(ttsQueue_3);
        }
        finally { if (e_13) throw e_13.error; }
    }
    ttsQueue = ttsQueue.filter(function (item) {
        return !!item.combinedText.length;
    });
    return ttsQueue;
}
exports.generateTtsQueue = generateTtsQueue;
//# sourceMappingURL=dom-text-utils.js.map