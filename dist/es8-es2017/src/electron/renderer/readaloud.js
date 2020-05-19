"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsPlaybackRate = exports.ttsClickEnable = exports.ttsNext = exports.ttsPrevious = exports.ttsResume = exports.ttsStop = exports.ttsPause = exports.ttsPlay = exports.ttsListen = exports.TTSStateEnum = exports.ttsHandleIpcMessage = void 0;
const events_1 = require("../common/events");
const location_1 = require("./location");
const readium_css_1 = require("./readium-css");
const win = window;
let _lastTTSWebView;
function ttsHandleIpcMessage(eventChannel, _eventArgs, eventCurrentTarget) {
    if (eventChannel === events_1.R2_EVENT_TTS_IS_PAUSED) {
        _lastTTSWebView = eventCurrentTarget;
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PAUSED);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_IS_STOPPED) {
        _lastTTSWebView = undefined;
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.STOPPED);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_IS_PLAYING) {
        _lastTTSWebView = eventCurrentTarget;
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PLAYING);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_DOC_END) {
        const nextSpine = location_1.navLeftOrRight(readium_css_1.isRTL(), true, true);
        if (nextSpine) {
            setTimeout(() => {
                const activeWebView = win.READIUM2.getActiveWebViews().find((webview) => {
                    var _a;
                    return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === nextSpine.Href;
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
                            if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === nextSpine.Href) {
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
            }, 200);
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
function ttsPlay(speed) {
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
    if (!activeWebView) {
        return;
    }
    const payload = {
        rootElement: "html > body",
        speed,
        startElement: startElementCSSSelector,
    };
    setTimeout(async () => {
        if (activeWebView) {
            await activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload);
        }
    }, 0);
}
exports.ttsPlay = ttsPlay;
function ttsPause() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE);
        }, 0);
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
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP);
        }, 0);
    }
}
exports.ttsStop = ttsStop;
function ttsResume() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME);
        }, 0);
    }
}
exports.ttsResume = ttsResume;
function ttsPrevious() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS);
        }, 0);
    }
}
exports.ttsPrevious = ttsPrevious;
function ttsNext() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT);
        }, 0);
    }
}
exports.ttsNext = ttsNext;
function ttsClickEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(async () => {
            const payload = {
                doEnable,
            };
            setTimeout(async () => {
                await activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload);
            }, 0);
        }, 0);
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
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_TTS_PLAYBACK_RATE, payload);
        }, 0);
    }
}
exports.ttsPlaybackRate = ttsPlaybackRate;
//# sourceMappingURL=readaloud.js.map