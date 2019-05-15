"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../common/events");
var location_1 = require("./location");
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
var _ttsListener;
function ttsListen(ttsListener) {
    _ttsListener = ttsListener;
}
exports.ttsListen = ttsListen;
function ttsPlay() {
    var activeWebView = window.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    var startElementCSSSelector;
    var loc = location_1.getCurrentReadingLocation();
    if (loc && activeWebView.READIUM2 && activeWebView.READIUM2.link) {
        if (loc.locator.href === activeWebView.READIUM2.link.Href) {
            startElementCSSSelector = loc.locator.locations.cssSelector;
        }
    }
    var payload = {
        rootElement: "html > body",
        startElement: startElementCSSSelector,
    };
    activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload);
}
exports.ttsPlay = ttsPlay;
function ttsPause() {
    var activeWebView = window.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE);
}
exports.ttsPause = ttsPause;
function ttsStop() {
    var activeWebView = window.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP);
}
exports.ttsStop = ttsStop;
function ttsResume() {
    var activeWebView = window.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME);
}
exports.ttsResume = ttsResume;
function ttsPrevious() {
    var activeWebView = window.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS);
}
exports.ttsPrevious = ttsPrevious;
function ttsNext() {
    var activeWebView = window.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT);
}
exports.ttsNext = ttsNext;
function ttsClickEnable(doEnable) {
    if (window.READIUM2) {
        window.READIUM2.ttsClickEnabled = doEnable;
    }
    var activeWebView = window.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    var payload = {
        doEnable: doEnable,
    };
    activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload);
}
exports.ttsClickEnable = ttsClickEnable;
//# sourceMappingURL=readaloud.js.map