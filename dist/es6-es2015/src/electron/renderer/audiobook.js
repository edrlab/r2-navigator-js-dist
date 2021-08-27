"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentAudioPlaybackRate = exports.setCurrentAudioPlaybackRate = exports.audioForward = exports.audioRewind = exports.audioTogglePlayPause = exports.audioPause = exports.audioPlay = void 0;
const tslib_1 = require("tslib");
const events_1 = require("../common/events");
const win = window;
function audioPlay() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(() => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PLAY);
    }), 0);
}
exports.audioPlay = audioPlay;
function audioPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(() => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PAUSE);
    }), 0);
}
exports.audioPause = audioPause;
function audioTogglePlayPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(() => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield activeWebView.send(events_1.R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE);
    }), 0);
}
exports.audioTogglePlayPause = audioTogglePlayPause;
function audioRewind() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(() => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield activeWebView.send(events_1.R2_EVENT_AUDIO_REWIND);
    }), 0);
}
exports.audioRewind = audioRewind;
function audioForward() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(() => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield activeWebView.send(events_1.R2_EVENT_AUDIO_FORWARD);
    }), 0);
}
exports.audioForward = audioForward;
let _playbackRate = 1;
function setCurrentAudioPlaybackRate(speed) {
    _playbackRate = speed;
}
exports.setCurrentAudioPlaybackRate = setCurrentAudioPlaybackRate;
function getCurrentAudioPlaybackRate() {
    return _playbackRate;
}
exports.getCurrentAudioPlaybackRate = getCurrentAudioPlaybackRate;
//# sourceMappingURL=audiobook.js.map