"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioPlay = audioPlay;
exports.audioPause = audioPause;
exports.audioTogglePlayPause = audioTogglePlayPause;
exports.audioRewind = audioRewind;
exports.audioForward = audioForward;
exports.setCurrentAudioPlaybackRate = setCurrentAudioPlaybackRate;
exports.getCurrentAudioPlaybackRate = getCurrentAudioPlaybackRate;
const events_1 = require("../common/events");
const win = global.window;
function audioPlay() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        var _a;
        if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
            await activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PLAY);
        }
    }, 0);
}
function audioPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        var _a;
        if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
            await activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PAUSE);
        }
    }, 0);
}
function audioTogglePlayPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        var _a;
        if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
            await activeWebView.send(events_1.R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE);
        }
    }, 0);
}
function audioRewind() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        var _a;
        if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
            await activeWebView.send(events_1.R2_EVENT_AUDIO_REWIND);
        }
    }, 0);
}
function audioForward() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        var _a;
        if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
            await activeWebView.send(events_1.R2_EVENT_AUDIO_FORWARD);
        }
    }, 0);
}
let _playbackRate = 1;
function setCurrentAudioPlaybackRate(speed) {
    _playbackRate = speed;
}
function getCurrentAudioPlaybackRate() {
    return _playbackRate;
}
//# sourceMappingURL=audiobook.js.map