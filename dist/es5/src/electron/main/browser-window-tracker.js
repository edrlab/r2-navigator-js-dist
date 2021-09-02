"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMenuSetup = exports.trackBrowserWindow = void 0;
var debug_ = require("debug");
var electron_1 = require("electron");
var context_menu_1 = require("../common/context-menu");
var events_1 = require("../common/events");
var sessions_1 = require("../common/sessions");
var debug = debug_("r2:navigator#electron/main/browser-window-tracker");
var _electronBrowserWindows;
function trackBrowserWindow(win, _serverURL) {
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
electron_1.app.on("accessibility-support-changed", function (_ev, accessibilitySupportEnabled) {
    debug("accessibility-support-changed ... ", accessibilitySupportEnabled);
    if (electron_1.app.accessibilitySupportEnabled !== accessibilitySupportEnabled) {
        debug("!!?? app.accessibilitySupportEnabled !== accessibilitySupportEnabled");
    }
    if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
        return;
    }
    _electronBrowserWindows.forEach(function (win) {
        if (win.webContents) {
            debug("accessibility-support-changed event to WebViewContents ", accessibilitySupportEnabled);
            win.webContents.send("accessibility-support-changed", accessibilitySupportEnabled);
        }
    });
});
electron_1.ipcMain.on("accessibility-support-changed", function (ev) {
    var accessibilitySupportEnabled = electron_1.app.accessibilitySupportEnabled;
    debug("accessibility-support-changed REQUEST, sending to WebViewContents ", accessibilitySupportEnabled);
    ev.sender.send("accessibility-support-changed", accessibilitySupportEnabled);
});
var contextMenuSetup = function (webContent, webContentID) {
    debug("MAIN CONTEXT_MENU_SETUP " + webContentID);
    var wc = electron_1.webContents.fromId(webContentID);
    wc.on("context-menu", function (_ev, params) {
        var x = params.x, y = params.y;
        debug("MAIN context-menu EVENT on WebView");
        var win = electron_1.BrowserWindow.fromWebContents(webContent) || undefined;
        var openDevToolsAndInspect = function () {
            var devToolsOpened = function () {
                wc.off("devtools-opened", devToolsOpened);
                wc.inspectElement(x, y);
                setTimeout(function () {
                    if (wc.devToolsWebContents && wc.isDevToolsOpened()) {
                        wc.devToolsWebContents.focus();
                    }
                }, 500);
            };
            wc.on("devtools-opened", devToolsOpened);
            wc.openDevTools({ activate: true, mode: "detach" });
        };
        electron_1.Menu.buildFromTemplate([{
                click: function () {
                    var wasOpened = wc.isDevToolsOpened();
                    if (!wasOpened) {
                        openDevToolsAndInspect();
                    }
                    else {
                        if (!wc.isDevToolsFocused()) {
                            wc.closeDevTools();
                            setImmediate(function () {
                                openDevToolsAndInspect();
                            });
                        }
                        else {
                            wc.inspectElement(x, y);
                        }
                    }
                },
                label: "Inspect element",
            }]).popup({ window: win });
    });
};
exports.contextMenuSetup = contextMenuSetup;
electron_1.ipcMain.on(context_menu_1.CONTEXT_MENU_SETUP, function (event, webContentID) {
    (0, exports.contextMenuSetup)(event.sender, webContentID);
});
electron_1.app.on("web-contents-created", function (_evt, wc) {
    wc.on("will-attach-webview", function (_event, webPreferences, params) {
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
    });
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
                event.preventDefault();
                if (!url ||
                    (!url.startsWith("thoriumhttps") &&
                        !url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL))) {
                    debug("'will-navigate' SKIPPED.");
                    return;
                }
                var payload = {
                    url: url,
                };
                win.webContents.send(events_1.R2_EVENT_LINK, payload);
            });
        }
    });
});
//# sourceMappingURL=browser-window-tracker.js.map