"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsSentenceDetectionEnable = exports.ttsSkippabilityEnable = exports.ttsPlaybackRate = exports.ttsVoice = exports.ttsClickEnable = exports.ttsOverlayEnable = exports.ttsNext = exports.ttsPrevious = exports.ttsResume = exports.ttsStop = exports.ttsPause = exports.ttsPlay = exports.ttsListen = exports.TTSStateEnum = exports.ttsHandleIpcMessage = exports.playTtsOnReadingLocation = exports.checkTtsState = void 0;
var tslib_1 = require("tslib");
var debounce = require("debounce");
var events_1 = require("../common/events");
var location_1 = require("./location");
var win = global.window;
var _lastTTSWebView;
var _lastTTSWebViewHref;
var _ttsAutoPlayTimeout;
function checkTtsState(wv) {
    var wasStopped = false;
    if (_lastTTSWebView && _lastTTSWebViewHref) {
        if (win.READIUM2.ttsClickEnabled ||
            !win.READIUM2.getActiveWebViews().includes(_lastTTSWebView) ||
            !win.READIUM2.getActiveWebViews().find(function (webview) { var _a; return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === _lastTTSWebViewHref; })) {
            wasStopped = true;
            setTimeout(function () {
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
var checkTtsStateDebounced = debounce(checkTtsStateRaw, 400);
function checkTtsStateRaw(wasStopped, wv) {
    var _a;
    if (wasStopped || win.READIUM2.ttsClickEnabled) {
        if ((_a = wv.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) {
            if (_ttsAutoPlayTimeout) {
                win.clearTimeout(_ttsAutoPlayTimeout);
                _ttsAutoPlayTimeout = undefined;
            }
            _ttsAutoPlayTimeout = win.setTimeout(function () {
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
    var activeWebView = win.READIUM2.getActiveWebViews().find(function (webview) {
        var _a;
        return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href;
    });
    if (activeWebView) {
        var done_1 = false;
        var cb_1 = function (event) {
            var _a;
            if (event.channel === events_1.R2_EVENT_READING_LOCATION) {
                var webview = event.currentTarget;
                if (webview !== activeWebView) {
                    console.log("Wrong navigator webview?!");
                    return;
                }
                done_1 = true;
                activeWebView.removeEventListener("ipc-message", cb_1);
                if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href) {
                    ttsPlay(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice);
                }
            }
        };
        setTimeout(function () {
            if (done_1) {
                return;
            }
            try {
                activeWebView.removeEventListener("ipc-message", cb_1);
            }
            catch (err) {
                console.log(err);
            }
            var activeWebView_ = win.READIUM2.getActiveWebViews().find(function (webview) {
                var _a;
                return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href;
            });
            if (activeWebView_) {
                ttsPlay(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice);
            }
        }, 1000);
        activeWebView.addEventListener("ipc-message", cb_1);
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
var _ttsListener;
function ttsListen(ttsListener) {
    _ttsListener = ttsListener;
}
exports.ttsListen = ttsListen;
function ttsPlay(speed, voice) {
    var _this = this;
    var _a;
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
        win.READIUM2.ttsVoice = voice;
    }
    var startElementCSSSelector;
    var loc = (0, location_1.getCurrentReadingLocation)();
    var activeWebView = win.READIUM2.getActiveWebViews().find(function (webview) {
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
    var payload = {
        rootElement: "html > body",
        speed: speed,
        startElement: startElementCSSSelector,
        voice: voice,
    };
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!activeWebView) return [3, 2];
                    if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                    return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload)];
                case 1:
                    _b.sent();
                    _b.label = 2;
                case 2: return [2];
            }
        });
    }); }, 0);
}
exports.ttsPlay = ttsPlay;
function ttsPause() {
    var e_1, _a;
    var _this = this;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_1 = function (activeWebView) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            return "continue";
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_1 = tslib_1.__values(activeWebViews), activeWebViews_1_1 = activeWebViews_1.next(); !activeWebViews_1_1.done; activeWebViews_1_1 = activeWebViews_1.next()) {
            var activeWebView = activeWebViews_1_1.value;
            _loop_1(activeWebView);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (activeWebViews_1_1 && !activeWebViews_1_1.done && (_a = activeWebViews_1.return)) _a.call(activeWebViews_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
exports.ttsPause = ttsPause;
function ttsStop() {
    var e_2, _a;
    var _this = this;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_2 = function (activeWebView) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            return "continue";
        }
        _lastTTSWebView = undefined;
        _lastTTSWebViewHref = undefined;
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_2 = tslib_1.__values(activeWebViews), activeWebViews_2_1 = activeWebViews_2.next(); !activeWebViews_2_1.done; activeWebViews_2_1 = activeWebViews_2.next()) {
            var activeWebView = activeWebViews_2_1.value;
            _loop_2(activeWebView);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (activeWebViews_2_1 && !activeWebViews_2_1.done && (_a = activeWebViews_2.return)) _a.call(activeWebViews_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
exports.ttsStop = ttsStop;
function ttsResume() {
    var e_3, _a;
    var _this = this;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_3 = function (activeWebView) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            return "continue";
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_3 = tslib_1.__values(activeWebViews), activeWebViews_3_1 = activeWebViews_3.next(); !activeWebViews_3_1.done; activeWebViews_3_1 = activeWebViews_3.next()) {
            var activeWebView = activeWebViews_3_1.value;
            _loop_3(activeWebView);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (activeWebViews_3_1 && !activeWebViews_3_1.done && (_a = activeWebViews_3.return)) _a.call(activeWebViews_3);
        }
        finally { if (e_3) throw e_3.error; }
    }
}
exports.ttsResume = ttsResume;
function ttsPrevious(skipSentences) {
    var e_4, _a;
    var _this = this;
    if (skipSentences === void 0) { skipSentences = false; }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_4 = function (activeWebView) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            return "continue";
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        payload = {
                            skipSentences: skipSentences,
                        };
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_4 = tslib_1.__values(activeWebViews), activeWebViews_4_1 = activeWebViews_4.next(); !activeWebViews_4_1.done; activeWebViews_4_1 = activeWebViews_4.next()) {
            var activeWebView = activeWebViews_4_1.value;
            _loop_4(activeWebView);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (activeWebViews_4_1 && !activeWebViews_4_1.done && (_a = activeWebViews_4.return)) _a.call(activeWebViews_4);
        }
        finally { if (e_4) throw e_4.error; }
    }
}
exports.ttsPrevious = ttsPrevious;
function ttsNext(skipSentences) {
    var e_5, _a;
    var _this = this;
    if (skipSentences === void 0) { skipSentences = false; }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_5 = function (activeWebView) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            return "continue";
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        payload = {
                            skipSentences: skipSentences,
                        };
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_5 = tslib_1.__values(activeWebViews), activeWebViews_5_1 = activeWebViews_5.next(); !activeWebViews_5_1.done; activeWebViews_5_1 = activeWebViews_5.next()) {
            var activeWebView = activeWebViews_5_1.value;
            _loop_5(activeWebView);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (activeWebViews_5_1 && !activeWebViews_5_1.done && (_a = activeWebViews_5.return)) _a.call(activeWebViews_5);
        }
        finally { if (e_5) throw e_5.error; }
    }
}
exports.ttsNext = ttsNext;
function ttsOverlayEnable(doEnable) {
    var e_6, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsOverlayEnabled = doEnable;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_6 = function (activeWebView) {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        payload = {
                            doEnable: doEnable,
                        };
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_OVERLAY_ENABLE, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_6 = tslib_1.__values(activeWebViews), activeWebViews_6_1 = activeWebViews_6.next(); !activeWebViews_6_1.done; activeWebViews_6_1 = activeWebViews_6.next()) {
            var activeWebView = activeWebViews_6_1.value;
            _loop_6(activeWebView);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (activeWebViews_6_1 && !activeWebViews_6_1.done && (_a = activeWebViews_6.return)) _a.call(activeWebViews_6);
        }
        finally { if (e_6) throw e_6.error; }
    }
}
exports.ttsOverlayEnable = ttsOverlayEnable;
function ttsClickEnable(doEnable) {
    var e_7, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_7 = function (activeWebView) {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        payload = {
                            doEnable: doEnable,
                        };
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_7 = tslib_1.__values(activeWebViews), activeWebViews_7_1 = activeWebViews_7.next(); !activeWebViews_7_1.done; activeWebViews_7_1 = activeWebViews_7.next()) {
            var activeWebView = activeWebViews_7_1.value;
            _loop_7(activeWebView);
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (activeWebViews_7_1 && !activeWebViews_7_1.done && (_a = activeWebViews_7.return)) _a.call(activeWebViews_7);
        }
        finally { if (e_7) throw e_7.error; }
    }
}
exports.ttsClickEnable = ttsClickEnable;
function ttsVoice(voice) {
    var e_8, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsVoice = voice;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_8 = function (activeWebView) {
        var payload = {
            voice: voice,
        };
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_VOICE, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_8 = tslib_1.__values(activeWebViews), activeWebViews_8_1 = activeWebViews_8.next(); !activeWebViews_8_1.done; activeWebViews_8_1 = activeWebViews_8.next()) {
            var activeWebView = activeWebViews_8_1.value;
            _loop_8(activeWebView);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (activeWebViews_8_1 && !activeWebViews_8_1.done && (_a = activeWebViews_8.return)) _a.call(activeWebViews_8);
        }
        finally { if (e_8) throw e_8.error; }
    }
}
exports.ttsVoice = ttsVoice;
function ttsPlaybackRate(speed) {
    var e_9, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_9 = function (activeWebView) {
        var payload = {
            speed: speed,
        };
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_PLAYBACK_RATE, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_9 = tslib_1.__values(activeWebViews), activeWebViews_9_1 = activeWebViews_9.next(); !activeWebViews_9_1.done; activeWebViews_9_1 = activeWebViews_9.next()) {
            var activeWebView = activeWebViews_9_1.value;
            _loop_9(activeWebView);
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (activeWebViews_9_1 && !activeWebViews_9_1.done && (_a = activeWebViews_9.return)) _a.call(activeWebViews_9);
        }
        finally { if (e_9) throw e_9.error; }
    }
}
exports.ttsPlaybackRate = ttsPlaybackRate;
function ttsSkippabilityEnable(doEnable) {
    var e_10, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsSkippabilityEnabled = doEnable;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_10 = function (activeWebView) {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        payload = {
                            doEnable: doEnable,
                        };
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_SKIP_ENABLE, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_10 = tslib_1.__values(activeWebViews), activeWebViews_10_1 = activeWebViews_10.next(); !activeWebViews_10_1.done; activeWebViews_10_1 = activeWebViews_10.next()) {
            var activeWebView = activeWebViews_10_1.value;
            _loop_10(activeWebView);
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (activeWebViews_10_1 && !activeWebViews_10_1.done && (_a = activeWebViews_10.return)) _a.call(activeWebViews_10);
        }
        finally { if (e_10) throw e_10.error; }
    }
}
exports.ttsSkippabilityEnable = ttsSkippabilityEnable;
function ttsSentenceDetectionEnable(doEnable) {
    var e_11, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsSentenceDetectionEnabled = doEnable;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_11 = function (activeWebView) {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        payload = {
                            doEnable: doEnable,
                        };
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_TTS_SENTENCE_DETECT_ENABLE, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_11 = tslib_1.__values(activeWebViews), activeWebViews_11_1 = activeWebViews_11.next(); !activeWebViews_11_1.done; activeWebViews_11_1 = activeWebViews_11.next()) {
            var activeWebView = activeWebViews_11_1.value;
            _loop_11(activeWebView);
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (activeWebViews_11_1 && !activeWebViews_11_1.done && (_a = activeWebViews_11.return)) _a.call(activeWebViews_11);
        }
        finally { if (e_11) throw e_11.error; }
    }
}
exports.ttsSentenceDetectionEnable = ttsSentenceDetectionEnable;
//# sourceMappingURL=readaloud.js.map