"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsSentenceDetectionEnable = exports.ttsSkippabilityEnable = exports.ttsPlaybackRate = exports.ttsVoice = exports.ttsClickEnable = exports.ttsOverlayEnable = exports.ttsNext = exports.ttsPrevious = exports.ttsResume = exports.ttsStop = exports.ttsPause = exports.ttsPlay = exports.ttsListen = exports.TTSStateEnum = exports.ttsHandleIpcMessage = exports.playTtsOnReadingLocation = exports.checkTtsState = void 0;
const debounce = require("debounce");
const events_1 = require("../common/events");
const location_1 = require("./location");
const win = global.window;
let _lastTTSWebView;
let _lastTTSWebViewHref;
let _ttsAutoPlayTimeout;
function checkTtsState(wv) {
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
    checkTtsStateDebounced(wasStopped, wv);
}
exports.checkTtsState = checkTtsState;
const checkTtsStateDebounced = debounce(checkTtsStateRaw, 400);
function checkTtsStateRaw(wasStopped, wv) {
    var _a;
    if (wasStopped || win.READIUM2.ttsClickEnabled) {
        if ((_a = wv.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) {
            if (_ttsAutoPlayTimeout) {
                win.clearTimeout(_ttsAutoPlayTimeout);
                _ttsAutoPlayTimeout = undefined;
            }
            _ttsAutoPlayTimeout = win.setTimeout(() => {
                var _a, _b;
                _ttsAutoPlayTimeout = undefined;
                if (((_a = wv.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) &&
                    (!_lastTTSWebView ||
                        (wasStopped && _lastTTSWebViewHref === ((_b = wv.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href)))) {
                    _lastTTSWebView = wv;
                    _lastTTSWebViewHref = wv.READIUM2.link.Href;
                    playTtsOnReadingLocation(wv.READIUM2.link.Href);
                }
            }, 100);
        }
    }
}
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
                    ttsPlay(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice);
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
            const activeWebView_ = win.READIUM2.getActiveWebViews().find((webview) => {
                var _a;
                return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href;
            });
            if (activeWebView_) {
                ttsPlay(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice);
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
        (0, location_1.navPreviousOrNext)(false, true, true);
    }
    else if (eventChannel === events_1.R2_EVENT_TTS_DOC_BACK) {
        (0, location_1.navPreviousOrNext)(true, true, true);
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
})(TTSStateEnum || (exports.TTSStateEnum = TTSStateEnum = {}));
let _ttsListener;
function ttsListen(ttsListener) {
    _ttsListener = ttsListener;
}
exports.ttsListen = ttsListen;
function ttsPlay(speed, voice) {
    var _a;
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
        win.READIUM2.ttsVoice = voice;
    }
    let startElementCSSSelector;
    const loc = (0, location_1.getCurrentReadingLocation)();
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
        voice,
    };
    setTimeout(async () => {
        var _a;
        if (activeWebView) {
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload);
            }
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
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE);
            }
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
        _lastTTSWebViewHref = undefined;
        setTimeout(async () => {
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP);
            }
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
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME);
            }
        }, 0);
    }
}
exports.ttsResume = ttsResume;
function ttsPrevious(skipSentences = false) {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(async () => {
            var _a;
            const payload = {
                skipSentences,
            };
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS, payload);
            }
        }, 0);
    }
}
exports.ttsPrevious = ttsPrevious;
function ttsNext(skipSentences = false) {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            continue;
        }
        setTimeout(async () => {
            var _a;
            const payload = {
                skipSentences,
            };
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT, payload);
            }
        }, 0);
    }
}
exports.ttsNext = ttsNext;
function ttsOverlayEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsOverlayEnabled = doEnable;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(async () => {
            var _a;
            const payload = {
                doEnable,
            };
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_OVERLAY_ENABLE, payload);
            }
        }, 0);
    }
}
exports.ttsOverlayEnable = ttsOverlayEnable;
function ttsClickEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(async () => {
            var _a;
            const payload = {
                doEnable,
            };
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload);
            }
        }, 0);
    }
}
exports.ttsClickEnable = ttsClickEnable;
function ttsVoice(voice) {
    if (win.READIUM2) {
        win.READIUM2.ttsVoice = voice;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        const payload = {
            voice,
        };
        setTimeout(async () => {
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_VOICE, payload);
            }
        }, 0);
    }
}
exports.ttsVoice = ttsVoice;
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
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_PLAYBACK_RATE, payload);
            }
        }, 0);
    }
}
exports.ttsPlaybackRate = ttsPlaybackRate;
function ttsSkippabilityEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsSkippabilityEnabled = doEnable;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(async () => {
            var _a;
            const payload = {
                doEnable,
            };
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_SKIP_ENABLE, payload);
            }
        }, 0);
    }
}
exports.ttsSkippabilityEnable = ttsSkippabilityEnable;
function ttsSentenceDetectionEnable(doEnable) {
    if (win.READIUM2) {
        win.READIUM2.ttsSentenceDetectionEnabled = doEnable;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(async () => {
            var _a;
            const payload = {
                doEnable,
            };
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                await activeWebView.send(events_1.R2_EVENT_TTS_SENTENCE_DETECT_ENABLE, payload);
            }
        }, 0);
    }
}
exports.ttsSentenceDetectionEnable = ttsSentenceDetectionEnable;
//# sourceMappingURL=readaloud.js.map