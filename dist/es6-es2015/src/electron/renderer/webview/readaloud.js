"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsPlayQueueIndex = exports.ttsPreviewAndEventuallyPlayQueueIndex = exports.ttsPrevious = exports.ttsNext = exports.ttsQueueCurrentText = exports.ttsQueueCurrentIndex = exports.ttsQueueSize = exports.ttsPauseOrResume = exports.isTtsActive = exports.isTtsPlaying = exports.ttsResume = exports.ttsPlaybackRate = exports.ttsPause = exports.ttsStop = exports.ttsPlay = void 0;
const debounce_1 = require("debounce");
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const styles_1 = require("../../common/styles");
const animateProperty_1 = require("../common/animateProperty");
const dom_text_utils_1 = require("../common/dom-text-utils");
const easings_1 = require("../common/easings");
const popup_dialog_1 = require("../common/popup-dialog");
const readium_css_1 = require("./readium-css");
const win = global.window;
let _dialogState;
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
    win.document.documentElement.classList.remove(styles_1.TTS_CLASS_IS_ACTIVE);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_STOPPED);
}
function ttsPlay(speed, focusScrollRaw, rootElem, startElem, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    ttsStop();
    let rootEl = rootElem;
    if (!rootEl) {
        rootEl = win.document.body;
    }
    const ttsQueue = dom_text_utils_1.generateTtsQueue(rootEl);
    if (!ttsQueue.length) {
        return;
    }
    let ttsQueueIndex = -1;
    if (startElem) {
        const idx = dom_text_utils_1.findTtsQueueItemIndex(ttsQueue, startElem, rootEl);
        if (idx >= 0) {
            ttsQueueIndex = idx;
        }
    }
    if (ttsQueueIndex < 0) {
        ttsQueueIndex = 0;
    }
    setTimeout(() => {
        startTTSSession(speed, rootEl, ttsQueue, ttsQueueIndex, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
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
    win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PAUSED);
}
exports.ttsPause = ttsPause;
function ttsPlaybackRate(speed) {
    win.READIUM2.ttsPlaybackRate = speed;
    ttsPause();
    if (_dialogState && _dialogState.ttsUtterance) {
        _dialogState.ttsUtterance.rate = speed;
    }
    setTimeout(() => {
        ttsResume();
    }, 60);
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
        win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
    }
    else if (_resumableState) {
        setTimeout(() => {
            if (_resumableState) {
                startTTSSession(win.READIUM2.ttsPlaybackRate, _resumableState.ttsRootElement, _resumableState.ttsQueue, _resumableState.ttsQueueIndex, _resumableState.focusScrollRaw, _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
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
        const j = _dialogState.ttsQueueItem.iGlobal + 1;
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
        const j = _dialogState.ttsQueueItem.iGlobal - 1;
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
let _lastAnimState;
const animationTime = 400;
const scrollIntoViewSpokenTextDebounced = debounce_1.debounce((id) => {
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
            _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, animationTime, targetObj, offset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
        }
    }
}
const R2_DATA_ATTR_UTTERANCE_INDEX = "data-r2-tts-utterance-index";
function updateTTSInfo(ttsQueueItemPreview, charIndex, utteranceText) {
    if (!_dialogState || !_dialogState.hasAttribute("open") || !_dialogState.domText ||
        !_dialogState.ttsQueue || !_dialogState.ttsQueueItem) {
        return undefined;
    }
    const ttsQueueItem = ttsQueueItemPreview ? ttsQueueItemPreview : _dialogState.ttsQueueItem;
    if (!ttsQueueItem) {
        return undefined;
    }
    const isWordBoundary = charIndex >= 0 && utteranceText;
    if (!isWordBoundary && _dialogState.focusScrollRaw && ttsQueueItem.item.parentElement) {
        _dialogState.focusScrollRaw(ttsQueueItem.item.parentElement, false);
    }
    const ttsQueueItemText = utteranceText ? utteranceText : dom_text_utils_1.getTtsQueueItemRefText(ttsQueueItem);
    let ttsQueueItemMarkup = ttsQueueItemText;
    if (charIndex >= 0 && utteranceText) {
        const start = utteranceText.slice(0, charIndex + 1).search(/\S+$/);
        const right = utteranceText.slice(charIndex).search(/\s/);
        const word = right < 0 ? utteranceText.slice(start) : utteranceText.slice(start, right + charIndex);
        const end = start + word.length;
        const prefix = `<span id="${styles_1.TTS_ID_ACTIVE_WORD}">`;
        const suffix = "</span>";
        const before = utteranceText.substr(0, start);
        const after = utteranceText.substr(end);
        const l = before.length + word.length + after.length;
        ttsQueueItemMarkup = (l === utteranceText.length) ?
            `${before}${prefix}${word}${suffix}${after}` : utteranceText;
        dom_text_utils_1.wrapHighlight(true, ttsQueueItem, styles_1.TTS_ID_INJECTED_PARENT, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, word, start, end);
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
                    const ttsQItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, index);
                    if (ttsQItem) {
                        const txt = dom_text_utils_1.getTtsQueueItemRefText(ttsQItem);
                        try {
                            activeUtteranceElem.innerHTML = txt;
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
            const ttsQItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, i);
            if (!ttsQItem) {
                continue;
            }
            let ttsQItemMarkup = ttsQueueItemMarkup;
            let ttsQItemMarkupAttributes = `${R2_DATA_ATTR_UTTERANCE_INDEX}="${ttsQItem.iGlobal}" class="${styles_1.TTS_CLASS_UTTERANCE}"`;
            if (ttsQItem.iGlobal === ttsQueueItem.iGlobal) {
                ttsQItemMarkupAttributes += ` id="${styles_1.TTS_ID_ACTIVE_UTTERANCE}" `;
            }
            else {
                ttsQItemMarkup = dom_text_utils_1.getTtsQueueItemRefText(ttsQItem);
            }
            if (ttsQItem.item.dir) {
                ttsQItemMarkupAttributes += ` dir="${ttsQItem.item.dir}" `;
            }
            if (ttsQItem.item.lang) {
                ttsQItemMarkupAttributes += ` lang="${ttsQItem.item.lang}" xml:lang="${ttsQItem.item.lang}" `;
            }
            fullMarkup += `<div ${ttsQItemMarkupAttributes}>${ttsQItemMarkup}</div>`;
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
    if (!isWordBoundary) {
        if (_dialogState.domInfo) {
            _dialogState.domInfo.innerText = (ttsQueueItem.iGlobal + 1) + "/" + _dialogState.ttsQueueLength;
        }
    }
    scrollIntoViewSpokenTextDebounced(isWordBoundary ? styles_1.TTS_ID_ACTIVE_WORD : styles_1.TTS_ID_ACTIVE_UTTERANCE);
    return ttsQueueItemText;
}
const ttsPlayQueueIndexDebounced = debounce_1.debounce((ttsQueueIndex) => {
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
        setTimeout(() => {
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_DOC_END);
        }, 400);
        return;
    }
    const ttsQueueItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, ttsQueueIndex);
    if (!ttsQueueItem) {
        ttsStop();
        return;
    }
    _dialogState.ttsQueueItem = ttsQueueItem;
    highlights(true);
    const txtStr = updateTTSInfo(undefined, -1, undefined);
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
        updateTTSInfo(undefined, ev.charIndex, utterance.text);
    };
    utterance.onend = (_ev) => {
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
    setTimeout(() => {
        win.speechSynthesis.speak(utterance);
    }, 0);
    win.document.documentElement.classList.add(styles_1.TTS_CLASS_IS_ACTIVE);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_TTS_IS_PLAYING);
}
exports.ttsPlayQueueIndex = ttsPlayQueueIndex;
function startTTSSession(speed, ttsRootElement, ttsQueue, ttsQueueIndexStart, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    win.READIUM2.ttsPlaybackRate = speed;
    const ttsQueueItemStart = dom_text_utils_1.getTtsQueueItemRef(ttsQueue, ttsQueueIndexStart);
    if (!ttsQueueItemStart) {
        ttsStop();
        return;
    }
    const ttsQueueLength = dom_text_utils_1.getTtsQueueLength(ttsQueue);
    const val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
    function onDialogClosed(el) {
        ttsPause();
        if (_dialogState && _dialogState.focusScrollRaw) {
            let toScrollTo = el;
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
        setTimeout(() => {
            resetState();
        }, 50);
    }
    const outerHTML = `<div id="${styles_1.TTS_ID_CONTAINER}"
        class="${styles_1.CSS_CLASS_NO_FOCUS_OUTLINE}"
        dir="ltr"
        lang="en"
        xml:lang="en"
        tabindex="0" autofocus="autofocus"></div>
    <div id="${styles_1.TTS_ID_INFO}"> </div>
    <button id="${styles_1.TTS_ID_PREVIOUS}" class="${styles_1.TTS_NAV_BUTTON_CLASS}" title="previous"><span>&#9668;</span></button>
    <button id="${styles_1.TTS_ID_NEXT}" class="${styles_1.TTS_NAV_BUTTON_CLASS}" title="next"><span>&#9658;</span></button>
    <input id="${styles_1.TTS_ID_SLIDER}" type="range" min="0" max="${ttsQueueLength - 1}" value="0"
        ${readium_css_1.isRTL() ? `dir="rtl"` : `dir="ltr"`}  title="progress"/>`;
    const pop = new popup_dialog_1.PopupDialog(win.document, outerHTML, onDialogClosed, styles_1.TTS_POPUP_DIALOG_CLASS, true);
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
        _dialogState.domSlider.addEventListener("input", (_ev) => {
            if (_dialogState && _dialogState.domSlider) {
                const n = _dialogState.domSlider.valueAsNumber;
                ttsPreviewAndEventuallyPlayQueueIndex(n);
            }
        });
    }
    if (_dialogState.domPrevious) {
        _dialogState.domPrevious.addEventListener("click", (_ev) => {
            if (readium_css_1.isRTL()) {
                ttsNext();
            }
            else {
                ttsPrevious();
            }
        });
    }
    if (_dialogState.domNext) {
        _dialogState.domNext.addEventListener("click", (_ev) => {
            if (!readium_css_1.isRTL()) {
                ttsNext();
            }
            else {
                ttsPrevious();
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
                        const ttsQItem = dom_text_utils_1.getTtsQueueItemRef(_dialogState.ttsQueue, index);
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