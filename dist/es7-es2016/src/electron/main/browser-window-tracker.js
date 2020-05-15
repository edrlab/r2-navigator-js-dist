"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackBrowserWindow = void 0;
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const debug = debug_("r2:navigator#electron/main/browser-window-tracker");
let _electronBrowserWindows;
function trackBrowserWindow(win, _serverURL) {
    if (!_electronBrowserWindows) {
        _electronBrowserWindows = [];
    }
    _electronBrowserWindows.push(win);
    win.on("closed", () => {
        const i = _electronBrowserWindows.indexOf(win);
        if (i < 0) {
            return;
        }
        _electronBrowserWindows.splice(i, 1);
    });
}
exports.trackBrowserWindow = trackBrowserWindow;
electron_1.app.on("web-contents-created", (_evt, wc) => {
    wc.on("will-attach-webview", (_event, webPreferences, params) => {
        debug("WEBVIEW will-attach-webview");
        if (params.src && !params.src.startsWith("data:")) {
            debug(params.src);
        }
        webPreferences.contextIsolation = false;
        webPreferences.javascript = true;
        webPreferences.webSecurity = true;
        webPreferences.nodeIntegration = false;
        webPreferences.nodeIntegrationInWorker = false;
        webPreferences.allowRunningInsecureContent = false;
        webPreferences.enableRemoteModule = false;
    });
    if (!wc.hostWebContents) {
        return;
    }
    if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
        return;
    }
    _electronBrowserWindows.forEach((win) => {
        if (wc.hostWebContents.id === win.webContents.id) {
            debug("WEBVIEW web-contents-created");
            wc.on("will-navigate", (event, url) => {
                debug("webview.getWebContents().on('will-navigate'");
                debug(url);
                event.preventDefault();
                if (event) {
                    debug("'will-navigate' SKIPPED.");
                    return;
                }
                const payload = {
                    url,
                };
                win.webContents.send(events_1.R2_EVENT_LINK, payload);
            });
        }
    });
});
//# sourceMappingURL=browser-window-tracker.js.map