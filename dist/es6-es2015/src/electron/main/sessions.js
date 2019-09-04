"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_ = require("debug");
const electron_1 = require("electron");
const sessions_1 = require("../common/sessions");
const debug = debug_("r2:navigator#electron/main/sessions");
function secureSessions(server) {
    const filter = { urls: ["*", "*://*/*"] };
    const onHeadersReceivedCB = (details, callback) => {
        if (!details.url) {
            callback({});
            return;
        }
        const serverUrl = server.serverUrl();
        if ((serverUrl && details.url.startsWith(serverUrl)) ||
            details.url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
            callback({ responseHeaders: Object.assign(Object.assign({}, details.responseHeaders), { "Content-Security-Policy": [`default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ${sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL}: ${serverUrl}`] }) });
        }
        else {
            callback({});
        }
    };
    const onBeforeSendHeadersCB = (details, callback) => {
        if (!details.url) {
            callback({});
            return;
        }
        const serverUrl = server.serverUrl();
        if (server.isSecured() &&
            ((serverUrl && details.url.startsWith(serverUrl)) ||
                details.url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {
            const header = server.getSecureHTTPHeader(details.url);
            if (header) {
                details.requestHeaders[header.name] = header.value;
            }
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
        else {
            callback({ cancel: false });
        }
    };
    const setCertificateVerifyProcCB = (request, callback) => {
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info) {
                if (request.hostname === info.urlHost) {
                    callback(0);
                    return;
                }
            }
        }
        callback(-3);
    };
    if (electron_1.session.defaultSession) {
        electron_1.session.defaultSession.webRequest.onHeadersReceived(filter, onHeadersReceivedCB);
        electron_1.session.defaultSession.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCB);
        electron_1.session.defaultSession.setCertificateVerifyProc(setCertificateVerifyProcCB);
    }
    const webViewSession = getWebViewSession();
    if (webViewSession) {
        webViewSession.webRequest.onHeadersReceived(filter, onHeadersReceivedCB);
        webViewSession.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCB);
        webViewSession.setCertificateVerifyProc(setCertificateVerifyProcCB);
    }
    electron_1.app.on("certificate-error", (event, _webContents, url, _error, _certificate, callback) => {
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info) {
                if (url.indexOf(info.urlScheme + "://" + info.urlHost) === 0) {
                    event.preventDefault();
                    callback(true);
                    return;
                }
            }
        }
        callback(false);
    });
}
exports.secureSessions = secureSessions;
const httpProtocolHandler = (request, callback) => {
    const url = sessions_1.convertCustomSchemeToHttpUrl(request.url);
    callback({
        method: request.method,
        url,
    });
};
function initSessions() {
    electron_1.protocol.registerStandardSchemes([sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL], { secure: true });
    electron_1.app.on("ready", () => {
        debug("app ready");
        clearSessions(undefined, undefined);
        if (electron_1.session.defaultSession) {
            electron_1.session.defaultSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler, (error) => {
                if (error) {
                    debug(error);
                }
                else {
                    debug("registerHttpProtocol OKAY (default session)");
                }
            });
        }
        const webViewSession = getWebViewSession();
        if (webViewSession) {
            webViewSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler, (error) => {
                if (error) {
                    debug(error);
                }
                else {
                    debug("registerHttpProtocol OKAY (webview session)");
                }
            });
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
            "syncable",
        ],
        storages: [
            "appcache",
            "serviceworkers",
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