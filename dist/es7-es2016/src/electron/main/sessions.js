"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_ = require("debug");
const electron_1 = require("electron");
const sessions_1 = require("../common/sessions");
const debug = debug_("r2:navigator#electron/main/sessions");
function promiseAllSettled(promises) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const promises_ = promises.map((promise) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            return promise
                .then((value) => {
                return {
                    status: "fulfilled",
                    value,
                };
            })
                .catch((reason) => {
                return {
                    reason,
                    status: "rejected",
                };
            });
        }));
        return Promise.all(promises_);
    });
}
function secureSessions(server) {
    const filter = { urls: ["*://*/*"] };
    const onHeadersReceivedCB = (details, callback) => {
        if (!details.url) {
            callback({});
            return;
        }
        const serverUrl = server.serverUrl();
        if ((serverUrl && details.url.startsWith(serverUrl)) ||
            details.url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
            callback({
                responseHeaders: Object.assign(Object.assign({}, details.responseHeaders), { "Content-Security-Policy": [`default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ${sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL}: ${serverUrl}`] }),
            });
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
    electron_1.app.on("ready", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        debug("app ready");
        try {
            yield clearSessions();
        }
        catch (err) {
            debug(err);
        }
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
    }));
    function willQuitCallback(evt) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            debug("app will quit");
            evt.preventDefault();
            electron_1.app.removeListener("will-quit", willQuitCallback);
            try {
                yield clearSessions();
            }
            catch (err) {
                debug(err);
            }
            debug("Cache and StorageData cleared, now quitting...");
            electron_1.app.quit();
        });
    }
    electron_1.app.on("will-quit", willQuitCallback);
}
exports.initSessions = initSessions;
function clearSession(sess, str) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const prom1 = sess.clearCache();
        const prom2 = sess.clearStorageData({
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
        try {
            const results = yield promiseAllSettled([prom1, prom2]);
            for (const result of results) {
                debug(`SESSION CACHE + STORAGE DATA CLEARED - ${str} => ${result.status}`);
            }
        }
        catch (err) {
            debug(err);
        }
        return Promise.resolve();
    });
}
exports.clearSession = clearSession;
function getWebViewSession() {
    return electron_1.session.fromPartition(sessions_1.R2_SESSION_WEBVIEW, { cache: true });
}
exports.getWebViewSession = getWebViewSession;
function clearWebviewSession() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sess = getWebViewSession();
        if (sess) {
            try {
                yield clearSession(sess, "[" + sessions_1.R2_SESSION_WEBVIEW + "]");
            }
            catch (err) {
                debug(err);
            }
        }
        return Promise.resolve();
    });
}
exports.clearWebviewSession = clearWebviewSession;
function clearDefaultSession() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (electron_1.session.defaultSession) {
            try {
                yield clearSession(electron_1.session.defaultSession, "[default]");
            }
            catch (err) {
                debug(err);
            }
        }
        return Promise.resolve();
    });
}
exports.clearDefaultSession = clearDefaultSession;
function clearSessions() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield promiseAllSettled([clearDefaultSession(), clearWebviewSession()]);
        }
        catch (err) {
            debug(err);
        }
        return Promise.resolve();
    });
}
exports.clearSessions = clearSessions;
//# sourceMappingURL=sessions.js.map