"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var sentence_splitter_1 = require("sentence-splitter");
var cssselector2_1 = require("../common/cssselector2");
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
function normalizeText(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " ").replace(/\s\s+/g, " ");
}
exports.normalizeText = normalizeText;
function consoleLogTtsQueueItem(i) {
    var e_1, _a;
    console.log("<<----");
    console.log(i.dir);
    console.log(i.lang);
    var cssSelector = cssselector2_1.uniqueCssSelector(i.parentElement, i.parentElement.ownerDocument);
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
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        console.log(".......");
    }
    console.log("---->>");
}
exports.consoleLogTtsQueueItem = consoleLogTtsQueueItem;
function consoleLogTtsQueue(f) {
    var e_2, _a;
    try {
        for (var f_1 = tslib_1.__values(f), f_1_1 = f_1.next(); !f_1_1.done; f_1_1 = f_1.next()) {
            var i = f_1_1.value;
            consoleLogTtsQueueItem(i);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (f_1_1 && !f_1_1.done && (_a = f_1.return)) _a.call(f_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
exports.consoleLogTtsQueue = consoleLogTtsQueue;
function getTtsQueueLength(items) {
    var e_3, _a;
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
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        }
        finally { if (e_3) throw e_3.error; }
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
    var e_4, _a, e_5, _b;
    var i = -1;
    var k = -1;
    try {
        for (var items_2 = tslib_1.__values(items), items_2_1 = items_2.next(); !items_2_1.done; items_2_1 = items_2.next()) {
            var it = items_2_1.value;
            k++;
            if (it.combinedTextSentences) {
                var j = -1;
                try {
                    for (var _c = (e_5 = void 0, tslib_1.__values(it.combinedTextSentences)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var _sent = _d.value;
                        j++;
                        i++;
                        if (index === i) {
                            return { item: it, iArray: k, iGlobal: i, iSentence: j };
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_5) throw e_5.error; }
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
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (items_2_1 && !items_2_1.done && (_a = items_2.return)) _a.call(items_2);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return undefined;
}
exports.getTtsQueueItemRef = getTtsQueueItemRef;
function findTtsQueueItemIndex(ttsQueue, element, rootElem) {
    var e_6, _a;
    var i = 0;
    try {
        for (var ttsQueue_1 = tslib_1.__values(ttsQueue), ttsQueue_1_1 = ttsQueue_1.next(); !ttsQueue_1_1.done; ttsQueue_1_1 = ttsQueue_1.next()) {
            var ttsQueueItem = ttsQueue_1_1.value;
            if (element === ttsQueueItem.parentElement ||
                (ttsQueueItem.parentElement !== element.ownerDocument.body &&
                    ttsQueueItem.parentElement !== rootElem &&
                    ttsQueueItem.parentElement.contains(element)) ||
                element.contains(ttsQueueItem.parentElement)) {
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
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (ttsQueue_1_1 && !ttsQueue_1_1.done && (_a = ttsQueue_1.return)) _a.call(ttsQueue_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
    return -1;
}
exports.findTtsQueueItemIndex = findTtsQueueItemIndex;
function generateTtsQueue(rootElement) {
    var e_7, _a;
    var ttsQueue = [];
    var elementStack = [];
    function processTextNode(textNode) {
        if (textNode.nodeType !== Node.TEXT_NODE) {
            return;
        }
        if (!textNode.nodeValue || !textNode.nodeValue.trim().length) {
            return;
        }
        var parentElement = elementStack[elementStack.length - 1];
        if (!parentElement) {
            return;
        }
        var lang = textNode.parentElement ? getLanguage(textNode.parentElement) : undefined;
        var dir = textNode.parentElement ? getDirection(textNode.parentElement) : undefined;
        var current = ttsQueue[ttsQueue.length - 1];
        if (!current || current.parentElement !== parentElement || current.lang !== lang || current.dir !== dir) {
            current = {
                combinedText: "",
                combinedTextSentences: undefined,
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
        var e_8, _a;
        if (element.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        var isIncluded = first || element.matches("h1, h2, h3, h4, h5, h6, p, th, td, caption, li, blockquote, q, dt, dd, figcaption, div, pre");
        first = false;
        if (isIncluded) {
            elementStack.push(element);
        }
        try {
            for (var _b = tslib_1.__values(element.childNodes), _c = _b.next(); !_c.done; _c = _b.next()) {
                var childNode = _c.value;
                switch (childNode.nodeType) {
                    case Node.ELEMENT_NODE:
                        var isExcluded = childNode.matches("img, sup, sub, audio, video, source, button, canvas, del, dialog, embed, form, head, iframe, meter, noscript, object, s, script, select, style, textarea");
                        if (!isExcluded) {
                            processElement(childNode);
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
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
        if (isIncluded) {
            elementStack.pop();
        }
    }
    processElement(rootElement);
    function combineTextNodes(textNodes) {
        var e_9, _a;
        if (textNodes && textNodes.length) {
            var str = "";
            try {
                for (var textNodes_1 = tslib_1.__values(textNodes), textNodes_1_1 = textNodes_1.next(); !textNodes_1_1.done; textNodes_1_1 = textNodes_1.next()) {
                    var textNode = textNodes_1_1.value;
                    if (textNode.nodeValue) {
                        str += normalizeText(textNode.nodeValue);
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (textNodes_1_1 && !textNodes_1_1.done && (_a = textNodes_1.return)) _a.call(textNodes_1);
                }
                finally { if (e_9) throw e_9.error; }
            }
            return str;
        }
        return "";
    }
    function finalizeTextNodes(ttsQueueItem) {
        var e_10, _a;
        ttsQueueItem.combinedText = combineTextNodes(ttsQueueItem.textNodes).trim();
        try {
            var sentences = sentence_splitter_1.split(ttsQueueItem.combinedText);
            ttsQueueItem.combinedTextSentences = [];
            try {
                for (var sentences_1 = tslib_1.__values(sentences), sentences_1_1 = sentences_1.next(); !sentences_1_1.done; sentences_1_1 = sentences_1.next()) {
                    var sentence = sentences_1_1.value;
                    if (sentence.type === "Sentence") {
                        ttsQueueItem.combinedTextSentences.push(sentence.raw);
                    }
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (sentences_1_1 && !sentences_1_1.done && (_a = sentences_1.return)) _a.call(sentences_1);
                }
                finally { if (e_10) throw e_10.error; }
            }
            if (ttsQueueItem.combinedTextSentences.length === 0 || ttsQueueItem.combinedTextSentences.length === 1) {
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
    try {
        for (var ttsQueue_2 = tslib_1.__values(ttsQueue), ttsQueue_2_1 = ttsQueue_2.next(); !ttsQueue_2_1.done; ttsQueue_2_1 = ttsQueue_2.next()) {
            var ttsQueueItem = ttsQueue_2_1.value;
            finalizeTextNodes(ttsQueueItem);
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (ttsQueue_2_1 && !ttsQueue_2_1.done && (_a = ttsQueue_2.return)) _a.call(ttsQueue_2);
        }
        finally { if (e_7) throw e_7.error; }
    }
    return ttsQueue;
}
exports.generateTtsQueue = generateTtsQueue;
function wrapHighlight(doHighlight, ttsQueueItemRef, cssClassParent, cssClassSpan, _cssClassSubSpan, word, _start, _end) {
    if (typeof word !== "undefined") {
        return;
    }
    var ttsQueueItem = ttsQueueItemRef.item;
    if (ttsQueueItem.parentElement) {
        if (doHighlight) {
            if (!ttsQueueItem.parentElement.classList.contains(cssClassParent)) {
                ttsQueueItem.parentElement.classList.add(cssClassParent);
            }
        }
        else {
            if (ttsQueueItem.parentElement.classList.contains(cssClassParent)) {
                ttsQueueItem.parentElement.classList.remove(cssClassParent);
            }
        }
    }
    ttsQueueItem.textNodes.forEach(function (txtNode) {
        if (!txtNode.parentElement) {
            return;
        }
        if (doHighlight) {
            if (txtNode.parentElement.tagName.toLowerCase() !== "span" ||
                !txtNode.parentElement.classList.contains(cssClassSpan)) {
                var span = txtNode.ownerDocument.createElement("span");
                span.setAttribute("class", cssClassSpan);
                txtNode.parentElement.replaceChild(span, txtNode);
                span.appendChild(txtNode);
            }
        }
        else {
            if (txtNode.parentElement.tagName.toLowerCase() === "span" &&
                txtNode.parentElement.classList.contains(cssClassSpan)) {
                var span = txtNode.parentElement;
                span.removeChild(txtNode);
                if (span.parentElement) {
                    span.parentElement.replaceChild(txtNode, span);
                }
            }
        }
    });
}
exports.wrapHighlight = wrapHighlight;
//# sourceMappingURL=dom-text-utils.js.map