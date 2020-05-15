"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsPlaybackRate = exports.ttsClickEnable = exports.ttsNext = exports.ttsPrevious = exports.ttsResume = exports.ttsStop = exports.ttsPause = exports.ttsPlay = exports.ttsListen = exports.TTSStateEnum = exports.ttsHandleIpcMessage = void 0;
var tslib_1 = require("tslib");
var events_1 = require("../common/events");
var location_1 = require("./location");
var readium_css_1 = require("./readium-css");
var win = window;
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
    else if (eventChannel === events_1.R2_EVENT_TTS_DOC_END) {
        var nextSpine_1 = location_1.navLeftOrRight(readium_css_1.isRTL(), true);
        if (nextSpine_1) {
            setTimeout(function () {
                var activeWebView = win.READIUM2.getActiveWebView();
                if (activeWebView) {
                    var done_1 = false;
                    var cb_1 = function (event) {
                        if (event.channel === events_1.R2_EVENT_READING_LOCATION) {
                            var webview = event.currentTarget;
                            if (webview !== activeWebView) {
                                console.log("Wrong navigator webview?!");
                                return;
                            }
                            done_1 = true;
                            activeWebView.removeEventListener("ipc-message", cb_1);
                            if (activeWebView.READIUM2.link &&
                                activeWebView.READIUM2.link.Href === nextSpine_1.Href) {
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
    var activeWebView = win.READIUM2.getActiveWebView();
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
        speed: speed,
        startElement: startElementCSSSelector,
    };
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); }, 0);
}
exports.ttsPlay = ttsPlay;
function ttsPause() {
    var _this = this;
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
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
}
exports.ttsPause = ttsPause;
function ttsStop() {
    var _this = this;
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
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
}
exports.ttsStop = ttsStop;
function ttsResume() {
    var _this = this;
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
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
}
exports.ttsResume = ttsResume;
function ttsPrevious() {
    var _this = this;
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
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
}
exports.ttsPrevious = ttsPrevious;
function ttsNext() {
    var _this = this;
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
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
}
exports.ttsNext = ttsNext;
function ttsClickEnable(doEnable) {
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    var payload = {
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
}
exports.ttsClickEnable = ttsClickEnable;
function ttsPlaybackRate(speed) {
    var _this = this;
    if (win.READIUM2) {
        win.READIUM2.ttsPlaybackRate = speed;
    }
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
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
}
exports.ttsPlaybackRate = ttsPlaybackRate;
//# sourceMappingURL=readaloud.js.map