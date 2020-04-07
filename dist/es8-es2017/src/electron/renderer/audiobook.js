"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../common/events");
const win = window;
function audioPlay() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PLAY);
    }, 0);
}
exports.audioPlay = audioPlay;
function audioPause() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_AUDIO_DO_PAUSE);
    }, 0);
}
exports.audioPause = audioPause;
function audioTogglePlayPause() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE);
    }, 0);
}
exports.audioTogglePlayPause = audioTogglePlayPause;
function audioRewind() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_AUDIO_REWIND);
    }, 0);
}
exports.audioRewind = audioRewind;
function audioForward() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(async () => {
        await activeWebView.send(events_1.R2_EVENT_AUDIO_FORWARD);
    }, 0);
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