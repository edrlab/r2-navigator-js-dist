"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soundtrackHandleIpcMessage = void 0;
const events_1 = require("../common/events");
function soundtrackHandleIpcMessage(eventChannel, eventArgs, _eventCurrentTarget) {
    if (eventChannel === events_1.R2_EVENT_AUDIO_SOUNDTRACK) {
        const payload = eventArgs[0];
        handleAudioSoundTrack(payload.url);
    }
    else {
        return false;
    }
    return true;
}
exports.soundtrackHandleIpcMessage = soundtrackHandleIpcMessage;
const AUDIO_SOUNDTRACK_ID = "R2_AUDIO_SOUNDTRACK_ID";
let _currentAudioSoundTrack;
function handleAudioSoundTrack(url) {
    if (url === _currentAudioSoundTrack) {
        return;
    }
    _currentAudioSoundTrack = url;
    let audioEl = document.getElementById(AUDIO_SOUNDTRACK_ID);
    if (audioEl && audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
    }
    audioEl = document.createElement("audio");
    audioEl.setAttribute("style", "display: none");
    audioEl.setAttribute("id", AUDIO_SOUNDTRACK_ID);
    audioEl.setAttribute("src", url);
    audioEl.setAttribute("loop", "loop");
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.setAttribute("role", "ibooks:soundtrack");
    document.body.appendChild(audioEl);
}
//# sourceMappingURL=soundtrack.js.map