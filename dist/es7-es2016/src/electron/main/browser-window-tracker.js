"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const debug = debug_("r2:navigator#electron/main/browser-window-tracker");
let _electronBrowserWindows;
let _serverURL;
function trackBrowserWindow(win, serverURL) {
    _serverURL = serverURL;
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
    wc.on("will-attach-webview", (event, webPreferences, params) => {
        debug("WEBVIEW will-attach-webview: " + params.src);
        webPreferences.contextIsolation = false;
        webPreferences.javascript = true;
        webPreferences.webSecurity = true;
        webPreferences.nodeIntegration = false;
        webPreferences.nodeIntegrationInWorker = false;
        webPreferences.allowRunningInsecureContent = false;
        const fail = !params.src.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) &&
            (_serverURL ? !params.src.startsWith(_serverURL) :
                !(/^http[s]?:\/\/127\.0\.0\.1/.test(params.src)));
        if (fail) {
            debug("WEBVIEW will-attach-webview FAIL: " + params.src);
            event.preventDefault();
        }
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
                const wcUrl = event.sender.getURL();
                debug(wcUrl);
                event.preventDefault();
                const payload = {
                    url,
                };
                win.webContents.send(events_1.R2_EVENT_LINK, payload);
            });
        }
    });
});
//# sourceMappingURL=browser-window-tracker.js.map