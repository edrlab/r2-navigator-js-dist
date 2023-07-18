"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMenuSetup = exports.trackBrowserWindow = void 0;
const debug_ = require("debug");
const electron_1 = require("electron");
const context_menu_1 = require("../common/context-menu");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
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
electron_1.app.on("accessibility-support-changed", (_ev, accessibilitySupportEnabled) => {
    debug("accessibility-support-changed ... ", accessibilitySupportEnabled);
    if (electron_1.app.accessibilitySupportEnabled !== accessibilitySupportEnabled) {
        debug("!!?? app.accessibilitySupportEnabled !== accessibilitySupportEnabled");
    }
    if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
        return;
    }
    _electronBrowserWindows.forEach((win) => {
        if (win.webContents) {
            debug("accessibility-support-changed event to WebViewContents ", accessibilitySupportEnabled);
            win.webContents.send("accessibility-support-changed", accessibilitySupportEnabled);
        }
    });
});
electron_1.ipcMain.on("accessibility-support-changed", (ev) => {
    const accessibilitySupportEnabled = electron_1.app.accessibilitySupportEnabled;
    debug("accessibility-support-changed REQUEST, sending to WebViewContents ", accessibilitySupportEnabled);
    ev.sender.send("accessibility-support-changed", accessibilitySupportEnabled);
});
const contextMenuSetup = (webContent, webContentID) => {
    debug(`MAIN CONTEXT_MENU_SETUP ${webContentID}`);
    const wc = electron_1.webContents.fromId(webContentID);
    if (!wc) {
        return;
    }
    if (wc.__CONTEXT_MENU_SETUP) {
        return;
    }
    wc.__CONTEXT_MENU_SETUP = true;
    wc.on("context-menu", (_ev, params) => {
        const { x, y } = params;
        debug("MAIN context-menu EVENT on WebView");
        const win = electron_1.BrowserWindow.fromWebContents(webContent) || undefined;
        const openDevToolsAndInspect = () => {
            const devToolsOpened = () => {
                wc.off("devtools-opened", devToolsOpened);
                wc.inspectElement(x, y);
                setTimeout(() => {
                    if (wc.devToolsWebContents && wc.isDevToolsOpened()) {
                        wc.devToolsWebContents.focus();
                    }
                }, 500);
            };
            wc.on("devtools-opened", devToolsOpened);
            wc.openDevTools({ activate: true, mode: "detach" });
        };
        electron_1.Menu.buildFromTemplate([{
                click: () => {
                    const wasOpened = wc.isDevToolsOpened();
                    if (!wasOpened) {
                        openDevToolsAndInspect();
                    }
                    else {
                        if (!wc.isDevToolsFocused()) {
                            wc.closeDevTools();
                            setImmediate(() => {
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
electron_1.ipcMain.on(context_menu_1.CONTEXT_MENU_SETUP, (event, webContentID) => {
    (0, exports.contextMenuSetup)(event.sender, webContentID);
});
electron_1.ipcMain.handle(events_1.R2_EVENT_KEYBOARD_FOCUS_REQUEST, (event, webContentsId) => {
    const wc = electron_1.webContents.fromId(webContentsId);
    if (!wc) {
        return;
    }
    debug("KEYBOARD FOCUS REQUEST (3) ", wc ? wc.id : "??", " // ", webContentsId, " -- ", wc.hostWebContents.id, " == ", event.sender.id);
    if (wc && wc.hostWebContents === event.sender) {
        debug("KEYBOARD FOCUS REQUEST (3) GO! ", wc.id, wc.hostWebContents.id);
        wc.focus();
    }
});
electron_1.app.on("web-contents-created", (_evt, wc) => {
    wc.on("will-attach-webview", (_event, webPreferences, params) => {
        debug("WEBVIEW will-attach-webview");
        if (params.src && !params.src.startsWith("data:")) {
            debug(params.src);
        }
        debug(webPreferences);
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
                if (!url ||
                    (!url.startsWith("thoriumhttps") &&
                        !url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL))) {
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