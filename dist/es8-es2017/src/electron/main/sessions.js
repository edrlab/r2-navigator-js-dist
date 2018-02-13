"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const debug_ = require("debug");
const electron_1 = require("electron");
const sessions_1 = require("../common/sessions");
const debug = debug_("r2:navigator#electron/main/sessions");
const debugHttps = debug_("r2:https");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function secureSessions(server) {
    const filter = { urls: ["*", "*://*/*"] };
    const onBeforeSendHeadersCB = (details, callback) => {
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info && info.trustKey && info.trustCheck && info.trustCheckIV) {
                let t1;
                if (IS_DEV) {
                    t1 = process.hrtime();
                }
                const encrypteds = [];
                const encryptStream = crypto.createCipheriv("aes-256-cbc", info.trustKey, info.trustCheckIV);
                encryptStream.setAutoPadding(true);
                const now = Date.now();
                const jsonStr = `{"url":"${details.url}","time":${now}}`;
                const buff1 = encryptStream.update(jsonStr, "utf8");
                if (buff1) {
                    encrypteds.push(buff1);
                }
                const buff2 = encryptStream.final();
                if (buff2) {
                    encrypteds.push(buff2);
                }
                const encrypted = Buffer.concat(encrypteds);
                const base64 = new Buffer(encrypted).toString("base64");
                details.requestHeaders["X-" + info.trustCheck] = base64;
                if (IS_DEV) {
                    const t2 = process.hrtime(t1);
                    const seconds = t2[0];
                    const nanoseconds = t2[1];
                    const milliseconds = nanoseconds / 1e6;
                    debugHttps(`< A > ${seconds}s ${milliseconds}ms [ ${details.url} ]`);
                }
            }
        }
        callback({ cancel: false, requestHeaders: details.requestHeaders });
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
        electron_1.session.defaultSession.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCB);
        electron_1.session.defaultSession.setCertificateVerifyProc(setCertificateVerifyProcCB);
    }
    const webViewSession = getWebViewSession();
    if (webViewSession) {
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