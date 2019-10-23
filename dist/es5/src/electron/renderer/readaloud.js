"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
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
    var _this = this;
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
    var activeWebView = window.READIUM2.getActiveWebView();
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
    var activeWebView = window.READIUM2.getActiveWebView();
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
    var activeWebView = window.READIUM2.getActiveWebView();
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
    var activeWebView = window.READIUM2.getActiveWebView();
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
    var activeWebView = window.READIUM2.getActiveWebView();
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
//# sourceMappingURL=readaloud.js.map