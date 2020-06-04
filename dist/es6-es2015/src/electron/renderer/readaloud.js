"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsPlaybackRate = exports.ttsClickEnable = exports.ttsOverlayEnable = exports.ttsNext = exports.ttsPrevious = exports.ttsResume = exports.ttsStop = exports.ttsPause = exports.ttsPlay = exports.ttsListen = exports.TTSStateEnum = exports.ttsHandleIpcMessage = exports.playTtsOnReadingLocation = exports.checkTtsState = void 0;
const tslib_1 = require("tslib");
const events_1 = require("../common/events");
const location_1 = require("./location");
const readium_css_1 = require("./readium-css");
const win = window;
let _lastTTSWebView;
let _lastTTSWebViewHref;
let _ttsAutoPlayTimeout;
function checkTtsState(wv) {
    var _a;
    let wasStopped = false;
    if (_lastTTSWebView && _lastTTSWebViewHref) {
        if (win.READIUM2.ttsClickEnabled ||
            !win.READIUM2.getActiveWebViews().includes(_lastTTSWebView) ||
            !win.READIUM2.getActiveWebViews().find((webview) => { var _a; return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === _lastTTSWebViewHref; })) {
            wasStopped = true;
            setTimeout(() => {
                win.speechSynthesis.cancel();
            }, 0);
            _lastTTSWebView = undefined;
            _lastTTSWebViewHref = undefined;
            if (_ttsListener) {
                _ttsListener(TTSStateEnum.STOPPED);
            }
        }
    }
    if (wasStopped || win.READIUM2.ttsClickEnabled) {
        if ((_a = wv.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) {
            if (_ttsAutoPlayTimeout) {
                win.clearTimeout(_ttsAutoPlayTimeout);
                _ttsAutoPlayTimeout = undefined;
            }
            _ttsAutoPlayTimeout = win.setTimeout(() => {
                var _a;
                _ttsAutoPlayTimeout = undefined;
                if (!_lastTTSWebView && ((_a = wv.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href)) {
                    _lastTTSWebView = wv;
                    _lastTTSWebViewHref = wv.READIUM2.link.Href;
                    playTtsOnReadingLocation(wv.READIUM2.link.Href);
                }
            }, 100);
        }
    }
}
exports.checkTtsState = checkTtsState;
function playTtsOnReadingLocation(href) {
    const activeWebView = win.READIUM2.getActiveWebViews().find((webview) => {
        var _a;
        return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href;
    });
    if (activeWebView) {
        let done = false;
        const cb = (event) => {
            var _a;
            if (event.channel === events_1.R2_EVENT_READING_LOCATION) {
                const webview = event.currentTarget;
                if (webview !== activeWebView) {
                    console.log("Wrong navigator webview?!");
                    return;
                }
                done = true;
                activeWebView.removeEventListener("ipc-message", cb);
                if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href) {
                    ttsPlay(win.READIUM2.ttsPlaybackRate);
                }
            }
        };
        setTimeout(() => {
            if (done) {
                return;
            }
            try {
                activeWebView.removeEventListener("ipc-message", cb);
            }
            catch (err) {
                console.log(err);
            }
        }, 1000);
        activeWebView.addEventListener("ipc-message", cb);
    }
}
exports.playTtsOnReadingLocation = playTtsOnReadingLocation;
function ttsHandleIpcMessage(eventChannel, _eventArgs, eventCurrentTarget) {
    var _a, _b;
    if (eventChannel === events_1.R2_EVENT_TTS_IS_PAUSED) {
        _lastTTSWebView = eventCurrentTarget;
        _lastTTSWebViewHref = (_a = eventCurrentTarget.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href;
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PAUSED);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_IS_STOPPED) {
        _lastTTSWebView = undefined;
        _lastTTSWebViewHref = undefined;
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.STOPPED);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_IS_PLAYING) {
        _lastTTSWebView = eventCurrentTarget;
        _lastTTSWebViewHref = (_b = eventCurrentTarget.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href;
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PLAYING);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_DOC_END) {
        location_1.navLeftOrRight(readium_css_1.isRTL(), true, true);
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
function ttsPlay(speed) {
    var _a;
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
    }
    let startElementCSSSelector;
    const loc = location_1.getCurrentReadingLocation();
    let activeWebView = win.READIUM2.getActiveWebViews().find((webview) => {
        var _a;
        return loc && loc.locator.href && loc.locator.href === ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href);
    });
    if (loc && activeWebView) {
        startElementCSSSelector = loc.locator.locations.cssSelector;
    }
    if (!activeWebView) {
        activeWebView = win.READIUM2.getFirstWebView();
    }
    _lastTTSWebView = activeWebView;
    _lastTTSWebViewHref = undefined;
    if (!activeWebView) {
        return;
    }
    _lastTTSWebViewHref = (_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href;
    const payload = {
        rootElement: "html > body",
        speed,
        startElement: startElementCSSSelector,
    };
    setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (activeWebView) {
            yield activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload);
        }
    }), 0);
}
exports.ttsPlay = ttsPlay;
function ttsPause() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE);
        }), 0);
    }
}
exports.ttsPause = ttsPause;
function ttsStop() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        _lastTTSWebView = undefined;
        _lastTTSWebViewHref = undefined;
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP);
        }), 0);
    }
}
exports.ttsStop = ttsStop;
function ttsResume() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME);
        }), 0);
    }
}
exports.ttsResume = ttsResume;
function ttsPrevious() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS);
        }), 0);
    }
}
exports.ttsPrevious = ttsPrevious;
function ttsNext() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT);
        }), 0);
    }
}
exports.ttsNext = ttsNext;
function ttsOverlayEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsOverlayEnabled = doEnable;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const payload = {
                doEnable,
            };
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield activeWebView.send(events_1.R2_EVENT_TTS_OVERLAY_ENABLE, payload);
            }), 0);
        }), 0);
    }
}
exports.ttsOverlayEnable = ttsOverlayEnable;
function ttsClickEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const payload = {
                doEnable,
            };
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload);
            }), 0);
        }), 0);
    }
}
exports.ttsClickEnable = ttsClickEnable;
function ttsPlaybackRate(speed) {
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        const payload = {
            speed,
        };
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_TTS_PLAYBACK_RATE, payload);
        }), 0);
    }
}
exports.ttsPlaybackRate = ttsPlaybackRate;
//# sourceMappingURL=readaloud.js.map