"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentAudioPlaybackRate = exports.setCurrentAudioPlaybackRate = exports.audioForward = exports.audioRewind = exports.audioTogglePlayPause = exports.audioPause = exports.audioPlay = void 0;
var tslib_1 = require("tslib");
var events_1 = require("../common/events");
var win = window;
function audioPlay() {
    var _this = this;
    var activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PLAY)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); }, 0);
}
exports.audioPlay = audioPlay;
function audioPause() {
    var _this = this;
    var activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PAUSE)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); }, 0);
}
exports.audioPause = audioPause;
function audioTogglePlayPause() {
    var _this = this;
    var activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, activeWebView.send(events_1.R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); }, 0);
}
exports.audioTogglePlayPause = audioTogglePlayPause;
function audioRewind() {
    var _this = this;
    var activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, activeWebView.send(events_1.R2_EVENT_AUDIO_REWIND)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); }, 0);
}
exports.audioRewind = audioRewind;
function audioForward() {
    var _this = this;
    var activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, activeWebView.send(events_1.R2_EVENT_AUDIO_FORWARD)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); }, 0);
}
exports.audioForward = audioForward;
var _playbackRate = 1;
function setCurrentAudioPlaybackRate(speed) {
    _playbackRate = speed;
}
exports.setCurrentAudioPlaybackRate = setCurrentAudioPlaybackRate;
function getCurrentAudioPlaybackRate() {
    return _playbackRate;
}
exports.getCurrentAudioPlaybackRate = getCurrentAudioPlaybackRate;
//# sourceMappingURL=audiobook.js.map