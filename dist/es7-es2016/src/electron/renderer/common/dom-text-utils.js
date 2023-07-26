"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTtsQueue = exports.findTtsQueueItemIndex = exports.getTtsQueueItemRef = exports.getTtsQueueItemRefText = exports.getTtsQueueLength = exports.consoleLogTtsQueue = exports.consoleLogTtsQueueItem = exports.normalizeText = exports.normalizeHtmlText = exports.getDirection = exports.getLanguage = exports.combineTextNodes = void 0;
const sentence_splitter_1 = require("sentence-splitter");
const styles_1 = require("../../common/styles");
const cssselector2_3_1 = require("../common/cssselector2-3");
const win = global.window;
function combineTextNodes(textNodes, skipNormalize) {
    if (textNodes && textNodes.length) {
        let str = "";
        for (const textNode of textNodes) {
            if (textNode.nodeValue) {
                str += (skipNormalize ? textNode.nodeValue : normalizeText(textNode.nodeValue));
            }
        }
        return str;
    }
    return "";
}
exports.combineTextNodes = combineTextNodes;
function getLanguage(el) {
    let currentElement = el;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        let lang = currentElement.getAttribute("xml:lang");
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
    let currentElement = el;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        const dir = currentElement.getAttribute("dir");
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
    return normalizeHtmlText(str).replace(/\n/g, " ").replace(/\s\s+/g, " ");
}
exports.normalizeText = normalizeText;
function consoleLogTtsQueueItem(i) {
    console.log("<<----");
    console.log(i.dir);
    console.log(i.lang);
    const cssSelector = (0, cssselector2_3_1.uniqueCssSelector)(i.parentElement, i.parentElement.ownerDocument);
    console.log(cssSelector);
    console.log(i.parentElement.tagName);
    console.log(i.combinedText);
    if (i.combinedTextSentences) {
        console.log(".......");
        for (const j of i.combinedTextSentences) {
            console.log(j);
        }
        console.log(".......");
    }
    console.log("---->>");
}
exports.consoleLogTtsQueueItem = consoleLogTtsQueueItem;
function consoleLogTtsQueue(f) {
    for (const i of f) {
        consoleLogTtsQueueItem(i);
    }
}
exports.consoleLogTtsQueue = consoleLogTtsQueue;
function getTtsQueueLength(items) {
    let l = 0;
    for (const it of items) {
        if (it.combinedTextSentences) {
            l += it.combinedTextSentences.length;
        }
        else {
            l++;
        }
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
    let i = -1;
    let k = -1;
    for (const it of items) {
        k++;
        if (it.combinedTextSentences) {
            let j = -1;
            for (const _sent of it.combinedTextSentences) {
                j++;
                i++;
                if (index === i) {
                    return { item: it, iArray: k, iGlobal: i, iSentence: j };
                }
            }
        }
        else {
            i++;
            if (index === i) {
                return { item: it, iArray: k, iGlobal: i, iSentence: -1 };
            }
        }
    }
    return undefined;
}
exports.getTtsQueueItemRef = getTtsQueueItemRef;
function findTtsQueueItemIndex(ttsQueue, element, startTextNode, startTextNodeOffset, rootElem) {
    var _a, _b, _c;
    let i = 0;
    for (const ttsQueueItem of ttsQueue) {
        if (startTextNode) {
            if ((_a = ttsQueueItem.textNodes) === null || _a === void 0 ? void 0 : _a.includes(startTextNode)) {
                if (ttsQueueItem.combinedTextSentences &&
                    ttsQueueItem.combinedTextSentencesRangeBegin &&
                    ttsQueueItem.combinedTextSentencesRangeEnd) {
                    let offset = 0;
                    for (const txtNode of ttsQueueItem.textNodes) {
                        if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                            continue;
                        }
                        if (txtNode === startTextNode) {
                            offset += startTextNodeOffset;
                            break;
                        }
                        offset += txtNode.nodeValue.length;
                    }
                    let j = i - 1;
                    for (const end of ttsQueueItem.combinedTextSentencesRangeEnd) {
                        j++;
                        if (end < offset) {
                            continue;
                        }
                        return j;
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
    i = 0;
    for (const ttsQueueItem of ttsQueue) {
        if (startTextNode && ((_b = ttsQueueItem.textNodes) === null || _b === void 0 ? void 0 : _b.includes(startTextNode))) {
            if (ttsQueueItem.combinedTextSentences &&
                ttsQueueItem.combinedTextSentencesRangeBegin &&
                ttsQueueItem.combinedTextSentencesRangeEnd) {
                let offset = 0;
                for (const txtNode of ttsQueueItem.textNodes) {
                    if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                        continue;
                    }
                    if (txtNode === startTextNode) {
                        offset += startTextNodeOffset;
                        break;
                    }
                    offset += txtNode.nodeValue.length;
                }
                let j = i - 1;
                for (const end of ttsQueueItem.combinedTextSentencesRangeEnd) {
                    j++;
                    if (end < offset) {
                        continue;
                    }
                    return j;
                }
                return i;
            }
            else {
                return i;
            }
        }
        else if ((!startTextNode || !((_c = ttsQueueItem.textNodes) === null || _c === void 0 ? void 0 : _c.length)) &&
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
    return -1;
}
exports.findTtsQueueItemIndex = findTtsQueueItemIndex;
function generateTtsQueue(rootElement, splitSentences) {
    const ttsQueue = [];
    const elementStack = [];
    function processTextNode(textNode) {
        if (textNode.nodeType !== Node.TEXT_NODE) {
            return;
        }
        if (!textNode.nodeValue || !textNode.nodeValue.trim().length) {
            return;
        }
        const parentElement = elementStack[elementStack.length - 1];
        if (!parentElement) {
            return;
        }
        const lang = textNode.parentElement ? getLanguage(textNode.parentElement) : undefined;
        const dir = textNode.parentElement ? getDirection(textNode.parentElement) : undefined;
        let current = ttsQueue[ttsQueue.length - 1];
        if (!current || current.parentElement !== parentElement || current.lang !== lang || current.dir !== dir) {
            current = {
                combinedText: "",
                combinedTextSentences: undefined,
                combinedTextSentencesRangeBegin: undefined,
                combinedTextSentencesRangeEnd: undefined,
                dir,
                lang,
                parentElement,
                textNodes: [],
            };
            ttsQueue.push(current);
        }
        current.textNodes.push(textNode);
    }
    let first = true;
    function processElement(element) {
        var _a, _b, _c, _d, _e, _f, _g;
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
            let curEl = el;
            do {
                if (curEl.nodeType === Node.ELEMENT_NODE &&
                    ((_b = curEl.tagName) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "details" &&
                    !curEl.open) {
                    return true;
                }
            } while (curEl.parentNode && curEl.parentNode.nodeType === Node.ELEMENT_NODE &&
                (curEl = curEl.parentNode));
            const elStyle = win.getComputedStyle(el);
            if (elStyle) {
                const display = elStyle.getPropertyValue("display");
                if (display === "none") {
                    return true;
                }
                else {
                    const opacity = elStyle.getPropertyValue("opacity");
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
        const hidden = isHidden(element);
        if (hidden) {
            first = false;
            return;
        }
        const putInElementStack = first ||
            element.matches("h1, h2, h3, h4, h5, h6, p, th, td, caption, li, blockquote, q, dt, dd, figcaption, div, pre");
        first = false;
        if (putInElementStack) {
            elementStack.push(element);
        }
        for (const childNode of element.childNodes) {
            switch (childNode.nodeType) {
                case Node.ELEMENT_NODE:
                    const childElement = childNode;
                    const childTagNameLow = childElement.tagName ? childElement.tagName.toLowerCase() : undefined;
                    const hidden = isHidden(childElement);
                    let epubType = childElement.getAttribute("epub:type");
                    if (!epubType) {
                        epubType = childElement.getAttributeNS("http://www.idpf.org/2007/ops", "type");
                        if (!epubType) {
                            epubType = childElement.getAttribute("role");
                        }
                    }
                    const isPageBreak = epubType ? epubType.indexOf("pagebreak") >= 0 : false;
                    let pageBreakNeedsDeepDive = isPageBreak && !hidden;
                    if (pageBreakNeedsDeepDive) {
                        let altAttr = childElement.getAttribute("title");
                        if (altAttr) {
                            const txt = altAttr.trim();
                            if (txt) {
                                pageBreakNeedsDeepDive = false;
                                const lang = getLanguage(childElement);
                                const dir = undefined;
                                ttsQueue.push({
                                    combinedText: txt,
                                    combinedTextSentences: undefined,
                                    combinedTextSentencesRangeBegin: undefined,
                                    combinedTextSentencesRangeEnd: undefined,
                                    dir,
                                    lang,
                                    parentElement: childElement,
                                    textNodes: [],
                                });
                            }
                        }
                        else {
                            altAttr = childElement.getAttribute("aria-label");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    pageBreakNeedsDeepDive = false;
                                    const lang = getLanguage(childElement);
                                    const dir = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                        }
                    }
                    const isLink = childTagNameLow === "a" && childElement.href;
                    let linkNeedsDeepDive = isLink && !hidden;
                    if (linkNeedsDeepDive) {
                        let altAttr = childElement.getAttribute("title");
                        if (altAttr) {
                            const txt = altAttr.trim();
                            if (txt) {
                                linkNeedsDeepDive = false;
                                const lang = getLanguage(childElement);
                                const dir = undefined;
                                ttsQueue.push({
                                    combinedText: txt,
                                    combinedTextSentences: undefined,
                                    combinedTextSentencesRangeBegin: undefined,
                                    combinedTextSentencesRangeEnd: undefined,
                                    dir,
                                    lang,
                                    parentElement: childElement,
                                    textNodes: [],
                                });
                            }
                        }
                        else {
                            altAttr = childElement.getAttribute("aria-label");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    linkNeedsDeepDive = false;
                                    const lang = getLanguage(childElement);
                                    const dir = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                        }
                    }
                    const isMathJax = childTagNameLow && childTagNameLow.startsWith("mjx-");
                    const isMathML = childTagNameLow === "math";
                    const processDeepChild = pageBreakNeedsDeepDive ||
                        linkNeedsDeepDive ||
                        (!isPageBreak &&
                            !isLink &&
                            !isMathJax &&
                            !isMathML &&
                            !childElement.matches("svg, img, sup, sub, audio, video, source, button, canvas, del, dialog, embed, form, head, iframe, meter, noscript, object, s, script, select, style, textarea"));
                    if (processDeepChild) {
                        processElement(childElement);
                    }
                    else if (!hidden) {
                        if (isPageBreak || isLink) {
                        }
                        else if (isMathML) {
                            const altAttr = childElement.getAttribute("alttext");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    const lang = getLanguage(childElement);
                                    const dir = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                            else {
                                const txt = (_a = childElement.textContent) === null || _a === void 0 ? void 0 : _a.trim();
                                if (txt) {
                                    const lang = getLanguage(childElement);
                                    const dir = getDirection(childElement);
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                        }
                        else if (isMathJax) {
                            if (childTagNameLow === "mjx-container") {
                                let mathJaxEl;
                                let mathJaxElMathML;
                                const mathJaxContainerChildren = Array.from(childElement.children);
                                for (const mathJaxContainerChild of mathJaxContainerChildren) {
                                    if (((_b = mathJaxContainerChild.tagName) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "mjx-math") {
                                        mathJaxEl = mathJaxContainerChild;
                                    }
                                    else if (((_c = mathJaxContainerChild.tagName) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === "mjx-assistive-mml") {
                                        const mathJaxAMMLChildren = Array.from(mathJaxContainerChild.children);
                                        for (const mathJaxAMMLChild of mathJaxAMMLChildren) {
                                            if (((_d = mathJaxAMMLChild.tagName) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === "math") {
                                                mathJaxElMathML = mathJaxAMMLChild;
                                                break;
                                            }
                                        }
                                    }
                                }
                                const altAttr = childElement.getAttribute("aria-label");
                                if (altAttr) {
                                    const txt = altAttr.trim();
                                    if (txt) {
                                        const lang = getLanguage(childElement);
                                        const dir = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir,
                                            lang,
                                            parentElement: mathJaxEl !== null && mathJaxEl !== void 0 ? mathJaxEl : childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                                else if (mathJaxElMathML) {
                                    const altAttr = mathJaxElMathML.getAttribute("alttext");
                                    if (altAttr) {
                                        const txt = altAttr.trim();
                                        if (txt) {
                                            const lang = getLanguage(mathJaxElMathML);
                                            const dir = undefined;
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir,
                                                lang,
                                                parentElement: mathJaxEl !== null && mathJaxEl !== void 0 ? mathJaxEl : childElement,
                                                textNodes: [],
                                            });
                                        }
                                    }
                                    else {
                                        const txt = (_e = mathJaxElMathML.textContent) === null || _e === void 0 ? void 0 : _e.trim();
                                        if (txt) {
                                            const lang = getLanguage(mathJaxElMathML);
                                            const dir = getDirection(mathJaxElMathML);
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir,
                                                lang,
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
                            let altAttr = childElement.getAttribute("alt");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    const lang = getLanguage(childElement);
                                    const dir = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                            else {
                                altAttr = childElement.getAttribute("aria-label");
                                if (altAttr) {
                                    const txt = altAttr.trim();
                                    if (txt) {
                                        const lang = getLanguage(childElement);
                                        const dir = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir,
                                            lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                        });
                                    }
                                }
                            }
                        }
                        else if (childTagNameLow === "svg") {
                            const altAttr = childElement.getAttribute("aria-label");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    const lang = getLanguage(childElement);
                                    const dir = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                    });
                                }
                            }
                            else {
                                const svgChildren = Array.from(childElement.children);
                                for (const svgChild of svgChildren) {
                                    if (((_f = svgChild.tagName) === null || _f === void 0 ? void 0 : _f.toLowerCase()) === "title") {
                                        const txt = (_g = svgChild.textContent) === null || _g === void 0 ? void 0 : _g.trim();
                                        if (txt) {
                                            const lang = getLanguage(svgChild);
                                            const dir = getDirection(svgChild);
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir,
                                                lang,
                                                parentElement: childElement,
                                                textNodes: [],
                                            });
                                        }
                                        break;
                                    }
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
        if (putInElementStack) {
            elementStack.pop();
        }
    }
    processElement(rootElement);
    function finalizeTextNodes(ttsQueueItem) {
        if (!ttsQueueItem.textNodes || !ttsQueueItem.textNodes.length) {
            if (!ttsQueueItem.combinedText || !ttsQueueItem.combinedText.length) {
                ttsQueueItem.combinedText = "";
            }
            ttsQueueItem.combinedTextSentences = undefined;
            return;
        }
        ttsQueueItem.combinedText = combineTextNodes(ttsQueueItem.textNodes, true).replace(/[\r\n]/g, " ");
        let skipSplitSentences = false;
        let parent = ttsQueueItem.parentElement;
        while (parent) {
            if (parent.tagName) {
                const tag = parent.tagName.toLowerCase();
                if (tag === "pre" || tag === "code" ||
                    tag === "video" || tag === "audio") {
                    skipSplitSentences = true;
                    break;
                }
            }
            parent = parent.parentElement;
        }
        if (splitSentences && !skipSplitSentences) {
            try {
                const txt = ttsQueueItem.combinedText;
                ttsQueueItem.combinedTextSentences = undefined;
                const sentences = (0, sentence_splitter_1.split)(txt);
                ttsQueueItem.combinedTextSentences = [];
                ttsQueueItem.combinedTextSentencesRangeBegin = [];
                ttsQueueItem.combinedTextSentencesRangeEnd = [];
                for (const sentence of sentences) {
                    if (sentence.type === "Sentence") {
                        ttsQueueItem.combinedTextSentences.push(sentence.raw);
                        ttsQueueItem.combinedTextSentencesRangeBegin.push(sentence.range[0]);
                        ttsQueueItem.combinedTextSentencesRangeEnd.push(sentence.range[1]);
                    }
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
    for (const ttsQueueItem of ttsQueue) {
        finalizeTextNodes(ttsQueueItem);
    }
    return ttsQueue;
}
exports.generateTtsQueue = generateTtsQueue;
//# sourceMappingURL=dom-text-utils.js.map