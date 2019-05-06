"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var styles_1 = require("../../common/styles");
var dom_text_utils_1 = require("../common/dom-text-utils");
var popup_dialog_1 = require("../common/popup-dialog");
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
        _dialogState.domInfo = undefined;
        _dialogState.remove();
    }
    _dialogState = undefined;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_STOPPED);
}
function ttsPlay(focusScrollRaw, rootElem, startElem, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    ttsStop();
    var rootEl = rootElem;
    if (!rootEl) {
        rootEl = win.document.body;
    }
    var ttsQueue = dom_text_utils_1.generateTtsQueue(rootEl);
    if (!ttsQueue.length) {
        return;
    }
    var ttsQueueIndex = -1;
    if (startElem) {
        var idx = dom_text_utils_1.findTtsQueueItemIndex(ttsQueue, startElem, rootEl);
        if (idx >= 0) {
            ttsQueueIndex = idx;
        }
    }
    if (ttsQueueIndex < 0) {
        ttsQueueIndex = 0;
    }
    setTimeout(function () {
        startTTSSession(rootEl, ttsQueue, ttsQueueIndex, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
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
var _doNotProcessNextQueueItemOnUtteranceEnd = false;
function ttsPause() {
    highlights(false);
    if (win.speechSynthesis.speaking) {
        _doNotProcessNextQueueItemOnUtteranceEnd = true;
        setTimeout(function () {
            win.speechSynthesis.cancel();
        }, 0);
    }
    else if (win.speechSynthesis.pending) {
        setTimeout(function () {
            win.speechSynthesis.cancel();
        }, 0);
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PAUSED);
}
exports.ttsPause = ttsPause;
var _resumableState;
function ttsResume() {
    if (_dialogState &&
        _dialogState.ttsUtterance) {
        highlights(true);
        setTimeout(function () {
            if (_dialogState &&
                _dialogState.ttsUtterance) {
                win.speechSynthesis.speak(_dialogState.ttsUtterance);
            }
        }, 0);
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
    }
    else if (_resumableState) {
        setTimeout(function () {
            if (_resumableState) {
                startTTSSession(_resumableState.ttsRootElement, _resumableState.ttsQueue, _resumableState.ttsQueueIndex, _resumableState.focusScrollRaw, _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
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
function ttsNext() {
    if (_dialogState && _dialogState.ttsQueueItem) {
        var j = _dialogState.ttsQueueItem.iGlobal + 1;
        if (j >= _dialogState.ttsQueueLength || j < 0) {
            return;
        }
        ttsPause();
        ttsPlayQueueIndexDebounced(j);
    }
}
exports.ttsNext = ttsNext;
function ttsPrevious() {
    if (_dialogState && _dialogState.ttsQueueItem) {
        var j = _dialogState.ttsQueueItem.iGlobal - 1;
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
    if (_dialogState && _dialogState.ttsQueue) {
        updateTTSInfo(dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, n));
    }
    ttsPlayQueueIndexDebouncedMore(n);
}
exports.ttsPreviewAndEventuallyPlayQueueIndex = ttsPreviewAndEventuallyPlayQueueIndex;
function highlights(doHighlight) {
    if (!_dialogState) {
        return;
    }
    if (typeof _dialogState.FALSY_TO_DISABLE_HIGHLIGHTS === "undefined") {
        return;
    }
    if (doHighlight) {
        if (_dialogState.ttsQueueItem) {
            dom_text_utils_1.wrapHighlight(true, _dialogState.ttsQueueItem, styles_1.TTS_ID_INJECTED_PARENT, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, undefined, -1, -1);
        }
        if (_dialogState.ttsRootElement) {
            _dialogState.ttsRootElement.classList.add(styles_1.TTS_ID_SPEAKING_DOC_ELEMENT);
        }
    }
    else {
        if (_dialogState.ttsQueueItem) {
            dom_text_utils_1.wrapHighlight(false, _dialogState.ttsQueueItem, styles_1.TTS_ID_INJECTED_PARENT, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, undefined, -1, -1);
        }
        if (_dialogState.ttsRootElement) {
            _dialogState.ttsRootElement.classList.remove(styles_1.TTS_ID_SPEAKING_DOC_ELEMENT);
        }
    }
}
function handleWordBoundary(utteranceText, charIndex) {
    if (!_dialogState || !_dialogState.hasAttribute("open") || !_dialogState.domText || !_dialogState.ttsQueueItem) {
        return;
    }
    var text = utteranceText;
    var start = text.slice(0, charIndex + 1).search(/\S+$/);
    var right = text.slice(charIndex).search(/\s/);
    var word = right < 0 ? text.slice(start) : text.slice(start, right + charIndex);
    var end = start + word.length;
    var prefix = "<span id=\"" + styles_1.TTS_ID_ACTIVE_WORD + "\">";
    var suffix = "</span>";
    var before = text.substr(0, start);
    var after = text.substr(end);
    var l = before.length + word.length + after.length;
    var innerHTML = (l === text.length) ? "" + before + prefix + word + suffix + after : text;
    try {
        _dialogState.domText.innerHTML = innerHTML;
    }
    catch (err) {
        console.log(err);
        console.log(innerHTML);
        _dialogState.domText.innerHTML = "...";
    }
    dom_text_utils_1.wrapHighlight(true, _dialogState.ttsQueueItem, styles_1.TTS_ID_INJECTED_PARENT, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, word, start, end);
    setTimeout(function () {
        scrollIntoViewSpokenText();
    }, 80);
}
function scrollIntoViewSpokenText() {
    var span = win.document.getElementById(styles_1.TTS_ID_ACTIVE_WORD);
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
        _dialogState.domText.scrollTop = offset;
    }
}
function updateTTSInfo(ttsQueueItem) {
    if (!_dialogState || !ttsQueueItem) {
        return undefined;
    }
    if (_dialogState.focusScrollRaw && ttsQueueItem.item.parentElement) {
        _dialogState.focusScrollRaw(ttsQueueItem.item.parentElement, false);
    }
    var ttsQueueItemText = dom_text_utils_1.getTtsQueueItemRefText(ttsQueueItem);
    if (_dialogState.domText) {
        try {
            _dialogState.domText.innerHTML = ttsQueueItemText;
        }
        catch (err) {
            console.log(err);
            console.log(ttsQueueItemText);
            _dialogState.domText.innerHTML = "...";
        }
        if (ttsQueueItem.item.dir) {
            _dialogState.domText.setAttribute("dir", ttsQueueItem.item.dir);
        }
        else {
            _dialogState.domText.removeAttribute("dir");
        }
        if (ttsQueueItem.item.lang) {
            var str = ttsQueueItem.item.lang;
            _dialogState.domText.setAttribute("lang", str);
            _dialogState.domText.setAttribute("xml:lang", str);
        }
        else {
            _dialogState.domText.removeAttribute("lang");
        }
    }
    if (_dialogState.domInfo) {
        _dialogState.domInfo.innerText = (ttsQueueItem.iGlobal + 1) + "/" + _dialogState.ttsQueueLength;
    }
    return ttsQueueItemText;
}
var ttsPlayQueueIndexDebounced = debounce_1.debounce(function (ttsQueueIndex) {
    ttsPlayQueueIndex(ttsQueueIndex);
}, 150);
var ttsPlayQueueIndexDebouncedMore = debounce_1.debounce(function (ttsQueueIndex) {
    ttsPlayQueueIndex(ttsQueueIndex);
}, 300);
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
        _dialogState.domSlider.value = "" + ttsQueueIndex;
    }
    if (ttsQueueIndex >= _dialogState.ttsQueueLength || ttsQueueIndex < 0) {
        ttsStop();
        return;
    }
    var ttsQueueItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, ttsQueueIndex);
    if (!ttsQueueItem) {
        ttsStop();
        return;
    }
    _dialogState.ttsQueueItem = ttsQueueItem;
    highlights(true);
    var txtStr = updateTTSInfo(_dialogState.ttsQueueItem);
    if (!txtStr) {
        ttsStop();
        return;
    }
    var utterance = new SpeechSynthesisUtterance(txtStr);
    _dialogState.ttsUtterance = utterance;
    if (_dialogState.ttsQueueItem.item.lang) {
        utterance.lang = _dialogState.ttsQueueItem.item.lang;
    }
    utterance.onboundary = function (ev) {
        if (ev.name !== "word") {
            return;
        }
        handleWordBoundary(utterance.text, ev.charIndex);
    };
    utterance.onend = function (_ev) {
        highlights(false);
        if (_doNotProcessNextQueueItemOnUtteranceEnd) {
            _doNotProcessNextQueueItemOnUtteranceEnd = false;
            return;
        }
        setTimeout(function () {
            ttsPlayQueueIndex(ttsQueueIndex + 1);
        }, 100);
    };
    _doNotProcessNextQueueItemOnUtteranceEnd = false;
    _resumableState = {
        ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable,
        ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
        focusScrollRaw: _dialogState.focusScrollRaw,
        ttsQueue: _dialogState.ttsQueue,
        ttsQueueIndex: _dialogState.ttsQueueItem.iGlobal,
        ttsRootElement: _dialogState.ttsRootElement,
    };
    setTimeout(function () {
        win.speechSynthesis.speak(utterance);
    }, 0);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
}
exports.ttsPlayQueueIndex = ttsPlayQueueIndex;
function startTTSSession(ttsRootElement, ttsQueue, ttsQueueIndexStart, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    var ttsQueueItemStart = dom_text_utils_1.getTtsQueueItemRef(ttsQueue, ttsQueueIndexStart);
    if (!ttsQueueItemStart) {
        ttsStop();
        return;
    }
    var ttsQueueLength = dom_text_utils_1.getTtsQueueLength(ttsQueue);
    var val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
    function onDialogClosed(el) {
        ttsPause();
        if (_dialogState && _dialogState.focusScrollRaw) {
            var toScrollTo = el;
            if (_dialogState.ttsQueueItem && _dialogState.ttsQueueItem.item.parentElement) {
                toScrollTo = _dialogState.ttsQueueItem.item.parentElement;
            }
            if (toScrollTo) {
                _dialogState.focusScrollRaw(toScrollTo, false);
            }
            else {
                ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
            }
        }
        setTimeout(function () {
            resetState();
        }, 50);
    }
    var outerHTML = "<div id=\"" + styles_1.TTS_ID_CONTAINER + "\"\n        class=\"" + styles_1.CSS_CLASS_NO_FOCUS_OUTLINE + "\"\n        dir=\"ltr\"\n        lang=\"en\"\n        xml:lang=\"en\"\n        tabindex=\"0\" autofocus=\"autofocus\">...</div>\n    <div id=\"" + styles_1.TTS_ID_INFO + "\"> </div>\n    <button id=\"" + styles_1.TTS_ID_PREVIOUS + "\" class=\"" + styles_1.TTS_NAV_BUTTON_CLASS + "\"><span>&#9668;</span></button>\n    <button id=\"" + styles_1.TTS_ID_NEXT + "\" class=\"" + styles_1.TTS_NAV_BUTTON_CLASS + "\"><span>&#9658;</span></button>\n    <input id=\"" + styles_1.TTS_ID_SLIDER + "\" type=\"range\" min=\"0\" max=\"" + (ttsQueueLength - 1) + "\" value=\"0\" />";
    var pop = new popup_dialog_1.PopupDialog(win.document, outerHTML, onDialogClosed);
    pop.show(ttsQueueItemStart.item.parentElement);
    _dialogState = pop.dialog;
    if (!_dialogState) {
        return;
    }
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
    _dialogState.domInfo = win.document.getElementById(styles_1.TTS_ID_INFO);
    _dialogState.ttsQueue = ttsQueue;
    _dialogState.ttsQueueLength = ttsQueueLength;
    if (_dialogState.domSlider) {
        _dialogState.domSlider.addEventListener("input", function (_ev) {
            if (_dialogState && _dialogState.domSlider) {
                var n = parseInt(_dialogState.domSlider.value, 10);
                ttsPreviewAndEventuallyPlayQueueIndex(n);
            }
        });
    }
    if (_dialogState.domPrevious) {
        _dialogState.domPrevious.addEventListener("click", function (_ev) {
            ttsPrevious();
        });
    }
    if (_dialogState.domNext) {
        _dialogState.domNext.addEventListener("click", function (_ev) {
            ttsNext();
        });
    }
    if (_dialogState.domText) {
        _dialogState.domText.addEventListener("click", function (_ev) {
            ttsPauseOrResume();
        });
    }
    ttsPlayQueueIndex(ttsQueueIndexStart);
}
//# sourceMappingURL=readaloud.js.map