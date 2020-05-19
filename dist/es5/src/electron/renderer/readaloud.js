"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsPlaybackRate = exports.ttsClickEnable = exports.ttsNext = exports.ttsPrevious = exports.ttsResume = exports.ttsStop = exports.ttsPause = exports.ttsPlay = exports.ttsListen = exports.TTSStateEnum = exports.ttsHandleIpcMessage = void 0;
var tslib_1 = require("tslib");
var events_1 = require("../common/events");
var location_1 = require("./location");
var readium_css_1 = require("./readium-css");
var win = window;
var _lastTTSWebView;
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
        var nextSpine_1 = location_1.navLeftOrRight(readium_css_1.isRTL(), true, true);
        if (nextSpine_1) {
            setTimeout(function () {
                var activeWebView = win.READIUM2.getActiveWebViews().find(function (webview) {
                    var _a;
                    return ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === nextSpine_1.Href;
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
                            if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === nextSpine_1.Href) {
                                ttsPlay(win.READIUM2.ttsPlaybackRate);
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
                    }, 1000);
                    activeWebView.addEventListener("ipc-message", cb_1);
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
var _ttsListener;
function ttsListen(ttsListener) {
    _ttsListener = ttsListener;
}
exports.ttsListen = ttsListen;
function ttsPlay(speed) {
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
    }
    var startElementCSSSelector;
    var loc = location_1.getCurrentReadingLocation();
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
    if (!activeWebView) {
        return;
    }
    var payload = {
        rootElement: "html > body",
        speed: speed,
        startElement: startElementCSSSelector,
    };
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeWebView) return [3, 2];
                    return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload)];
                case 1:
                    _a.sent();
                    _a.label = 2;
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
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE)];
                    case 1:
                        _a.sent();
                        return [2];
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
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP)];
                    case 1:
                        _a.sent();
                        return [2];
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
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME)];
                    case 1:
                        _a.sent();
                        return [2];
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
function ttsPrevious() {
    var e_4, _a;
    var _this = this;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_4 = function (activeWebView) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            return "continue";
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS)];
                    case 1:
                        _a.sent();
                        return [2];
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
function ttsNext() {
    var e_5, _a;
    var _this = this;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_5 = function (activeWebView) {
        if (_lastTTSWebView && _lastTTSWebView !== activeWebView) {
            return "continue";
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT)];
                    case 1:
                        _a.sent();
                        return [2];
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
function ttsClickEnable(doEnable) {
    var e_6, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_6 = function (activeWebView) {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                payload = {
                    doEnable: doEnable,
                };
                setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload)];
                            case 1:
                                _a.sent();
                                return [2];
                        }
                    });
                }); }, 0);
                return [2];
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
exports.ttsClickEnable = ttsClickEnable;
function ttsPlaybackRate(speed) {
    var e_7, _a;
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_7 = function (activeWebView) {
        var payload = {
            speed: speed,
        };
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_PLAYBACK_RATE, payload)];
                    case 1:
                        _a.sent();
                        return [2];
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
exports.ttsPlaybackRate = ttsPlaybackRate;
//# sourceMappingURL=readaloud.js.map