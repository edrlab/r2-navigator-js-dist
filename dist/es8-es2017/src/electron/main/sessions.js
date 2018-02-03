"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const debug_ = require("debug");
const electron_1 = require("electron");
const sessions_1 = require("../common/sessions");
const debug = debug_("r2:navigator#electron/main/sessions");
function secureSessions(server) {
    const filter = { urls: ["*", "*://*/*"] };
    const onBeforeSendHeadersCB = (details, callback) => {
        if (server.isSecured()) {
            const info = server.serverInfo();
            if (info && info.trustKey && info.trustCheck) {
                const AES_BLOCK_SIZE = 16;
                const encrypteds = [];
                const ivBuff = new Buffer(info.trustCheck);
                debug(ivBuff.length);
                const iv = ivBuff.slice(0, AES_BLOCK_SIZE);
                debug(iv.length);
                encrypteds.push(iv);
                const encryptStream = crypto.createCipheriv("aes-256-cbc", info.trustKey, iv);
                encryptStream.setAutoPadding(true);
                const buff1 = encryptStream.update(details.url);
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