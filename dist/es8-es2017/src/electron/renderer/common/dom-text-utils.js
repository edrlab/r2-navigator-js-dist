"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sentence_splitter_1 = require("sentence-splitter");
const cssselector2_1 = require("../common/cssselector2");
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
function normalizeText(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " ").replace(/\s\s+/g, " ");
}
exports.normalizeText = normalizeText;
function consoleLogTtsQueueItem(i) {
    console.log("<<----");
    console.log(i.dir);
    console.log(i.lang);
    const cssSelector = cssselector2_1.uniqueCssSelector(i.parentElement, i.parentElement.ownerDocument);
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
function findTtsQueueItemIndex(ttsQueue, element, rootElem) {
    let i = 0;
    for (const ttsQueueItem of ttsQueue) {
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
    return -1;
}
exports.findTtsQueueItemIndex = findTtsQueueItemIndex;
function generateTtsQueue(rootElement) {
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
        if (element.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        const isIncluded = first || element.matches("h1, h2, h3, h4, h5, h6, p, th, td, caption, li, blockquote, q, dt, dd, figcaption, div, pre");
        first = false;
        if (isIncluded) {
            elementStack.push(element);
        }
        for (const childNode of element.childNodes) {
            switch (childNode.nodeType) {
                case Node.ELEMENT_NODE:
                    const isExcluded = childNode.matches("img, sup, sub, audio, video, source, button, canvas, del, dialog, embed, form, head, iframe, meter, noscript, object, s, script, select, style, textarea");
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
        if (isIncluded) {
            elementStack.pop();
        }
    }
    processElement(rootElement);
    function combineTextNodes(textNodes) {
        if (textNodes && textNodes.length) {
            let str = "";
            for (const textNode of textNodes) {
                if (textNode.nodeValue) {
                    str += normalizeText(textNode.nodeValue);
                }
            }
            return str;
        }
        return "";
    }
    function finalizeTextNodes(ttsQueueItem) {
        ttsQueueItem.combinedText = combineTextNodes(ttsQueueItem.textNodes).trim();
        try {
            const sentences = sentence_splitter_1.split(ttsQueueItem.combinedText);
            ttsQueueItem.combinedTextSentences = [];
            for (const sentence of sentences) {
                if (sentence.type === "Sentence") {
                    ttsQueueItem.combinedTextSentences.push(sentence.raw);
                }
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
    for (const ttsQueueItem of ttsQueue) {
        finalizeTextNodes(ttsQueueItem);
    }
    return ttsQueue;
}
exports.generateTtsQueue = generateTtsQueue;
function wrapHighlight(doHighlight, ttsQueueItemRef, cssClassParent, cssClassSpan, _cssClassSubSpan, word, _start, _end) {
    if (typeof word !== "undefined") {
        return;
    }
    const ttsQueueItem = ttsQueueItemRef.item;
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
    ttsQueueItem.textNodes.forEach((txtNode) => {
        if (!txtNode.parentElement) {
            return;
        }
        if (doHighlight) {
            if (txtNode.parentElement.tagName.toLowerCase() !== "span" ||
                !txtNode.parentElement.classList.contains(cssClassSpan)) {
                const span = txtNode.ownerDocument.createElement("span");
                span.setAttribute("class", cssClassSpan);
                txtNode.parentElement.replaceChild(span, txtNode);
                span.appendChild(txtNode);
            }
        }
        else {
            if (txtNode.parentElement.tagName.toLowerCase() === "span" &&
                txtNode.parentElement.classList.contains(cssClassSpan)) {
                const span = txtNode.parentElement;
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