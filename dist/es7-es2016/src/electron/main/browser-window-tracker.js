"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMenuSetup = void 0;
exports.trackBrowserWindow = trackBrowserWindow;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const electron_1 = require("electron");
const context_menu_1 = require("../common/context-menu");
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
    debug("app.on('web-contents-created')", wc.id);
    wc.on("will-attach-webview", (_event, webPreferences, params) => {
        debug("app.on('web-contents-created') ==> webContents.on('will-attach-webview')");
        if (params.src && !params.src.startsWith("data:")) {
            debug(params.src);
        }
        debug(webPreferences);
    });
    if (!wc.hostWebContents) {
        debug("app.on('web-contents-created') ==> !webContents.hostWebContents (skip)");
        return;
    }
    if (!(_electronBrowserWindows === null || _electronBrowserWindows === void 0 ? void 0 : _electronBrowserWindows.length)) {
        debug("app.on('web-contents-created') ==> !_electronBrowserWindows?.length (skip)");
        return;
    }
    _electronBrowserWindows.forEach((win) => {
        if (wc.hostWebContents.id === win.webContents.id) {
            debug("app.on('web-contents-created') ==> webContents.hostWebContents.id === _electronBrowserWindows[x].webContents.id", win.webContents.id);
            const willNavigate = (navUrl) => {
                if (!navUrl) {
                    debug("willNavigate ==> nil: ", navUrl);
                    return;
                }
                if (wc.getURL().startsWith("thoriumhttps" + "://")
                    &&
                        /^https?:\/\//.test(navUrl)) {
                    debug("willNavigate ==> EXTERNAL: ", win.webContents.getURL(), " --- ", wc.getURL(), " *** ", navUrl);
                    setTimeout(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                        yield electron_1.shell.openExternal(navUrl);
                    }), 0);
                    return;
                }
                debug("willNavigate ==> R2_EVENT_LINK: ", navUrl);
                const payload = {
                    url: navUrl,
                };
                win.webContents.send(events_1.R2_EVENT_LINK, payload);
            };
            wc.setWindowOpenHandler((details) => {
                debug("app.on('web-contents-created') ==> webContents.hostWebContents.id === _electronBrowserWindows[x].webContents.id ==> webContents.setWindowOpenHandler (always DENY): ", win.webContents.id, " --- ", details.url, " === ", win.webContents.getURL(), " +++ ", wc.getURL());
                willNavigate(details.url);
                return { action: "deny" };
            });
            wc.on("will-navigate", (details, url) => {
                debug("app.on('web-contents-created') ==> webContents.hostWebContents.id === _electronBrowserWindows[x].webContents.id ==> webContents.on('will-navigate') (always PREVENT): ", win.webContents.id, " --- ", details.url, " *** ", url, " === ", win.webContents.getURL(), " +++ ", wc.getURL());
                details.preventDefault();
                willNavigate(details.url);
            });
        }
    });
});
//# sourceMappingURL=browser-window-tracker.js.map