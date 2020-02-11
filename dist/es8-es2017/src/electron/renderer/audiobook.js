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
//# sourceMappingURL=audiobook.js.map