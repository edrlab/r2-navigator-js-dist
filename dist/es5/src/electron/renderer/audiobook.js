"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("../common/events");
var win = window;
function audioPlay() {
    var _this = this;
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
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
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
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
//# sourceMappingURL=audiobook.js.map