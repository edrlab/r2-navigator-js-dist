"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsPlayQueueIndex = exports.ttsPreviewAndEventuallyPlayQueueIndex = exports.ttsPrevious = exports.ttsNext = exports.ttsQueueCurrentText = exports.ttsQueueCurrentIndex = exports.ttsQueueSize = exports.ttsPauseOrResume = exports.isTtsActive = exports.isTtsPlaying = exports.ttsResume = exports.ttsPlaybackRate = exports.ttsVoice = exports.ttsPause = exports.ttsStop = exports.ttsPlay = void 0;
var tslib_1 = require("tslib");
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var highlight_1 = require("../../common/highlight");
var styles_1 = require("../../common/styles");
var animateProperty_1 = require("../common/animateProperty");
var cssselector2_1 = require("../common/cssselector2");
var dom_text_utils_1 = require("../common/dom-text-utils");
var easings_1 = require("../common/easings");
var popup_dialog_1 = require("../common/popup-dialog");
var highlight_2 = require("./highlight");
var readium_css_1 = require("./readium-css");
var selection_1 = require("./selection");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var win = global.window;
var _dialogState;
function resetState() {
    _resumableState = undefined;
    if (_dialogState) {
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
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_STOPPED);
}
function ttsPlay(speed, voice, focusScrollRaw, rootElem, startElem, startTextNode, startTextNodeOffset, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    ttsStop();
    var rootEl = rootElem;
    if (!rootEl) {
        rootEl = win.document.body;
    }
    var splitSentences = win.READIUM2.ttsSentenceDetectionEnabled;
    var ttsQueue = dom_text_utils_1.generateTtsQueue(rootEl, splitSentences);
    if (!ttsQueue.length) {
        return;
    }
    var ttsQueueIndex = -1;
    if (startElem) {
        var idx = dom_text_utils_1.findTtsQueueItemIndex(ttsQueue, startElem, startTextNode, startTextNodeOffset, rootEl);
        if (idx >= 0) {
            ttsQueueIndex = idx;
        }
    }
    if (ttsQueueIndex < 0) {
        ttsQueueIndex = 0;
    }
    setTimeout(function () {
        startTTSSession(speed, voice, rootEl, ttsQueue, ttsQueueIndex, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
    }, 100);
}
exports.ttsPlay = ttsPlay;
function ttsStop() {
    if (_dialogState) {
        if (_dialogState.hasAttribute("open")) {
            _dialogState.close();
            return;
        }
    }
    ttsPause();
    resetState();
}
exports.ttsStop = ttsStop;
function ttsPause() {
    highlights(false);
    if (win.speechSynthesis.speaking) {
        if (_dialogState && _dialogState.ttsUtterance) {
            _dialogState.ttsUtterance.r2_cancel = true;
        }
        setTimeout(function () {
            win.speechSynthesis.cancel();
        }, 0);
    }
    else if (win.speechSynthesis.pending) {
        if (_dialogState && _dialogState.ttsUtterance) {
            _dialogState.ttsUtterance.r2_cancel = true;
        }
        setTimeout(function () {
            win.speechSynthesis.cancel();
        }, 0);
    }
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PAUSED);
}
exports.ttsPause = ttsPause;
function ttsVoice(voice) {
    win.READIUM2.ttsVoice = voice;
    if (_dialogState) {
        var resumableState_1 = _resumableState;
        ttsStop();
        setTimeout(function () {
            _resumableState = resumableState_1;
            ttsResume();
        }, 60);
    }
}
exports.ttsVoice = ttsVoice;
function ttsPlaybackRate(speed) {
    win.READIUM2.ttsPlaybackRate = speed;
    if (_dialogState) {
        ttsPause();
        if (_dialogState.ttsUtterance) {
            _dialogState.ttsUtterance.rate = speed;
        }
        setTimeout(function () {
            ttsResume();
        }, 60);
    }
}
exports.ttsPlaybackRate = ttsPlaybackRate;
var _resumableState;
function ttsResume() {
    if (_dialogState &&
        _dialogState.ttsUtterance) {
        highlights(true);
        setTimeout(function () {
            if (_dialogState &&
                _dialogState.ttsUtterance) {
                _dialogState.ttsUtterance.r2_cancel = false;
                win.speechSynthesis.speak(_dialogState.ttsUtterance);
            }
        }, 0);
        if (_dialogState && _dialogState.ttsOverlayEnabled) {
            win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
        }
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
    }
    else if (_resumableState) {
        setTimeout(function () {
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
    if (_dialogState && _dialogState.hasAttribute("open") &&
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
        dom_text_utils_1.getTtsQueueLength(_dialogState.ttsQueue);
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
        return dom_text_utils_1.getTtsQueueItemRefText(_dialogState.ttsQueueItem);
    }
    return undefined;
}
exports.ttsQueueCurrentText = ttsQueueCurrentText;
function ttsNext(skipSentences) {
    if (skipSentences === void 0) { skipSentences = false; }
    if (_dialogState && _dialogState.ttsQueueItem) {
        var j = _dialogState.ttsQueueItem.iGlobal + 1;
        if (skipSentences &&
            _dialogState.ttsQueueItem.iSentence !== -1 &&
            _dialogState.ttsQueueItem.item.combinedTextSentences) {
            j = _dialogState.ttsQueueItem.iGlobal +
                (_dialogState.ttsQueueItem.item.combinedTextSentences.length -
                    _dialogState.ttsQueueItem.iSentence);
        }
        if (j >= _dialogState.ttsQueueLength || j < 0) {
            return;
        }
        ttsPause();
        ttsPlayQueueIndexDebounced(j);
    }
}
exports.ttsNext = ttsNext;
function ttsPrevious(skipSentences) {
    if (skipSentences === void 0) { skipSentences = false; }
    if (_dialogState && _dialogState.ttsQueueItem) {
        var j = _dialogState.ttsQueueItem.iGlobal - 1;
        if (skipSentences &&
            _dialogState.ttsQueueItem.iSentence !== -1 &&
            _dialogState.ttsQueueItem.item.combinedTextSentences) {
            j = _dialogState.ttsQueueItem.iGlobal - _dialogState.ttsQueueItem.iSentence - 1;
        }
        if (j >= _dialogState.ttsQueueLength || j < 0) {
            return;
        }
        ttsPause();
        ttsPlayQueueIndexDebounced(j);
    }
}
exports.ttsPrevious = ttsPrevious;
function ttsPreviewAndEventuallyPlayQueueIndex(n) {
    ttsPause();
    ttsPlayQueueIndexDebounced(n);
}
exports.ttsPreviewAndEventuallyPlayQueueIndex = ttsPreviewAndEventuallyPlayQueueIndex;
var _getCssSelectorOptions = {
    className: function (_str) {
        return true;
    },
    idName: function (_str) {
        return true;
    },
    tagName: function (_str) {
        return true;
    },
};
function getCssSelector(element) {
    try {
        return cssselector2_1.uniqueCssSelector(element, win.document, _getCssSelectorOptions);
    }
    catch (err) {
        console.log("uniqueCssSelector:");
        console.log(err);
        return "";
    }
}
var _ttsQueueItemHighlightsSentence;
var _ttsQueueItemHighlightsWord;
function wrapHighlightWord(ttsQueueItemRef, utteranceText, charIndex, charLength, word, start, end) {
    var e_1, _a;
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }
    if (_ttsQueueItemHighlightsWord) {
        _ttsQueueItemHighlightsWord.forEach(function (highlight) {
            if (highlight) {
                highlight_2.destroyHighlight(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsWord = undefined;
    }
    var ttsQueueItem = ttsQueueItemRef.item;
    var txtToCheck = ttsQueueItemRef.item.combinedText;
    var charIndexAdjusted = charIndex;
    if (ttsQueueItem.combinedTextSentences &&
        ttsQueueItem.combinedTextSentencesRangeBegin &&
        ttsQueueItem.combinedTextSentencesRangeEnd &&
        ttsQueueItemRef.iSentence >= 0) {
        var sentOffset = ttsQueueItem.combinedTextSentencesRangeBegin[ttsQueueItemRef.iSentence];
        charIndexAdjusted += sentOffset;
        txtToCheck = ttsQueueItem.combinedTextSentences[ttsQueueItemRef.iSentence];
    }
    if (IS_DEV) {
        if (utteranceText !== txtToCheck) {
            console.log("TTS utteranceText DIFF?? ", "[[" + utteranceText + "]]", "[[" + txtToCheck + "]]");
        }
        var ttsWord = utteranceText.substr(charIndex, charLength);
        if (ttsWord !== word) {
            console.log("TTS word DIFF?? ", "[[" + ttsWord + "]]", "[[" + word + "]]", charIndex + "--" + charLength, start + "--" + (end - start));
        }
    }
    var acc = 0;
    var rangeStartNode;
    var rangeStartOffset = -1;
    var rangeEndNode;
    var rangeEndOffset = -1;
    var charIndexEnd = charIndexAdjusted + charLength;
    try {
        for (var _b = tslib_1.__values(ttsQueueItem.textNodes), _c = _b.next(); !_c.done; _c = _b.next()) {
            var txtNode = _c.value;
            if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                continue;
            }
            var l = txtNode.nodeValue.length;
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
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (rangeStartNode && rangeEndNode) {
        var range = new Range();
        range.setStart(rangeStartNode, rangeStartOffset);
        range.setEnd(rangeEndNode, rangeEndOffset);
        if (_dialogState && _dialogState.focusScrollRaw) {
            var domRect = range.getBoundingClientRect();
            _dialogState.focusScrollRaw(ttsQueueItemRef.item.parentElement, false, true, domRect);
        }
        var rangeInfo = selection_1.convertRange(range, getCssSelector, function (_node) { return ""; });
        if (!rangeInfo) {
            return;
        }
        var highlightDefinitions = [
            {
                color: {
                    blue: 0,
                    green: 147,
                    red: 255,
                },
                drawType: highlight_1.HighlightDrawTypeUnderline,
                expand: 2,
                selectionInfo: {
                    cleanText: "",
                    rangeInfo: rangeInfo,
                    rawText: "",
                },
            },
        ];
        _ttsQueueItemHighlightsWord = highlight_2.createHighlights(win, highlightDefinitions, false);
    }
}
function wrapHighlight(doHighlight, ttsQueueItemRef) {
    var e_2, _a;
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }
    if (_ttsQueueItemHighlightsWord) {
        _ttsQueueItemHighlightsWord.forEach(function (highlight) {
            if (highlight) {
                highlight_2.destroyHighlight(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsWord = undefined;
    }
    if (_ttsQueueItemHighlightsSentence) {
        _ttsQueueItemHighlightsSentence.forEach(function (highlight) {
            if (highlight) {
                highlight_2.destroyHighlight(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsSentence = undefined;
    }
    var ttsQueueItem = ttsQueueItemRef.item;
    if (doHighlight &&
        ttsQueueItem.parentElement &&
        ttsQueueItem.textNodes && ttsQueueItem.textNodes.length) {
        var range = void 0;
        if (ttsQueueItem.combinedTextSentences &&
            ttsQueueItem.combinedTextSentencesRangeBegin &&
            ttsQueueItem.combinedTextSentencesRangeEnd &&
            ttsQueueItemRef.iSentence >= 0) {
            var sentBegin = ttsQueueItem.combinedTextSentencesRangeBegin[ttsQueueItemRef.iSentence];
            var sentEnd = ttsQueueItem.combinedTextSentencesRangeEnd[ttsQueueItemRef.iSentence];
            var acc = 0;
            var rangeStartNode = void 0;
            var rangeStartOffset = -1;
            var rangeEndNode = void 0;
            var rangeEndOffset = -1;
            try {
                for (var _b = tslib_1.__values(ttsQueueItemRef.item.textNodes), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var txtNode = _c.value;
                    if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                        continue;
                    }
                    var l = txtNode.nodeValue.length;
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
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            if (rangeStartNode && rangeEndNode) {
                range = new Range();
                range.setStart(rangeStartNode, rangeStartOffset);
                range.setEnd(rangeEndNode, rangeEndOffset);
            }
        }
        else {
            range = new Range();
            var firstTextNode = ttsQueueItem.textNodes[0];
            if (!firstTextNode.nodeValue && firstTextNode.nodeValue !== "") {
                return;
            }
            range.setStart(firstTextNode, 0);
            var lastTextNode = ttsQueueItem.textNodes[ttsQueueItem.textNodes.length - 1];
            if (!lastTextNode.nodeValue && lastTextNode.nodeValue !== "") {
                return;
            }
            range.setEnd(lastTextNode, lastTextNode.nodeValue.length);
        }
        if (range) {
            if (_dialogState && _dialogState.focusScrollRaw) {
                var domRect = range.getBoundingClientRect();
                _dialogState.focusScrollRaw(ttsQueueItemRef.item.parentElement, false, true, domRect);
            }
            var rangeInfo = selection_1.convertRange(range, getCssSelector, function (_node) { return ""; });
            if (!rangeInfo) {
                return;
            }
            var highlightDefinitions = [
                {
                    color: {
                        blue: 116,
                        green: 248,
                        red: 248,
                    },
                    drawType: highlight_1.HighlightDrawTypeBackground,
                    expand: 4,
                    selectionInfo: {
                        cleanText: "",
                        rangeInfo: rangeInfo,
                        rawText: "",
                    },
                },
            ];
            _ttsQueueItemHighlightsSentence = highlight_2.createHighlights(win, highlightDefinitions, false);
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
var _lastAnimState;
var animationTime = 400;
var scrollIntoViewSpokenTextDebounced = debounce_1.debounce(function (id) {
    scrollIntoViewSpokenText(id);
}, 200);
function scrollIntoViewSpokenText(id) {
    var reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
    var span = win.document.getElementById(id);
    if (span && _dialogState && _dialogState.domText) {
        var rect = span.getBoundingClientRect();
        var rect2 = _dialogState.domText.getBoundingClientRect();
        var scrollTopMax = _dialogState.domText.scrollHeight - _dialogState.domText.clientHeight;
        var offset = _dialogState.domText.scrollTop + (rect.top - rect2.top - (_dialogState.domText.clientHeight / 2));
        if (offset > scrollTopMax) {
            offset = scrollTopMax;
        }
        else if (offset < 0) {
            offset = 0;
        }
        var diff = Math.abs(_dialogState.domText.scrollTop - offset);
        if (diff < 20) {
            return;
        }
        if (_lastAnimState && _lastAnimState.animating) {
            win.cancelAnimationFrame(_lastAnimState.id);
            _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
        }
        var targetObj = _dialogState.domText;
        var targetProp = "scrollTop";
        if (reduceMotion) {
            _lastAnimState = undefined;
            targetObj[targetProp] = offset;
        }
        else {
            _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, animationTime, targetObj, offset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
        }
    }
}
var R2_DATA_ATTR_UTTERANCE_INDEX = "data-r2-tts-utterance-index";
function updateTTSInfo(charIndex, charLength, utteranceText) {
    if (!_dialogState || !_dialogState.hasAttribute("open") || !_dialogState.domText ||
        !_dialogState.ttsQueue || !_dialogState.ttsQueueItem) {
        return undefined;
    }
    var ttsQueueItem = _dialogState.ttsQueueItem;
    if (!ttsQueueItem) {
        return undefined;
    }
    var isWordBoundary = charIndex >= 0 && utteranceText;
    if (_dialogState.ttsOverlayEnabled &&
        !isWordBoundary &&
        _dialogState.focusScrollRaw &&
        ttsQueueItem.item.parentElement) {
        _dialogState.focusScrollRaw(ttsQueueItem.item.parentElement, false, true, undefined);
    }
    var ttsQueueItemText = utteranceText ? utteranceText : dom_text_utils_1.getTtsQueueItemRefText(ttsQueueItem);
    var ttsQueueItemMarkup = ttsQueueItemText;
    if (charIndex >= 0 && utteranceText) {
        var start = utteranceText.slice(0, charIndex + 1).search(/\S+$/);
        var right = utteranceText.slice(charIndex).search(/\s/);
        var word = right < 0 ? utteranceText.slice(start) : utteranceText.slice(start, right + charIndex);
        var end = start + word.length;
        if (_dialogState && _dialogState.ttsOverlayEnabled) {
            var prefix = "<span id=\"" + styles_1.TTS_ID_ACTIVE_WORD + "\">";
            var suffix = "</span>";
            var before = utteranceText.substr(0, start);
            var after = utteranceText.substr(end);
            var l = before.length + word.length + after.length;
            ttsQueueItemMarkup = (l === utteranceText.length) ?
                "" + dom_text_utils_1.normalizeHtmlText(before) + prefix + dom_text_utils_1.normalizeHtmlText(word) + suffix + dom_text_utils_1.normalizeHtmlText(after) :
                dom_text_utils_1.normalizeHtmlText(utteranceText);
        }
        else {
            wrapHighlightWord(ttsQueueItem, utteranceText, charIndex, charLength, word, start, end);
        }
    }
    if (!(_dialogState && _dialogState.ttsOverlayEnabled)) {
        return ttsQueueItemText;
    }
    var activeUtteranceElem = _dialogState.domText.ownerDocument ?
        _dialogState.domText.ownerDocument.getElementById(styles_1.TTS_ID_ACTIVE_UTTERANCE) :
        _dialogState.domText.querySelector("#" + styles_1.TTS_ID_ACTIVE_UTTERANCE);
    if (activeUtteranceElem) {
        var indexStr = activeUtteranceElem.getAttribute(R2_DATA_ATTR_UTTERANCE_INDEX);
        if (indexStr && indexStr !== "" + ttsQueueItem.iGlobal) {
            activeUtteranceElem.removeAttribute("id");
            var activeWordElem = activeUtteranceElem.ownerDocument ?
                activeUtteranceElem.ownerDocument.getElementById(styles_1.TTS_ID_ACTIVE_WORD) :
                activeUtteranceElem.querySelector("#" + styles_1.TTS_ID_ACTIVE_WORD);
            if (activeWordElem) {
                var index = parseInt(indexStr, 10);
                if (!isNaN(index)) {
                    var ttsQItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, index);
                    if (ttsQItem) {
                        var txt = dom_text_utils_1.getTtsQueueItemRefText(ttsQItem);
                        try {
                            activeUtteranceElem.innerHTML = dom_text_utils_1.normalizeHtmlText(txt);
                        }
                        catch (err) {
                            console.log(err);
                            console.log(txt);
                            activeUtteranceElem.innerHTML = "txt";
                        }
                    }
                }
            }
            activeUtteranceElem = _dialogState.domText.querySelector("[" + R2_DATA_ATTR_UTTERANCE_INDEX + "=\"" + ttsQueueItem.iGlobal + "\"]");
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
        var fullMarkup = "";
        for (var i = 0; i < _dialogState.ttsQueueLength; i++) {
            var ttsQItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, i);
            if (!ttsQItem) {
                continue;
            }
            var ttsQItemMarkup = ttsQueueItemMarkup;
            var isHeadingLevel1 = false;
            var isHeadingLevel2 = false;
            var isHeadingLevel3 = false;
            var isHeadingLevel4 = false;
            var isHeadingLevel5 = false;
            var p = ttsQItem.item.parentElement;
            while (p && p.tagName) {
                var tagName = p.tagName.toLowerCase();
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
            var classes = styles_1.TTS_CLASS_UTTERANCE +
                (isHeadingLevel1 ? " " + styles_1.TTS_CLASS_UTTERANCE_HEADING1 :
                    (isHeadingLevel2 ? " " + styles_1.TTS_CLASS_UTTERANCE_HEADING2 :
                        (isHeadingLevel3 ? " " + styles_1.TTS_CLASS_UTTERANCE_HEADING3 :
                            (isHeadingLevel4 ? " " + styles_1.TTS_CLASS_UTTERANCE_HEADING4 :
                                (isHeadingLevel5 ? " " + styles_1.TTS_CLASS_UTTERANCE_HEADING5 : "")))));
            var ttsQItemMarkupAttributes = R2_DATA_ATTR_UTTERANCE_INDEX + "=\"" + ttsQItem.iGlobal + "\" class=\"" + classes + "\"";
            if (ttsQItem.iGlobal === ttsQueueItem.iGlobal) {
                ttsQItemMarkupAttributes += " id=\"" + styles_1.TTS_ID_ACTIVE_UTTERANCE + "\" ";
            }
            else {
                ttsQItemMarkup = dom_text_utils_1.normalizeHtmlText(dom_text_utils_1.getTtsQueueItemRefText(ttsQItem));
            }
            var imageMarkup = "";
            if (ttsQItem.item.parentElement && ttsQItem.item.parentElement.tagName &&
                ttsQItem.item.parentElement.tagName.toLowerCase() === "img" &&
                ttsQItem.item.parentElement.src) {
                imageMarkup = "<img src=\"" + ttsQItem.item.parentElement.src + "\" />";
            }
            if (ttsQItem.item.parentElement && ttsQItem.item.parentElement.tagName &&
                ttsQItem.item.parentElement.tagName.toLowerCase() === "svg") {
                imageMarkup = ttsQItem.item.parentElement.outerHTML;
            }
            if (ttsQItem.item.dir) {
                ttsQItemMarkupAttributes += " dir=\"" + ttsQItem.item.dir + "\" ";
            }
            if (ttsQItem.item.lang) {
                ttsQItemMarkupAttributes += " lang=\"" + ttsQItem.item.lang + "\" xml:lang=\"" + ttsQItem.item.lang + "\" ";
            }
            fullMarkup += imageMarkup + "<div " + ttsQItemMarkupAttributes + ">" + ttsQItemMarkup + "</div>";
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
var ttsPlayQueueIndexDebounced = debounce_1.debounce(function (ttsQueueIndex) {
    ttsPlayQueueIndex(ttsQueueIndex);
}, 150);
function ttsPlayQueueIndex(ttsQueueIndex) {
    if (!_dialogState ||
        !_dialogState.ttsRootElement ||
        !_dialogState.focusScrollRaw ||
        !_dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable ||
        !_dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable ||
        !_dialogState.ttsQueue ||
        !_dialogState.hasAttribute("open")) {
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
        setTimeout(function () {
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_DOC_END);
        }, 400);
        return;
    }
    var ttsQueueItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, ttsQueueIndex);
    if (!ttsQueueItem) {
        ttsStop();
        return;
    }
    _dialogState.ttsQueueItem = ttsQueueItem;
    highlights(true);
    var txtStr = updateTTSInfo(-1, -1, undefined);
    if (!txtStr) {
        ttsStop();
        return;
    }
    var utterance = new SpeechSynthesisUtterance(txtStr);
    _dialogState.ttsUtterance = utterance;
    utterance.r2_ttsQueueIndex = ttsQueueIndex;
    if (_dialogState.ttsQueueItem.item.lang) {
        utterance.lang = _dialogState.ttsQueueItem.item.lang;
    }
    if (win.READIUM2.ttsPlaybackRate >= 0.1 && win.READIUM2.ttsPlaybackRate <= 10) {
        utterance.rate = win.READIUM2.ttsPlaybackRate;
    }
    utterance.voice = speechSynthesis.getVoices().find(function (voice) {
        return win.READIUM2.ttsVoice && (voice.name === win.READIUM2.ttsVoice.name && voice.lang === win.READIUM2.ttsVoice.lang && voice.voiceURI === win.READIUM2.ttsVoice.voiceURI && voice.default === win.READIUM2.ttsVoice.default && voice.localService === win.READIUM2.ttsVoice.localService);
    }) || null;
    utterance.onboundary = function (ev) {
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
    utterance.onend = function (_ev) {
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
    _resumableState = {
        ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable,
        ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
        focusScrollRaw: _dialogState.focusScrollRaw,
        ttsQueue: _dialogState.ttsQueue,
        ttsQueueIndex: _dialogState.ttsQueueItem.iGlobal,
        ttsRootElement: _dialogState.ttsRootElement,
    };
    utterance.r2_cancel = false;
    setTimeout(function () {
        win.speechSynthesis.speak(utterance);
    }, 0);
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
}
exports.ttsPlayQueueIndex = ttsPlayQueueIndex;
function startTTSSession(speed, voice, ttsRootElement, ttsQueue, ttsQueueIndexStart, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    win.READIUM2.ttsPlaybackRate = speed;
    win.READIUM2.ttsVoice = voice;
    var ttsQueueItemStart = dom_text_utils_1.getTtsQueueItemRef(ttsQueue, ttsQueueIndexStart);
    if (!ttsQueueItemStart) {
        ttsStop();
        return;
    }
    var ttsQueueLength = dom_text_utils_1.getTtsQueueLength(ttsQueue);
    var val = win.READIUM2.ttsOverlayEnabled ? ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable() : undefined;
    function onDialogClosed(el) {
        ttsPause();
        if (_dialogState && _dialogState.focusScrollRaw) {
            var toScrollTo = el;
            if (_dialogState.ttsQueueItem && _dialogState.ttsQueueItem.item.parentElement) {
                toScrollTo = _dialogState.ttsQueueItem.item.parentElement;
            }
            if (toScrollTo && _dialogState.ttsOverlayEnabled) {
                _dialogState.focusScrollRaw(toScrollTo, false, true, undefined);
            }
            else if (typeof val !== "undefined") {
                ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
            }
        }
        setTimeout(function () {
            resetState();
        }, 50);
    }
    var outerHTML = "<div id=\"" + styles_1.TTS_ID_CONTAINER + "\"\n    class=\"" + styles_1.CSS_CLASS_NO_FOCUS_OUTLINE + " " + styles_1.TTS_CLASS_THEME1 + "\"\n    dir=\"ltr\"\n    lang=\"en\"\n    xml:lang=\"en\"\n    tabindex=\"0\" autofocus=\"autofocus\"></div>\n" + (win.READIUM2.ttsOverlayEnabled ?
        "\n<button id=\"" + styles_1.TTS_ID_PREVIOUS + "\" class=\"" + styles_1.TTS_NAV_BUTTON_CLASS + "\" title=\"previous\"><span>&#9668;</span></button>\n<button id=\"" + styles_1.TTS_ID_NEXT + "\" class=\"" + styles_1.TTS_NAV_BUTTON_CLASS + "\" title=\"next\"><span>&#9658;</span></button>\n<input id=\"" + styles_1.TTS_ID_SLIDER + "\" type=\"range\" min=\"0\" max=\"" + (ttsQueueLength - 1) + "\" value=\"0\"\n    " + (readium_css_1.isRTL() ? "dir=\"rtl\"" : "dir=\"ltr\"") + "  title=\"progress\"/>\n"
        : "") + "\n";
    var pop = new popup_dialog_1.PopupDialog(win.document, outerHTML, onDialogClosed, "" + styles_1.TTS_POPUP_DIALOG_CLASS + (win.READIUM2.ttsOverlayEnabled ? "" : " " + styles_1.POPUP_DIALOG_CLASS_COLLAPSE), true);
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
        _dialogState.domSlider.addEventListener("input", function (_ev) {
            if (_dialogState && _dialogState.domSlider) {
                var n = _dialogState.domSlider.valueAsNumber;
                ttsPreviewAndEventuallyPlayQueueIndex(n);
            }
        });
    }
    if (_dialogState.domPrevious) {
        _dialogState.domPrevious.addEventListener("click", function (ev) {
            var skipSentences = ev.shiftKey && ev.altKey;
            if (readium_css_1.isRTL()) {
                ttsNext(skipSentences);
            }
            else {
                ttsPrevious(skipSentences);
            }
        });
    }
    if (_dialogState.domNext) {
        _dialogState.domNext.addEventListener("click", function (ev) {
            var skipSentences = ev.shiftKey && ev.altKey;
            if (!readium_css_1.isRTL()) {
                ttsNext(skipSentences);
            }
            else {
                ttsPrevious(skipSentences);
            }
        });
    }
    if (_dialogState.domText) {
        _dialogState.domText.addEventListener("click", function (ev) {
            if (ev.target && _dialogState && _dialogState.ttsQueue && _dialogState.ttsQueueItem) {
                var indexStr = ev.target.getAttribute(R2_DATA_ATTR_UTTERANCE_INDEX);
                if (indexStr) {
                    var index = parseInt(indexStr, 10);
                    if (!isNaN(index)) {
                        var ttsQItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, index);
                        if (ttsQItem) {
                            if (ttsQItem.iGlobal !== _dialogState.ttsQueueItem.iGlobal) {
                                ttsPause();
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