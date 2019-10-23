"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var debug_ = require("debug");
var electron_1 = require("electron");
var sessions_1 = require("../common/sessions");
var debug = debug_("r2:navigator#electron/main/sessions");
function promiseAllSettled(promises) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var promises_;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            promises_ = promises.map(function (promise) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2, promise
                            .then(function (value) {
                            return {
                                status: "fulfilled",
                                value: value,
                            };
                        })
                            .catch(function (reason) {
                            return {
                                reason: reason,
                                status: "rejected",
                            };
                        })];
                });
            }); });
            return [2, Promise.all(promises_)];
        });
    });
}
function secureSessions(server) {
    var filter = { urls: ["*://*/*"] };
    var onHeadersReceivedCB = function (details, callback) {
        if (!details.url) {
            callback({});
            return;
        }
        var serverUrl = server.serverUrl();
        if ((serverUrl && details.url.startsWith(serverUrl)) ||
            details.url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
            callback({
                responseHeaders: tslib_1.__assign(tslib_1.__assign({}, details.responseHeaders), { "Content-Security-Policy": ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: " + sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + ": " + serverUrl] }),
            });
        }
        else {
            callback({});
        }
    };
    var onBeforeSendHeadersCB = function (details, callback) {
        if (!details.url) {
            callback({});
            return;
        }
        var serverUrl = server.serverUrl();
        if (server.isSecured() &&
            ((serverUrl && details.url.startsWith(serverUrl)) ||
                details.url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {
            var header = server.getSecureHTTPHeader(details.url);
            if (header) {
                details.requestHeaders[header.name] = header.value;
            }
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
        else {
            callback({ cancel: false });
        }
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
        electron_1.session.defaultSession.webRequest.onHeadersReceived(filter, onHeadersReceivedCB);
        electron_1.session.defaultSession.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCB);
        electron_1.session.defaultSession.setCertificateVerifyProc(setCertificateVerifyProcCB);
    }
    var webViewSession = getWebViewSession();
    if (webViewSession) {
        webViewSession.webRequest.onHeadersReceived(filter, onHeadersReceivedCB);
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
var httpProtocolHandler = function (request, callback) {
    var url = sessions_1.convertCustomSchemeToHttpUrl(request.url);
    callback({
        method: request.method,
        url: url,
    });
};
function initSessions() {
    var _this = this;
    if (electron_1.protocol.registerStandardSchemes) {
        electron_1.protocol.registerStandardSchemes([sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL], { secure: true });
    }
    else {
        electron_1.protocol.registerSchemesAsPrivileged([{
                privileges: {
                    allowServiceWorkers: false,
                    bypassCSP: false,
                    corsEnabled: true,
                    secure: true,
                    standard: true,
                    supportFetchAPI: true,
                },
                scheme: sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL,
            }]);
    }
    electron_1.app.on("ready", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var err_1, webViewSession;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("app ready");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, clearSessions()];
                case 2:
                    _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    return [3, 4];
                case 4:
                    if (electron_1.session.defaultSession) {
                        electron_1.session.defaultSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler, function (error) {
                            if (error) {
                                debug(error);
                            }
                            else {
                                debug("registerHttpProtocol OKAY (default session)");
                            }
                        });
                    }
                    webViewSession = getWebViewSession();
                    if (webViewSession) {
                        webViewSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler, function (error) {
                            if (error) {
                                debug(error);
                            }
                            else {
                                debug("registerHttpProtocol OKAY (webview session)");
                            }
                        });
                        webViewSession.setPermissionRequestHandler(function (wc, permission, callback) {
                            debug("setPermissionRequestHandler");
                            debug(wc.getURL());
                            debug(permission);
                            callback(true);
                        });
                    }
                    return [2];
            }
        });
    }); });
    function willQuitCallback(evt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debug("app will quit");
                        evt.preventDefault();
                        electron_1.app.removeListener("will-quit", willQuitCallback);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, clearSessions()];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        err_2 = _a.sent();
                        debug(err_2);
                        return [3, 4];
                    case 4:
                        debug("Cache and StorageData cleared, now quitting...");
                        electron_1.app.quit();
                        return [2];
                }
            });
        });
    }
    electron_1.app.on("will-quit", willQuitCallback);
}
exports.initSessions = initSessions;
function clearSession(sess, str) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var prom1, prom2, results, results_1, results_1_1, result, err_3;
        var e_1, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prom1 = sess.clearCache();
                    prom2 = sess.clearStorageData({
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
                    });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4, promiseAllSettled([prom1, prom2])];
                case 2:
                    results = _b.sent();
                    try {
                        for (results_1 = tslib_1.__values(results), results_1_1 = results_1.next(); !results_1_1.done; results_1_1 = results_1.next()) {
                            result = results_1_1.value;
                            debug("SESSION CACHE + STORAGE DATA CLEARED - " + str + " => " + result.status);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (results_1_1 && !results_1_1.done && (_a = results_1.return)) _a.call(results_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [3, 4];
                case 3:
                    err_3 = _b.sent();
                    debug(err_3);
                    return [3, 4];
                case 4: return [2, Promise.resolve()];
            }
        });
    });
}
exports.clearSession = clearSession;
function getWebViewSession() {
    return electron_1.session.fromPartition(sessions_1.R2_SESSION_WEBVIEW, { cache: true });
}
exports.getWebViewSession = getWebViewSession;
function clearWebviewSession() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var sess, err_4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sess = getWebViewSession();
                    if (!sess) return [3, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, clearSession(sess, "[" + sessions_1.R2_SESSION_WEBVIEW + "]")];
                case 2:
                    _a.sent();
                    return [3, 4];
                case 3:
                    err_4 = _a.sent();
                    debug(err_4);
                    return [3, 4];
                case 4: return [2, Promise.resolve()];
            }
        });
    });
}
exports.clearWebviewSession = clearWebviewSession;
function clearDefaultSession() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var err_5;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!electron_1.session.defaultSession) return [3, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, clearSession(electron_1.session.defaultSession, "[default]")];
                case 2:
                    _a.sent();
                    return [3, 4];
                case 3:
                    err_5 = _a.sent();
                    debug(err_5);
                    return [3, 4];
                case 4: return [2, Promise.resolve()];
            }
        });
    });
}
exports.clearDefaultSession = clearDefaultSession;
function clearSessions() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var err_6;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, promiseAllSettled([clearDefaultSession(), clearWebviewSession()])];
                case 1:
                    _a.sent();
                    return [3, 3];
                case 2:
                    err_6 = _a.sent();
                    debug(err_6);
                    return [3, 3];
                case 3: return [2, Promise.resolve()];
            }
        });
    });
}
exports.clearSessions = clearSessions;
//# sourceMappingURL=sessions.js.map