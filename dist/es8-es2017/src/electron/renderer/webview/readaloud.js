"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsPlayQueueIndex = exports.ttsPreviewAndEventuallyPlayQueueIndex = exports.ttsPrevious = exports.ttsNext = exports.ttsQueueCurrentText = exports.ttsQueueCurrentIndex = exports.ttsQueueSize = exports.ttsPauseOrResume = exports.isTtsActive = exports.isTtsPlaying = exports.ttsResume = exports.ttsPlaybackRate = exports.ttsVoice = exports.ttsPause = exports.ttsStop = exports.ttsPlay = void 0;
const debounce = require("debounce");
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const highlight_1 = require("../../common/highlight");
const styles_1 = require("../../common/styles");
const animateProperty_1 = require("../common/animateProperty");
const dom_text_utils_1 = require("../common/dom-text-utils");
const easings_1 = require("../common/easings");
const popup_dialog_1 = require("../common/popup-dialog");
const highlight_2 = require("./highlight");
const readium_css_1 = require("./readium-css");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const win = global.window;
let _dialogState;
function resetState(stop) {
    if (stop) {
        _resumableState = undefined;
    }
    if (_dialogState) {
        if (_dialogState.hasAttribute("open") || _dialogState.open) {
            console.log("...DIALOG close() from TTS resetState()");
            _dialogState.close();
        }
        _dialogState.popDialog = undefined;
        _dialogState.focusScrollRaw = undefined;
        _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable = undefined;
        _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable = undefined;
        _dialogState.ttsRootElement = undefined;
        _dialogState.ttsQueue = undefined;
        _dialogState.ttsQueueLength = -1;
        _dialogState.ttsUtterance = undefined;
        _dialogState.ttsQueueItem = undefined;
        _dialogState.domSlider = undefined;
        _dialogState.domNext = undefined;
        _dialogState.domPrevious = undefined;
        _dialogState.domText = undefined;
        _dialogState.ttsOverlayEnabled = win.READIUM2.ttsOverlayEnabled;
        _dialogState.remove();
    }
    _dialogState = undefined;
    win.document.documentElement.classList.remove(styles_1.TTS_CLASS_IS_ACTIVE);
    if (stop || !_resumableState) {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_STOPPED);
        win.READIUM2.ttsClickEnabled = false;
        win.document.documentElement.classList.remove(styles_1.TTS_CLASS_PLAYING, styles_1.TTS_CLASS_PAUSED);
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_STOPPED);
    }
    else {
        win.READIUM2.ttsClickEnabled = true;
        win.document.documentElement.classList.remove(styles_1.TTS_CLASS_PLAYING, styles_1.TTS_CLASS_STOPPED);
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_PAUSED);
    }
    (0, readium_css_1.clearImageZoomOutlineDebounced)();
}
function documentForward(node) {
    if (node.firstChild) {
        return node.firstChild;
    }
    let n = node;
    while (!n.nextSibling) {
        n = n.parentNode;
        if (!n) {
            return null;
        }
    }
    return n.nextSibling;
}
function ttsPlay(speed, voice, focusScrollRaw, rootElem, startElem, startTextNode, startTextNodeOffset, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    ttsStop();
    let rootEl = rootElem;
    if (!rootEl) {
        rootEl = win.document.body;
    }
    const splitSentences = win.READIUM2.ttsSentenceDetectionEnabled;
    const ttsQueue = (0, dom_text_utils_1.generateTtsQueue)(rootEl, splitSentences);
    if (!ttsQueue.length) {
        return;
    }
    let ttsQueueIndex = -1;
    if (startElem) {
        let idx = (0, dom_text_utils_1.findTtsQueueItemIndex)(ttsQueue, startElem, startTextNode, startTextNodeOffset, rootEl);
        if (idx >= 0) {
            ttsQueueIndex = idx;
        }
        else {
            let nextEl = startElem;
            while (nextEl = documentForward(nextEl)) {
                if (nextEl.nodeType !== Node.ELEMENT_NODE) {
                    continue;
                }
                idx = (0, dom_text_utils_1.findTtsQueueItemIndex)(ttsQueue, nextEl, undefined, 0, rootEl);
                if (idx >= 0) {
                    ttsQueueIndex = idx;
                    break;
                }
            }
        }
    }
    if (ttsQueueIndex < 0) {
        ttsQueueIndex = 0;
    }
    setTimeout(() => {
        startTTSSession(speed, voice, rootEl, ttsQueue, ttsQueueIndex, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
    }, 100);
}
exports.ttsPlay = ttsPlay;
function ttsStop() {
    ttsPause(true);
    resetState(true);
}
exports.ttsStop = ttsStop;
function ttsPause(doNotReset = false) {
    highlights(false);
    if (win.speechSynthesis.speaking) {
        if (_dialogState && _dialogState.ttsUtterance) {
            _dialogState.ttsUtterance.r2_cancel = true;
        }
        setTimeout(() => {
            win.speechSynthesis.cancel();
        }, 0);
    }
    else if (win.speechSynthesis.pending) {
        if (_dialogState && _dialogState.ttsUtterance) {
            _dialogState.ttsUtterance.r2_cancel = true;
        }
        setTimeout(() => {
            win.speechSynthesis.cancel();
        }, 0);
    }
    win.document.documentElement.classList.remove(styles_1.TTS_CLASS_PLAYING, styles_1.TTS_CLASS_STOPPED);
    win.document.documentElement.classList.add(styles_1.TTS_CLASS_PAUSED);
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PAUSED);
    win.READIUM2.ttsClickEnabled = true;
    (0, readium_css_1.clearImageZoomOutlineDebounced)();
    const isOpen = (_dialogState === null || _dialogState === void 0 ? void 0 : _dialogState.hasAttribute("open")) || (_dialogState === null || _dialogState === void 0 ? void 0 : _dialogState.open);
    if ((0, popup_dialog_1.isPopupDialogOpen)(win.document) && isOpen) {
        const diagEl = win.document.getElementById(styles_1.POPUP_DIALOG_CLASS);
        if (diagEl) {
            const isCollapsed = diagEl.classList.contains(styles_1.POPUP_DIALOG_CLASS_COLLAPSE);
            if (!isCollapsed) {
                doNotReset = true;
            }
        }
    }
    if (!doNotReset) {
        if (isOpen) {
            console.log("...DIALOG close() from TTS ttsPause()");
            _dialogState === null || _dialogState === void 0 ? void 0 : _dialogState.close();
        }
    }
}
exports.ttsPause = ttsPause;
function ttsVoice(voice) {
    win.READIUM2.ttsVoice = voice;
    if (_dialogState) {
        const resumableState = _resumableState;
        ttsStop();
        setTimeout(() => {
            _resumableState = resumableState;
            ttsResume();
        }, 60);
    }
}
exports.ttsVoice = ttsVoice;
function ttsPlaybackRate(speed) {
    win.READIUM2.ttsPlaybackRate = speed;
    if (_dialogState) {
        ttsPause(true);
        if (_dialogState === null || _dialogState === void 0 ? void 0 : _dialogState.ttsUtterance) {
            _dialogState.ttsUtterance.rate = speed;
        }
        setTimeout(() => {
            ttsResume();
        }, 60);
    }
}
exports.ttsPlaybackRate = ttsPlaybackRate;
let _resumableState;
function ttsResume() {
    if (_dialogState &&
        _dialogState.ttsUtterance) {
        highlights(true);
        setTimeout(() => {
            if (_dialogState &&
                _dialogState.ttsUtterance) {
                _dialogState.ttsUtterance.r2_cancel = false;
                win.speechSynthesis.speak(_dialogState.ttsUtterance);
            }
        }, 0);
        win.document.documentElement.classList.remove(styles_1.TTS_CLASS_PAUSED, styles_1.TTS_CLASS_STOPPED);
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_PLAYING);
        if (_dialogState && _dialogState.ttsOverlayEnabled) {
            win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
        }
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
        win.READIUM2.ttsClickEnabled = true;
        (0, readium_css_1.clearImageZoomOutlineDebounced)();
    }
    else if (_resumableState) {
        setTimeout(() => {
            if (_resumableState) {
                startTTSSession(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice, _resumableState.ttsRootElement, _resumableState.ttsQueue, _resumableState.ttsQueueIndex, _resumableState.focusScrollRaw, _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
            }
        }, 100);
    }
}
exports.ttsResume = ttsResume;
function isTtsPlaying() {
    return isTtsActive() && !win.speechSynthesis.paused;
}
exports.isTtsPlaying = isTtsPlaying;
function isTtsActive() {
    if (_dialogState && (_dialogState.hasAttribute("open") || _dialogState.open) &&
        (win.speechSynthesis.speaking || win.speechSynthesis.pending)) {
        return true;
    }
    return false;
}
exports.isTtsActive = isTtsActive;
function ttsPauseOrResume() {
    if (isTtsPlaying()) {
        ttsPause();
    }
    else {
        ttsResume();
    }
}
exports.ttsPauseOrResume = ttsPauseOrResume;
function ttsQueueSize() {
    if (_dialogState && _dialogState.ttsQueue) {
        (0, dom_text_utils_1.getTtsQueueLength)(_dialogState.ttsQueue);
    }
    return -1;
}
exports.ttsQueueSize = ttsQueueSize;
function ttsQueueCurrentIndex() {
    if (_dialogState && _dialogState.ttsQueueItem) {
        return _dialogState.ttsQueueItem.iGlobal;
    }
    return -1;
}
exports.ttsQueueCurrentIndex = ttsQueueCurrentIndex;
function ttsQueueCurrentText() {
    if (_dialogState && _dialogState.ttsQueueItem) {
        return (0, dom_text_utils_1.getTtsQueueItemRefText)(_dialogState.ttsQueueItem);
    }
    return undefined;
}
exports.ttsQueueCurrentText = ttsQueueCurrentText;
function ttsNext(skipSentences = false) {
    if (_dialogState && _dialogState.ttsQueueItem) {
        let j = _dialogState.ttsQueueItem.iGlobal + 1;
        if (skipSentences &&
            _dialogState.ttsQueueItem.iSentence !== -1 &&
            _dialogState.ttsQueueItem.item.combinedTextSentences) {
            j = _dialogState.ttsQueueItem.iGlobal +
                (_dialogState.ttsQueueItem.item.combinedTextSentences.length -
                    _dialogState.ttsQueueItem.iSentence);
        }
        if (j >= _dialogState.ttsQueueLength || j < 0) {
            ttsStop();
            setTimeout(() => {
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_DOC_END);
            }, 400);
            return;
        }
        ttsPause(true);
        ttsPlayQueueIndexDebounced(j);
    }
    else if (_resumableState) {
        ttsResume();
    }
}
exports.ttsNext = ttsNext;
function ttsPrevious(skipSentences = false) {
    if (_dialogState && _dialogState.ttsQueueItem) {
        let j = _dialogState.ttsQueueItem.iGlobal - 1;
        if (skipSentences &&
            _dialogState.ttsQueueItem.iSentence !== -1 &&
            _dialogState.ttsQueueItem.item.combinedTextSentences) {
            j = _dialogState.ttsQueueItem.iGlobal - _dialogState.ttsQueueItem.iSentence - 1;
        }
        if (j >= _dialogState.ttsQueueLength || j < 0) {
            ttsStop();
            setTimeout(() => {
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_DOC_BACK);
            }, 400);
            return;
        }
        ttsPause(true);
        ttsPlayQueueIndexDebounced(j);
    }
    else if (_resumableState) {
        ttsResume();
    }
}
exports.ttsPrevious = ttsPrevious;
function ttsPreviewAndEventuallyPlayQueueIndex(n) {
    ttsPause(true);
    ttsPlayQueueIndexDebounced(n);
}
exports.ttsPreviewAndEventuallyPlayQueueIndex = ttsPreviewAndEventuallyPlayQueueIndex;
function throttle(fn, time) {
    let called = false;
    let lastCalled;
    const func = (...args) => {
        if (!called) {
            fn(...args);
            called = true;
            setTimeout(() => {
                called = false;
                if (lastCalled) {
                    const argos = lastCalled;
                    lastCalled = undefined;
                    func(...argos);
                }
            }, time);
        }
        else {
            lastCalled = args;
        }
    };
    return func;
}
const focusScrollImmediate = throttle((el, doFocus, animate, domRect) => {
    if (_dialogState && _dialogState.focusScrollRaw) {
        _dialogState.focusScrollRaw(el, doFocus, animate, domRect);
    }
}, 500);
const isOnlyWhiteSpace = (str) => {
    for (let i = 0; i < str.length; i++) {
        if (str[i] !== " " &&
            str[i] !== "\t" &&
            str[i] !== "\n" &&
            str[i] !== "\r") {
            return false;
        }
    }
    return true;
};
let _ttsQueueItemHighlightsSentence;
let _ttsQueueItemHighlightsWord;
function wrapHighlightWord(ttsQueueItemRef, utteranceText, charIndex, charLength) {
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }
    if (_ttsQueueItemHighlightsWord) {
        _ttsQueueItemHighlightsWord.forEach((highlight) => {
            if (highlight) {
                (0, highlight_2.destroyHighlight)(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsWord = undefined;
    }
    const ttsQueueItem = ttsQueueItemRef.item;
    let txtToCheck = ttsQueueItemRef.item.combinedText;
    let charIndexAdjusted = charIndex;
    if (ttsQueueItem.combinedTextSentences &&
        ttsQueueItem.combinedTextSentencesRangeBegin &&
        ttsQueueItem.combinedTextSentencesRangeEnd &&
        ttsQueueItemRef.iSentence >= 0) {
        const sentOffset = ttsQueueItem.combinedTextSentencesRangeBegin[ttsQueueItemRef.iSentence];
        charIndexAdjusted += sentOffset;
        txtToCheck = ttsQueueItem.combinedTextSentences[ttsQueueItemRef.iSentence];
    }
    if (IS_DEV) {
        if (utteranceText !== txtToCheck) {
            console.log("TTS utteranceText DIFF?? ", `[[${utteranceText}]]`, `[[${txtToCheck}]]`);
        }
    }
    let acc = 0;
    let rangeStartNode;
    let rangeStartOffset = -1;
    let rangeEndNode;
    let rangeEndOffset = -1;
    const charIndexEnd = charIndexAdjusted + charLength;
    for (const txtNode of ttsQueueItem.textNodes) {
        if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
            continue;
        }
        const l = isOnlyWhiteSpace(txtNode.nodeValue) ? 1 : txtNode.nodeValue.length;
        acc += l;
        if (!rangeStartNode) {
            if (charIndexAdjusted < acc) {
                rangeStartNode = txtNode;
                rangeStartOffset = l - (acc - charIndexAdjusted);
            }
        }
        if (rangeStartNode && charIndexEnd <= acc) {
            rangeEndNode = txtNode;
            rangeEndOffset = l - (acc - charIndexEnd);
            break;
        }
    }
    if (rangeStartNode && rangeEndNode) {
        const range = new Range();
        range.setStart(rangeStartNode, rangeStartOffset);
        range.setEnd(rangeEndNode, rangeEndOffset);
        if (_dialogState && _dialogState.focusScrollRaw) {
            const domRect = range.getBoundingClientRect();
            focusScrollImmediate(ttsQueueItemRef.item.parentElement, false, true, domRect);
        }
        const highlightDefinitions = [
            {
                color: {
                    blue: 0,
                    green: 147,
                    red: 255,
                },
                drawType: highlight_1.HighlightDrawTypeUnderline,
                expand: 2,
                selectionInfo: undefined,
                group: "tts",
                range,
            },
        ];
        _ttsQueueItemHighlightsWord = (0, highlight_2.createHighlights)(win, highlightDefinitions, false);
    }
}
function wrapHighlight(doHighlight, ttsQueueItemRef) {
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }
    if (_ttsQueueItemHighlightsWord) {
        _ttsQueueItemHighlightsWord.forEach((highlight) => {
            if (highlight) {
                (0, highlight_2.destroyHighlight)(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsWord = undefined;
    }
    if (_ttsQueueItemHighlightsSentence) {
        _ttsQueueItemHighlightsSentence.forEach((highlight) => {
            if (highlight) {
                (0, highlight_2.destroyHighlight)(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsSentence = undefined;
    }
    const ttsQueueItem = ttsQueueItemRef.item;
    if (doHighlight &&
        ttsQueueItem.parentElement) {
        let range;
        if (!ttsQueueItem.textNodes || !ttsQueueItem.textNodes.length) {
            range = new Range();
            range.selectNode(ttsQueueItem.parentElement);
        }
        else if (ttsQueueItem.combinedTextSentences &&
            ttsQueueItem.combinedTextSentencesRangeBegin &&
            ttsQueueItem.combinedTextSentencesRangeEnd &&
            ttsQueueItemRef.iSentence >= 0) {
            const sentBegin = ttsQueueItem.combinedTextSentencesRangeBegin[ttsQueueItemRef.iSentence];
            const sentEnd = ttsQueueItem.combinedTextSentencesRangeEnd[ttsQueueItemRef.iSentence];
            let acc = 0;
            let rangeStartNode;
            let rangeStartOffset = -1;
            let rangeEndNode;
            let rangeEndOffset = -1;
            for (const txtNode of ttsQueueItemRef.item.textNodes) {
                if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                    continue;
                }
                const l = isOnlyWhiteSpace(txtNode.nodeValue) ? 1 : txtNode.nodeValue.length;
                acc += l;
                if (!rangeStartNode) {
                    if (sentBegin < acc) {
                        rangeStartNode = txtNode;
                        rangeStartOffset = l - (acc - sentBegin);
                    }
                }
                if (rangeStartNode && sentEnd <= acc) {
                    rangeEndNode = txtNode;
                    rangeEndOffset = l - (acc - sentEnd);
                    break;
                }
            }
            if (rangeStartNode && rangeEndNode) {
                range = new Range();
                range.setStart(rangeStartNode, rangeStartOffset);
                range.setEnd(rangeEndNode, rangeEndOffset);
            }
        }
        else {
            range = new Range();
            const firstTextNode = ttsQueueItem.textNodes[0];
            if (!firstTextNode.nodeValue && firstTextNode.nodeValue !== "") {
                return;
            }
            range.setStart(firstTextNode, isOnlyWhiteSpace(firstTextNode.nodeValue) ? firstTextNode.nodeValue.length - 1 : 0);
            const lastTextNode = ttsQueueItem.textNodes[ttsQueueItem.textNodes.length - 1];
            if (!lastTextNode.nodeValue && lastTextNode.nodeValue !== "") {
                return;
            }
            range.setEnd(lastTextNode, isOnlyWhiteSpace(lastTextNode.nodeValue) ? 1 : lastTextNode.nodeValue.length);
        }
        if (range) {
            if (_dialogState && _dialogState.focusScrollRaw) {
                const domRect = range.getBoundingClientRect();
                focusScrollImmediate(ttsQueueItemRef.item.parentElement, false, true, domRect);
            }
            const highlightDefinitions = [
                {
                    color: {
                        blue: 116,
                        green: 248,
                        red: 248,
                    },
                    drawType: highlight_1.HighlightDrawTypeBackground,
                    expand: 4,
                    selectionInfo: undefined,
                    group: "tts",
                    range,
                },
            ];
            _ttsQueueItemHighlightsSentence = (0, highlight_2.createHighlights)(win, highlightDefinitions, false);
        }
    }
}
function highlights(doHighlight) {
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }
    if (!_dialogState) {
        return;
    }
    if (doHighlight) {
        if (_dialogState.ttsQueueItem) {
            wrapHighlight(true, _dialogState.ttsQueueItem);
        }
        if (win.READIUM2.DEBUG_VISUALS &&
            _dialogState.ttsRootElement) {
            _dialogState.ttsRootElement.classList.add(styles_1.TTS_ID_SPEAKING_DOC_ELEMENT);
        }
    }
    else {
        if (_dialogState.ttsQueueItem) {
            wrapHighlight(false, _dialogState.ttsQueueItem);
        }
        if (_dialogState.ttsRootElement) {
            _dialogState.ttsRootElement.classList.remove(styles_1.TTS_ID_SPEAKING_DOC_ELEMENT);
        }
    }
}
let _lastAnimState;
const animationTime = 400;
const scrollIntoViewSpokenTextDebounced = debounce((id) => {
    scrollIntoViewSpokenText(id);
}, 200);
function scrollIntoViewSpokenText(id) {
    const reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
    const span = win.document.getElementById(id);
    if (span && _dialogState && _dialogState.domText) {
        const rect = span.getBoundingClientRect();
        const rect2 = _dialogState.domText.getBoundingClientRect();
        const scrollTopMax = _dialogState.domText.scrollHeight - _dialogState.domText.clientHeight;
        let offset = _dialogState.domText.scrollTop + (rect.top - rect2.top - (_dialogState.domText.clientHeight / 2));
        if (offset > scrollTopMax) {
            offset = scrollTopMax;
        }
        else if (offset < 0) {
            offset = 0;
        }
        const diff = Math.abs(_dialogState.domText.scrollTop - offset);
        if (diff < 20) {
            return;
        }
        if (_lastAnimState && _lastAnimState.animating) {
            win.cancelAnimationFrame(_lastAnimState.id);
            _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
        }
        const targetObj = _dialogState.domText;
        const targetProp = "scrollTop";
        if (reduceMotion) {
            _lastAnimState = undefined;
            targetObj[targetProp] = offset;
        }
        else {
            _lastAnimState = (0, animateProperty_1.animateProperty)(win.cancelAnimationFrame, undefined, targetProp, animationTime, targetObj, offset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
        }
    }
}
const R2_DATA_ATTR_UTTERANCE_INDEX = "data-r2-tts-utterance-index";
function updateTTSInfo(charIndex, charLength, utteranceText) {
    if (!_dialogState || !_dialogState.hasAttribute("open") || !_dialogState.open || !_dialogState.domText ||
        !_dialogState.ttsQueue || !_dialogState.ttsQueueItem) {
        return undefined;
    }
    const ttsQueueItem = _dialogState.ttsQueueItem;
    if (!ttsQueueItem) {
        return undefined;
    }
    const isWordBoundary = charIndex >= 0 && utteranceText;
    if (_dialogState.ttsOverlayEnabled &&
        !isWordBoundary &&
        _dialogState.focusScrollRaw &&
        ttsQueueItem.item.parentElement) {
        _dialogState.focusScrollRaw(ttsQueueItem.item.parentElement, false, true, undefined);
    }
    const ttsQueueItemText = utteranceText ? utteranceText : (0, dom_text_utils_1.getTtsQueueItemRefText)(ttsQueueItem);
    if (!ttsQueueItemText.trim().length) {
        return "";
    }
    let ttsQueueItemMarkup = (0, dom_text_utils_1.normalizeHtmlText)(ttsQueueItemText);
    if (isWordBoundary) {
        const word = utteranceText.substr(charIndex, charLength);
        if (_dialogState && _dialogState.ttsOverlayEnabled) {
            const prefix = `<span id="${styles_1.TTS_ID_ACTIVE_WORD}">`;
            const suffix = "</span>";
            const before = utteranceText.substr(0, charIndex);
            const after = utteranceText.substr(charIndex + charLength);
            const l = before.length + word.length + after.length;
            ttsQueueItemMarkup = (l === utteranceText.length) ?
                `${(0, dom_text_utils_1.normalizeHtmlText)(before)}${prefix}${(0, dom_text_utils_1.normalizeHtmlText)(word)}${suffix}${(0, dom_text_utils_1.normalizeHtmlText)(after)}` :
                (0, dom_text_utils_1.normalizeHtmlText)(utteranceText);
        }
        else {
            wrapHighlightWord(ttsQueueItem, utteranceText, charIndex, charLength);
        }
    }
    if (!(_dialogState && _dialogState.ttsOverlayEnabled)) {
        return ttsQueueItemText;
    }
    let activeUtteranceElem = _dialogState.domText.ownerDocument ?
        _dialogState.domText.ownerDocument.getElementById(styles_1.TTS_ID_ACTIVE_UTTERANCE) :
        _dialogState.domText.querySelector(`#${styles_1.TTS_ID_ACTIVE_UTTERANCE}`);
    if (activeUtteranceElem) {
        const indexStr = activeUtteranceElem.getAttribute(R2_DATA_ATTR_UTTERANCE_INDEX);
        if (indexStr && indexStr !== `${ttsQueueItem.iGlobal}`) {
            activeUtteranceElem.removeAttribute("id");
            const activeWordElem = activeUtteranceElem.ownerDocument ?
                activeUtteranceElem.ownerDocument.getElementById(styles_1.TTS_ID_ACTIVE_WORD) :
                activeUtteranceElem.querySelector(`#${styles_1.TTS_ID_ACTIVE_WORD}`);
            if (activeWordElem) {
                const index = parseInt(indexStr, 10);
                if (!isNaN(index)) {
                    const ttsQItem = (0, dom_text_utils_1.getTtsQueueItemRef)(_dialogState.ttsQueue, index);
                    if (ttsQItem) {
                        const txt = (0, dom_text_utils_1.getTtsQueueItemRefText)(ttsQItem);
                        try {
                            activeUtteranceElem.innerHTML = (0, dom_text_utils_1.normalizeHtmlText)(txt);
                        }
                        catch (err) {
                            console.log(err);
                            console.log(txt);
                            activeUtteranceElem.innerHTML = "txt";
                        }
                    }
                }
            }
            activeUtteranceElem = _dialogState.domText.querySelector(`[${R2_DATA_ATTR_UTTERANCE_INDEX}="${ttsQueueItem.iGlobal}"]`);
            if (activeUtteranceElem) {
                activeUtteranceElem.setAttribute("id", styles_1.TTS_ID_ACTIVE_UTTERANCE);
            }
        }
        if (activeUtteranceElem) {
            try {
                activeUtteranceElem.innerHTML = ttsQueueItemMarkup;
            }
            catch (err) {
                console.log(err);
                console.log(ttsQueueItemMarkup);
                activeUtteranceElem.innerHTML = "ttsQueueItemMarkup";
            }
        }
    }
    else {
        let fullMarkup = "";
        for (let i = 0; i < _dialogState.ttsQueueLength; i++) {
            const ttsQItem = (0, dom_text_utils_1.getTtsQueueItemRef)(_dialogState.ttsQueue, i);
            if (!ttsQItem) {
                continue;
            }
            let ttsQItemMarkup = ttsQueueItemMarkup;
            let isHeadingLevel1 = false;
            let isHeadingLevel2 = false;
            let isHeadingLevel3 = false;
            let isHeadingLevel4 = false;
            let isHeadingLevel5 = false;
            let p = ttsQItem.item.parentElement;
            while (p && p.tagName) {
                const tagName = p.tagName.toLowerCase();
                if (tagName === "h1") {
                    isHeadingLevel1 = true;
                    break;
                }
                else if (tagName === "h2") {
                    isHeadingLevel2 = true;
                    break;
                }
                else if (tagName === "h3") {
                    isHeadingLevel3 = true;
                    break;
                }
                else if (tagName === "h4") {
                    isHeadingLevel4 = true;
                    break;
                }
                else if (tagName === "h5") {
                    isHeadingLevel5 = true;
                    break;
                }
                p = p.parentNode;
            }
            const classes = styles_1.TTS_CLASS_UTTERANCE +
                (isHeadingLevel1 ? ` ${styles_1.TTS_CLASS_UTTERANCE_HEADING1}` :
                    (isHeadingLevel2 ? ` ${styles_1.TTS_CLASS_UTTERANCE_HEADING2}` :
                        (isHeadingLevel3 ? ` ${styles_1.TTS_CLASS_UTTERANCE_HEADING3}` :
                            (isHeadingLevel4 ? ` ${styles_1.TTS_CLASS_UTTERANCE_HEADING4}` :
                                (isHeadingLevel5 ? ` ${styles_1.TTS_CLASS_UTTERANCE_HEADING5}` : "")))));
            let ttsQItemMarkupAttributes = `${R2_DATA_ATTR_UTTERANCE_INDEX}="${ttsQItem.iGlobal}" class="${classes}"`;
            if (ttsQItem.iGlobal === ttsQueueItem.iGlobal) {
                ttsQItemMarkupAttributes += ` id="${styles_1.TTS_ID_ACTIVE_UTTERANCE}" `;
            }
            else {
                ttsQItemMarkup = (0, dom_text_utils_1.normalizeHtmlText)((0, dom_text_utils_1.getTtsQueueItemRefText)(ttsQItem));
            }
            let imageMarkup = "";
            if (ttsQItem.item.parentElement && ttsQItem.item.parentElement.tagName &&
                ttsQItem.item.parentElement.tagName.toLowerCase() === "img" &&
                ttsQItem.item.parentElement.src) {
                imageMarkup = `<img src="${ttsQItem.item.parentElement.src}" />`;
            }
            if (ttsQItem.item.parentElement && ttsQItem.item.parentElement.tagName &&
                ttsQItem.item.parentElement.tagName.toLowerCase() === "svg") {
                imageMarkup = ttsQItem.item.parentElement.outerHTML;
            }
            if (ttsQItem.item.dir) {
                ttsQItemMarkupAttributes += ` dir="${ttsQItem.item.dir}" `;
            }
            if (ttsQItem.item.lang) {
                ttsQItemMarkupAttributes += ` lang="${ttsQItem.item.lang}" xml:lang="${ttsQItem.item.lang}" `;
            }
            if (imageMarkup || (ttsQItemMarkup === null || ttsQItemMarkup === void 0 ? void 0 : ttsQItemMarkup.trim().length)) {
                fullMarkup += `${imageMarkup}<div ${ttsQItemMarkupAttributes}>${ttsQItemMarkup}</div>`;
            }
        }
        try {
            _dialogState.domText.insertAdjacentHTML("beforeend", fullMarkup);
        }
        catch (err) {
            console.log(err);
            console.log(fullMarkup);
            try {
                _dialogState.domText.innerHTML = fullMarkup;
            }
            catch (err) {
                console.log(err);
                console.log(fullMarkup);
                _dialogState.domText.innerHTML = "fullMarkup";
            }
        }
    }
    scrollIntoViewSpokenTextDebounced(isWordBoundary ? styles_1.TTS_ID_ACTIVE_WORD : styles_1.TTS_ID_ACTIVE_UTTERANCE);
    return ttsQueueItemText;
}
const ttsPlayQueueIndexDebounced = debounce((ttsQueueIndex) => {
    ttsPlayQueueIndex(ttsQueueIndex);
}, 150);
function ttsPlayQueueIndex(ttsQueueIndex) {
    var _a;
    if (!_dialogState ||
        !_dialogState.ttsRootElement ||
        !_dialogState.focusScrollRaw ||
        !_dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable ||
        !_dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable ||
        !_dialogState.ttsQueue ||
        !_dialogState.hasAttribute("open") || !_dialogState.open) {
        ttsStop();
        return;
    }
    _dialogState.ttsQueueItem = undefined;
    _dialogState.ttsUtterance = undefined;
    if (_dialogState.domSlider) {
        _dialogState.domSlider.valueAsNumber = ttsQueueIndex;
    }
    if (ttsQueueIndex < 0) {
        ttsStop();
        return;
    }
    if (ttsQueueIndex >= _dialogState.ttsQueueLength) {
        ttsStop();
        setTimeout(() => {
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_DOC_END);
        }, 400);
        return;
    }
    const ttsQueueItem = (0, dom_text_utils_1.getTtsQueueItemRef)(_dialogState.ttsQueue, ttsQueueIndex);
    if (!ttsQueueItem) {
        ttsStop();
        return;
    }
    _dialogState.ttsQueueItem = ttsQueueItem;
    highlights(true);
    const txtStr = updateTTSInfo(-1, -1, undefined);
    if (txtStr === "") {
        highlights(false);
        ttsPlayQueueIndexDebounced(ttsQueueIndex + 1);
        return;
    }
    if (!txtStr) {
        ttsStop();
        return;
    }
    const utterance = new SpeechSynthesisUtterance(txtStr);
    _dialogState.ttsUtterance = utterance;
    utterance.r2_ttsQueueIndex = ttsQueueIndex;
    if (_dialogState.ttsQueueItem.item.lang) {
        utterance.lang = _dialogState.ttsQueueItem.item.lang;
    }
    if (win.READIUM2.ttsPlaybackRate >= 0.1 && win.READIUM2.ttsPlaybackRate <= 10) {
        utterance.rate = win.READIUM2.ttsPlaybackRate;
    }
    utterance.voice = speechSynthesis.getVoices().find((voice) => {
        return win.READIUM2.ttsVoice && (voice.name === win.READIUM2.ttsVoice.name && voice.lang === win.READIUM2.ttsVoice.lang && voice.voiceURI === win.READIUM2.ttsVoice.voiceURI && voice.default === win.READIUM2.ttsVoice.default && voice.localService === win.READIUM2.ttsVoice.localService);
    }) || null;
    if (utterance.lang
        && ((_a = utterance.voice) === null || _a === void 0 ? void 0 : _a.lang)) {
        const utteranceLang = utterance.lang.toLowerCase();
        let utteranceLangShort = utteranceLang;
        const i = utteranceLangShort.indexOf("-");
        const utteranceLangIsSpecific = i > 0;
        if (utteranceLangIsSpecific) {
            utteranceLangShort = utteranceLangShort.substring(0, i);
        }
        const utteranceVoiceLang = utterance.voice.lang.toLowerCase();
        let utteranceVoiceLangShort = utteranceVoiceLang;
        const j = utteranceVoiceLangShort.indexOf("-");
        const utteranceVoiceLangIsSpecific = j > 0;
        if (utteranceVoiceLangIsSpecific) {
            utteranceVoiceLangShort = utteranceVoiceLangShort.substring(0, j);
        }
        if (utteranceLang !== utteranceVoiceLang) {
            let doReset = false;
            if (utteranceVoiceLangShort !== utteranceLangShort) {
                doReset = true;
            }
            else if (utteranceLangIsSpecific) {
            }
            if (doReset) {
                utterance.voice = null;
            }
        }
    }
    utterance.onboundary = (ev) => {
        if (utterance.r2_cancel) {
            return;
        }
        if (!_dialogState || !_dialogState.ttsQueueItem) {
            return;
        }
        if (utterance.r2_ttsQueueIndex !== _dialogState.ttsQueueItem.iGlobal) {
            return;
        }
        if (ev.name !== "word") {
            return;
        }
        updateTTSInfo(ev.charIndex, ev.charLength, utterance.text);
    };
    const onEnd = () => {
        if (utterance.r2_cancel) {
            return;
        }
        if (!_dialogState || !_dialogState.ttsQueueItem) {
            return;
        }
        if (utterance.r2_ttsQueueIndex !== _dialogState.ttsQueueItem.iGlobal) {
            return;
        }
        highlights(false);
        ttsPlayQueueIndexDebounced(ttsQueueIndex + 1);
    };
    utterance.onend = (_ev) => {
        onEnd();
    };
    _resumableState = {
        ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable,
        ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
        focusScrollRaw: _dialogState.focusScrollRaw,
        ttsQueue: _dialogState.ttsQueue,
        ttsQueueIndex: _dialogState.ttsQueueItem.iGlobal,
        ttsRootElement: _dialogState.ttsRootElement,
    };
    utterance.r2_cancel = false;
    setTimeout(() => {
        win.speechSynthesis.speak(utterance);
    }, 0);
    win.document.documentElement.classList.remove(styles_1.TTS_CLASS_PAUSED, styles_1.TTS_CLASS_STOPPED);
    win.document.documentElement.classList.add(styles_1.TTS_CLASS_PLAYING);
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
    win.READIUM2.ttsClickEnabled = true;
    (0, readium_css_1.clearImageZoomOutlineDebounced)();
}
exports.ttsPlayQueueIndex = ttsPlayQueueIndex;
function startTTSSession(speed, voice, ttsRootElement, ttsQueue, ttsQueueIndexStart, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    win.READIUM2.ttsPlaybackRate = speed;
    win.READIUM2.ttsVoice = voice;
    const ttsQueueItemStart = (0, dom_text_utils_1.getTtsQueueItemRef)(ttsQueue, ttsQueueIndexStart);
    if (!ttsQueueItemStart) {
        ttsStop();
        return;
    }
    const ttsQueueLength = (0, dom_text_utils_1.getTtsQueueLength)(ttsQueue);
    const val = win.READIUM2.ttsOverlayEnabled ? ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable() : undefined;
    function onDialogClosed(thiz, el) {
        ttsPause(true);
        if (_dialogState && _dialogState.focusScrollRaw) {
            let toScrollTo = el;
            if (_dialogState.ttsQueueItem && _dialogState.ttsQueueItem.item.parentElement) {
                toScrollTo = _dialogState.ttsQueueItem.item.parentElement;
            }
            if (toScrollTo) {
                _dialogState.focusScrollRaw(toScrollTo, true, false, undefined);
            }
            else if (typeof val !== "undefined") {
                ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
            }
        }
        else if (typeof val !== "undefined") {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
        }
        setTimeout(() => {
            resetState(false);
        }, 50);
        setTimeout(() => {
            if (thiz.clickCloseXY.clickX >= 0 && thiz.clickCloseXY.clickY >= 0) {
                const ev = new MouseEvent("click", {
                    button: 0,
                    buttons: 0,
                    clientX: thiz.clickCloseXY.clickX,
                    clientY: thiz.clickCloseXY.clickY,
                    movementX: thiz.clickCloseXY.clickX,
                    movementY: thiz.clickCloseXY.clickY,
                    relatedTarget: null,
                    screenX: thiz.clickCloseXY.clickX,
                    screenY: thiz.clickCloseXY.clickY,
                    altKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    modifierAltGraph: false,
                    modifierCapsLock: false,
                    modifierFn: false,
                    modifierFnLock: false,
                    modifierHyper: false,
                    modifierNumLock: false,
                    modifierScrollLock: false,
                    modifierSuper: false,
                    modifierSymbol: false,
                    modifierSymbolLock: false,
                    shiftKey: false,
                    detail: 0,
                    view: win.document.defaultView,
                    which: 0,
                });
                win.document.dispatchEvent(ev);
            }
        }, 100);
    }
    const outerHTML = `<div id="${styles_1.TTS_ID_CONTAINER}"
    class="${styles_1.CSS_CLASS_NO_FOCUS_OUTLINE} ${styles_1.TTS_CLASS_THEME1}"
    dir="ltr"
    lang="en"
    xml:lang="en"
    tabindex="0" autofocus="autofocus"></div>
${win.READIUM2.ttsOverlayEnabled ?
        `
<button id="${styles_1.TTS_ID_PREVIOUS}" class="${styles_1.TTS_NAV_BUTTON_CLASS}" title="${(0, readium_css_1.isRTL)() ? "next" : "previous"}"><span>&#9668;</span></button>
<button id="${styles_1.TTS_ID_NEXT}" class="${styles_1.TTS_NAV_BUTTON_CLASS}" title="${(0, readium_css_1.isRTL)() ? "previous" : "next"}"><span>&#9658;</span></button>
<input id="${styles_1.TTS_ID_SLIDER}" type="range" min="0" max="${ttsQueueLength - 1}" value="0"
    ${(0, readium_css_1.isRTL)() ? "dir=\"rtl\"" : "dir=\"ltr\""}  title="progress"/>
`
        : ""}
`;
    const pop = new popup_dialog_1.PopupDialog(win.document, outerHTML, onDialogClosed, `${styles_1.TTS_POPUP_DIALOG_CLASS}${win.READIUM2.ttsOverlayEnabled ? "" : ` ${styles_1.POPUP_DIALOG_CLASS_COLLAPSE}`}`, true);
    pop.show(ttsQueueItemStart.item.parentElement);
    _dialogState = pop.dialog;
    if (!_dialogState) {
        return;
    }
    _dialogState.ttsOverlayEnabled = win.READIUM2.ttsOverlayEnabled;
    _dialogState.focusScrollRaw = focusScrollRaw;
    _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable =
        ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable;
    _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable =
        ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable;
    _dialogState.ttsRootElement = ttsRootElement;
    _dialogState.domSlider = win.document.getElementById(styles_1.TTS_ID_SLIDER);
    _dialogState.domPrevious = win.document.getElementById(styles_1.TTS_ID_PREVIOUS);
    _dialogState.domNext = win.document.getElementById(styles_1.TTS_ID_NEXT);
    _dialogState.domText = win.document.getElementById(styles_1.TTS_ID_CONTAINER);
    _dialogState.ttsQueue = ttsQueue;
    _dialogState.ttsQueueLength = ttsQueueLength;
    if (_dialogState.domSlider) {
        _dialogState.domSlider.addEventListener("input", (_ev) => {
            if (_dialogState && _dialogState.domSlider) {
                const n = _dialogState.domSlider.valueAsNumber;
                ttsPreviewAndEventuallyPlayQueueIndex(n);
            }
        });
    }
    if (_dialogState.domPrevious) {
        _dialogState.domPrevious.addEventListener("click", (ev) => {
            const skipSentences = ev.shiftKey && ev.altKey;
            if ((0, readium_css_1.isRTL)()) {
                ttsNext(skipSentences);
            }
            else {
                ttsPrevious(skipSentences);
            }
        });
    }
    if (_dialogState.domNext) {
        _dialogState.domNext.addEventListener("click", (ev) => {
            const skipSentences = ev.shiftKey && ev.altKey;
            if (!(0, readium_css_1.isRTL)()) {
                ttsNext(skipSentences);
            }
            else {
                ttsPrevious(skipSentences);
            }
        });
    }
    if (_dialogState.domText) {
        _dialogState.domText.addEventListener("click", (ev) => {
            if (ev.target && _dialogState && _dialogState.ttsQueue && _dialogState.ttsQueueItem) {
                const indexStr = ev.target.getAttribute(R2_DATA_ATTR_UTTERANCE_INDEX);
                if (indexStr) {
                    const index = parseInt(indexStr, 10);
                    if (!isNaN(index)) {
                        const ttsQItem = (0, dom_text_utils_1.getTtsQueueItemRef)(_dialogState.ttsQueue, index);
                        if (ttsQItem) {
                            if (ttsQItem.iGlobal !== _dialogState.ttsQueueItem.iGlobal) {
                                ttsPause(true);
                                ttsPlayQueueIndexDebounced(index);
                                return;
                            }
                        }
                    }
                }
            }
            ttsPauseOrResume();
        });
    }
    ttsPlayQueueIndexDebounced(ttsQueueIndexStart);
}
//# sourceMappingURL=readaloud.js.map