"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug_ = require("debug");
var electron_1 = require("electron");
var events_1 = require("../common/events");
var debug = debug_("r2:navigator#electron/main/browser-window-tracker");
var _electronBrowserWindows;
function trackBrowserWindow(win) {
    if (!_electronBrowserWindows) {
        _electronBrowserWindows = [];
    }
    _electronBrowserWindows.push(win);
    win.on("closed", function () {
        var i = _electronBrowserWindows.indexOf(win);
        if (i < 0) {
            return;
        }
        _electronBrowserWindows.splice(i, 1);
    });
}
exports.trackBrowserWindow = trackBrowserWindow;
electron_1.app.on("web-contents-created", function (_evt, wc) {
    if (!wc.hostWebContents) {
        return;
    }
    if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
        return;
    }
    _electronBrowserWindows.forEach(function (win) {
        if (wc.hostWebContents.id === win.webContents.id) {
            debug("WEBVIEW web-contents-created");
            wc.on("will-navigate", function (event, url) {
                debug("webview.getWebContents().on('will-navigate'");
                debug(url);
                var wcUrl = event.sender.getURL();
                debug(wcUrl);
                event.preventDefault();
                var payload = {
                    url: url,
                };
                win.webContents.send(events_1.R2_EVENT_LINK, payload);
            });
        }
    });
});
//# sourceMappingURL=browser-window-tracker.js.map