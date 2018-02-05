"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
var debug_ = require("debug");
var electron_1 = require("electron");
var sessions_1 = require("../common/sessions");
var debug = debug_("r2:navigator#electron/main/sessions");
var debugHttps = debug_("r2:https");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function secureSessions(server) {
    var filter = { urls: ["*", "*://*/*"] };
    var onBeforeSendHeadersCB = function (details, callback) {
        if (server.isSecured()) {
            var info = server.serverInfo();
            if (info && info.trustKey && info.trustCheck && info.trustCheckIV) {
                var t1 = void 0;
                if (IS_DEV) {
                    t1 = process.hrtime();
                }
                var encrypteds = [];
                var encryptStream = crypto.createCipheriv("aes-256-cbc", info.trustKey, info.trustCheckIV);
                encryptStream.setAutoPadding(true);
                var now = Date.now();
                var jsonStr = "{\"url\":\"" + details.url + "\",\"time\":" + now + "}";
                var buff1 = encryptStream.update(jsonStr, "utf8");
                if (buff1) {
                    encrypteds.push(buff1);
                }
                var buff2 = encryptStream.final();
                if (buff2) {
                    encrypteds.push(buff2);
                }
                var encrypted = Buffer.concat(encrypteds);
                var base64 = new Buffer(encrypted).toString("base64");
                details.requestHeaders["X-" + info.trustCheck] = base64;
                if (IS_DEV) {
                    var t2 = process.hrtime(t1);
                    var seconds = t2[0];
                    var nanoseconds = t2[1];
                    var milliseconds = nanoseconds / 1e6;
                    debugHttps("< A > " + seconds + "s " + milliseconds + "ms [ " + details.url + " ]");
                }
            }
        }
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    };
    var setCertificateVerifyProcCB = function (request, callback) {
        if (server.isSecured()) {
            var info = server.serverInfo();
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
    var webViewSession = getWebViewSession();
    if (webViewSession) {
        webViewSession.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCB);
        webViewSession.setCertificateVerifyProc(setCertificateVerifyProcCB);
    }
    electron_1.app.on("certificate-error", function (event, _webContents, url, _error, _certificate, callback) {
        if (server.isSecured()) {
            var info = server.serverInfo();
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
    electron_1.app.on("ready", function () {
        debug("app ready");
        clearSessions(undefined, undefined);
        var webViewSession = getWebViewSession();
        if (webViewSession) {
            webViewSession.setPermissionRequestHandler(function (wc, permission, callback) {
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
        var done = false;
        setTimeout(function () {
            if (done) {
                return;
            }
            done = true;
            debug("Cache and StorageData clearance waited enough => force quitting...");
            electron_1.app.quit();
        }, 6000);
        var sessionCleared = 0;
        var callback = function () {
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
    sess.clearCache(function () {
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
    }, function () {
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
    var sess = getWebViewSession();
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
    var done = false;
    setTimeout(function () {
        if (done) {
            return;
        }
        done = true;
        debug("Cache and StorageData clearance waited enough (default session) => force webview session...");
        clearWebviewSession(callbackCache, callbackStorageData);
    }, 6000);
    var sessionCleared = 0;
    var callback = function () {
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