"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ = require("debug");
const electron_1 = require("electron");
const sessions_1 = require("../common/sessions");
const debug = debug_("r2:electron:main");
function configureWebViewSession(server) {
    const webViewSession = getWebViewSession();
    if (!webViewSession) {
        return;
    }
    const urlFilter = server.serverUrl() + "/*";
    debug(urlFilter);
    const filter = { urls: ["*"] };
    webViewSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        debug("onBeforeSendHeaders");
        debug(details);
        details.requestHeaders["User-Agent"] = "R2";
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info) {
                details.requestHeaders["X-Debug-" + info.trustKey] = info.trustVal;
            }
        }
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
    webViewSession.setCertificateVerifyProc((request, callback) => {
        debug("setCertificateVerifyProc");
        debug(request);
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info) {
                debug(info);
                if (request.hostname === info.urlHost) {
                    callback(0);
                    return;
                }
            }
        }
        callback(-3);
    });
    electron_1.app.on("certificate-error", (event, _webContents, url, error, certificate, callback) => {
        debug("certificate-error");
        debug(url);
        debug(error);
        debug(certificate);
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info) {
                debug(info);
                if (url.indexOf(server.serverUrl()) >= 0) {
                    event.preventDefault();
                    callback(true);
                    return;
                }
            }
        }
        callback(false);
    });
    electron_1.app.on("select-client-certificate", (event, _webContents, url, list, callback) => {
        debug("select-client-certificate");
        debug(url);
        debug(list);
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info) {
                debug(info);
                if (url.indexOf(server.serverUrl()) >= 0) {
                    event.preventDefault();
                    callback({ data: info.clientcert });
                    return;
                }
            }
        }
        callback();
    });
}
exports.configureWebViewSession = configureWebViewSession;
function initSessions() {
    electron_1.app.on("ready", () => {
        debug("app ready");
        clearSessions(undefined, undefined);
        const webViewSession = getWebViewSession();
        if (webViewSession) {
            webViewSession.setPermissionRequestHandler((wc, permission, callback) => {
                debug("setPermissionRequestHandler");
                debug(wc.getURL());
                debug(permission);
                callback(true);
            });
        }
    });
    function willQuitCallback(evt) {
        debug("app will quit");
        electron_1.app.removeListener("will-quit", willQuitCallback);
        let done = false;
        setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            debug("Cache and StorageData clearance waited enough => force quitting...");
            electron_1.app.quit();
        }, 6000);
        let sessionCleared = 0;
        const callback = () => {
            sessionCleared++;
            if (sessionCleared >= 2) {
                if (done) {
                    return;
                }
                done = true;
                debug("Cache and StorageData cleared, now quitting...");
                electron_1.app.quit();
            }
        };
        clearSessions(callback, callback);
        evt.preventDefault();
    }
    electron_1.app.on("will-quit", willQuitCallback);
}
exports.initSessions = initSessions;
function clearSession(sess, str, callbackCache, callbackStorageData) {
    sess.clearCache(() => {
        debug("SESSION CACHE CLEARED - " + str);
        if (callbackCache) {
            callbackCache();
        }
    });
    sess.clearStorageData({
        origin: "*",
        quotas: [
            "temporary",
            "persistent",
            "syncable"
        ],
        storages: [
            "appcache",
            "cookies",
            "filesystem",
            "indexdb",
            "localstorage",
            "shadercache",
            "websql",
            "serviceworkers"
        ],
    }, () => {
        debug("SESSION STORAGE DATA CLEARED - " + str);
        if (callbackStorageData) {
            callbackStorageData();
        }
    });
}
exports.clearSession = clearSession;
function getWebViewSession() {
    return electron_1.session.fromPartition(sessions_1.R2_SESSION_WEBVIEW, { cache: true });
}
exports.getWebViewSession = getWebViewSession;
function clearWebviewSession(callbackCache, callbackStorageData) {
    const sess = getWebViewSession();
    if (sess) {
        clearSession(sess, "[" + sessions_1.R2_SESSION_WEBVIEW + "]", callbackCache, callbackStorageData);
    }
    else {
        if (callbackCache) {
            callbackCache();
        }
        if (callbackStorageData) {
            callbackStorageData();
        }
    }
}
exports.clearWebviewSession = clearWebviewSession;
function clearDefaultSession(callbackCache, callbackStorageData) {
    if (electron_1.session.defaultSession) {
        clearSession(electron_1.session.defaultSession, "[default]", callbackCache, callbackStorageData);
    }
    else {
        if (callbackCache) {
            callbackCache();
        }
        if (callbackStorageData) {
            callbackStorageData();
        }
    }
}
exports.clearDefaultSession = clearDefaultSession;
function clearSessions(callbackCache, callbackStorageData) {
    let done = false;
    setTimeout(() => {
        if (done) {
            return;
        }
        done = true;
        debug("Cache and StorageData clearance waited enough (default session) => force webview session...");
        clearWebviewSession(callbackCache, callbackStorageData);
    }, 6000);
    let sessionCleared = 0;
    const callback = () => {
        sessionCleared++;
        if (sessionCleared >= 2) {
            if (done) {
                return;
            }
            done = true;
            debug("Cache and StorageData cleared (default session), now webview session...");
            clearWebviewSession(callbackCache, callbackStorageData);
        }
    };
    clearDefaultSession(callback, callback);
}
exports.clearSessions = clearSessions;
//# sourceMappingURL=sessions.js.map