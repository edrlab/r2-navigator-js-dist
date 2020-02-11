"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../common/events");
const location_1 = require("./location");
const win = window;
function ttsHandleIpcMessage(eventChannel, _eventArgs, _eventCurrentTarget) {
    if (eventChannel === events_1.R2_EVENT_TTS_IS_PAUSED) {
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PAUSED);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_IS_STOPPED) {
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.STOPPED);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_IS_PLAYING) {
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PLAYING);
        }
    }
    else {
        return false;
    }
    return true;
}
exports.ttsHandleIpcMessage = ttsHandleIpcMessage;
var TTSStateEnum;
(function (TTSStateEnum) {
    TTSStateEnum["PAUSED"] = "PAUSED";
    TTSStateEnum["PLAYING"] = "PLAYING";
    TTSStateEnum["STOPPED"] = "STOPPED";
})(TTSStateEnum = exports.TTSStateEnum || (exports.TTSStateEnum = {}));
let _ttsListener;
function ttsListen(ttsListener) {
    _ttsListener = ttsListener;
}
exports.ttsListen = ttsListen;
function ttsPlay() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    let startElementCSSSelector;
    const loc = location_1.getCurrentReadingLocation();
    if (loc && activeWebView.READIUM2 && activeWebView.READIUM2.link) {
        if (loc.locator.href === activeWebView.READIUM2.link.Href) {
            startElementCSSSelector = loc.locator.locations.cssSelector;
        }
    }
    const payload = {
        rootElement: "html > body",
        startElement: startElementCSSSelector,
    };
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload);
    }, 0);
}
exports.ttsPlay = ttsPlay;
function ttsPause() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE);
    }, 0);
}
exports.ttsPause = ttsPause;
function ttsStop() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP);
    }, 0);
}
exports.ttsStop = ttsStop;
function ttsResume() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME);
    }, 0);
}
exports.ttsResume = ttsResume;
function ttsPrevious() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS);
    }, 0);
}
exports.ttsPrevious = ttsPrevious;
function ttsNext() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT);
    }, 0);
}
exports.ttsNext = ttsNext;
function ttsClickEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    const payload = {
        doEnable,
    };
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload);
    }, 0);
}
exports.ttsClickEnable = ttsClickEnable;
//# sourceMappingURL=readaloud.js.map