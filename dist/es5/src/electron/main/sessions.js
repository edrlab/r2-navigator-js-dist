"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var debug_ = require("debug");
var electron_1 = require("electron");
var request = require("request");
var requestPromise = require("request-promise-native");
var transformer_1 = require("r2-shared-js/dist/es5/src/transform/transformer");
var transformer_html_1 = require("r2-shared-js/dist/es5/src/transform/transformer-html");
var dom_1 = require("../common/dom");
var sessions_1 = require("../common/sessions");
var url_params_1 = require("../renderer/common/url-params");
var debug = debug_("r2:navigator#electron/main/sessions");
var USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP = true;
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
var _server;
function secureSessions(server) {
    _server = server;
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
    var setCertificateVerifyProcCB = function (req, callback) {
        if (server.isSecured()) {
            var info = server.serverInfo();
            if (info) {
                if (req.hostname === info.urlHost) {
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
var _customUrlProtocolSchemeHandlerWasCalled = false;
var streamProtocolHandler = function (req, callback) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var url, u, ref, failure, success, reqHeaders, serverUrl, header, needsStreamingResponse, response, err_1;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _customUrlProtocolSchemeHandlerWasCalled = true;
                url = sessions_1.convertCustomSchemeToHttpUrl(req.url);
                u = new URL(url);
                ref = u.origin;
                if (req.referrer && req.referrer.trim()) {
                    ref = req.referrer;
                }
                failure = function (err) {
                    debug(err);
                    callback();
                };
                success = function (response) {
                    var headers = {};
                    Object.keys(response.headers).forEach(function (header) {
                        var val = response.headers[header];
                        if (val) {
                            headers[header] = val;
                        }
                    });
                    if (!headers.referer) {
                        headers.referer = ref;
                    }
                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                        failure("HTTP CODE " + response.statusCode);
                        return;
                    }
                    response
                        .on("error", function h() {
                        debug("RESPONSE ERROR " + url);
                    });
                    var obj = {
                        data: response,
                        headers: headers,
                        statusCode: response.statusCode,
                    };
                    callback(obj);
                };
                reqHeaders = req.headers;
                if (_server) {
                    serverUrl = _server.serverUrl();
                    if (_server.isSecured() &&
                        ((serverUrl && url.startsWith(serverUrl)) ||
                            url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {
                        header = _server.getSecureHTTPHeader(url);
                        if (header) {
                            reqHeaders[header.name] = header.value;
                        }
                    }
                }
                needsStreamingResponse = true;
                if (!needsStreamingResponse) return [3, 1];
                request.get({
                    headers: reqHeaders,
                    method: "GET",
                    rejectUnauthorized: false,
                    uri: url,
                })
                    .on("response", function (response) {
                    success(response);
                })
                    .on("error", function (err) {
                    failure(err);
                });
                return [3, 5];
            case 1:
                response = void 0;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4, requestPromise({
                        headers: reqHeaders,
                        method: "GET",
                        rejectUnauthorized: false,
                        resolveWithFullResponse: true,
                        uri: url,
                    })];
            case 3:
                response = _a.sent();
                success(response);
                return [3, 5];
            case 4:
                err_1 = _a.sent();
                failure(err_1);
                return [3, 5];
            case 5: return [2];
        }
    });
}); };
var httpProtocolHandler = function (req, callback) {
    _customUrlProtocolSchemeHandlerWasCalled = true;
    var url = sessions_1.convertCustomSchemeToHttpUrl(req.url);
    callback({
        method: req.method,
        session: getWebViewSession(),
        url: url,
    });
};
var transformerAudioVideo = function (_publication, link, url, htmlStr, _sessionInfo) {
    if (!_customUrlProtocolSchemeHandlerWasCalled) {
        return htmlStr;
    }
    if (!url) {
        return htmlStr;
    }
    if (htmlStr.indexOf("<audio") < 0 && htmlStr.indexOf("<video") < 0) {
        return htmlStr;
    }
    var iHtmlStart = htmlStr.indexOf("<html");
    if (iHtmlStart < 0) {
        return htmlStr;
    }
    var iBodyStart = htmlStr.indexOf("<body");
    if (iBodyStart < 0) {
        return htmlStr;
    }
    var parseableChunk = htmlStr.substr(iHtmlStart);
    var htmlStrToParse = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + parseableChunk;
    var mediaType = "application/xhtml+xml";
    if (link && link.TypeLink) {
        mediaType = link.TypeLink;
    }
    var documant = dom_1.parseDOM(htmlStrToParse, mediaType);
    var urlHttp = url;
    if (urlHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        urlHttp = sessions_1.convertCustomSchemeToHttpUrl(urlHttp);
    }
    var url_ = new URL(urlHttp);
    url_.search = "";
    url_.hash = "";
    var urlStr = url_.toString();
    var patchElementSrc = function (el) {
        var src = el.getAttribute("src");
        if (!src || src[0] === "/" ||
            /^http[s]?:\/\//.test(src) || /^data:\/\//.test(src)) {
            return;
        }
        var src_ = src;
        if (src_.startsWith("./")) {
            src_ = src_.substr(2);
        }
        src_ = urlStr + "/../" + src_;
        debug("VIDEO/AUDIO SRC PATCH: " + src + " ==> " + src_);
        el.setAttribute("src", src_);
    };
    var processTree = function (el) {
        var elName = el.nodeName.toLowerCase();
        if (elName === "audio" || elName === "video") {
            patchElementSrc(el);
            if (!el.childNodes) {
                return;
            }
            for (var i = 0; i < el.childNodes.length; i++) {
                var childNode = el.childNodes[i];
                if (childNode.nodeType === 1) {
                    elName = childNode.nodeName.toLowerCase();
                    if (elName === "source") {
                        patchElementSrc(childNode);
                    }
                }
            }
        }
        else {
            if (!el.childNodes) {
                return;
            }
            for (var i = 0; i < el.childNodes.length; i++) {
                var childNode = el.childNodes[i];
                if (childNode.nodeType === 1) {
                    processTree(childNode);
                }
            }
        }
    };
    processTree(documant.body);
    var serialized = dom_1.serializeDOM(documant);
    var prefix = htmlStr.substr(0, iHtmlStart);
    var iHtmlStart_ = serialized.indexOf("<html");
    if (iHtmlStart_ < 0) {
        return htmlStr;
    }
    var remaining = serialized.substr(iHtmlStart_);
    var newStr = "" + prefix + remaining;
    return newStr;
};
var transformerHttpBaseIframes = function (_publication, link, url, htmlStr, _sessionInfo) {
    if (!_customUrlProtocolSchemeHandlerWasCalled) {
        return htmlStr;
    }
    if (!url) {
        return htmlStr;
    }
    if (htmlStr.indexOf("<iframe") < 0) {
        return htmlStr;
    }
    var iHtmlStart = htmlStr.indexOf("<html");
    if (iHtmlStart < 0) {
        return htmlStr;
    }
    var iBodyStart = htmlStr.indexOf("<body");
    if (iBodyStart < 0) {
        return htmlStr;
    }
    var parseableChunk = htmlStr.substr(iHtmlStart);
    var htmlStrToParse = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + parseableChunk;
    var mediaType = "application/xhtml+xml";
    if (link && link.TypeLink) {
        mediaType = link.TypeLink;
    }
    var documant = dom_1.parseDOM(htmlStrToParse, mediaType);
    var urlHttp = url;
    if (!urlHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        urlHttp = sessions_1.convertHttpUrlToCustomScheme(urlHttp);
    }
    var url_ = new URL(urlHttp);
    var r2CSS = url_.searchParams.get(url_params_1.URL_PARAM_CSS);
    var r2ERS = url_.searchParams.get(url_params_1.URL_PARAM_EPUBREADINGSYSTEM);
    var r2DEBUG = url_.searchParams.get(url_params_1.URL_PARAM_DEBUG_VISUALS);
    var r2CLIPBOARDINTERCEPT = url_.searchParams.get(url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT);
    var r2SESSIONINFO = url_.searchParams.get(url_params_1.URL_PARAM_SESSION_INFO);
    url_.search = "";
    url_.hash = "";
    var urlStr = url_.toString();
    var patchElementSrc = function (el) {
        var src = el.getAttribute("src");
        if (!src || src[0] === "/" ||
            /^http[s]?:\/\//.test(src) || /^data:\/\//.test(src)) {
            return;
        }
        var src_ = src;
        if (src_.startsWith("./")) {
            src_ = src_.substr(2);
        }
        src_ = urlStr + "/../" + src_;
        var iframeUrl = new URL(src_);
        if (r2CLIPBOARDINTERCEPT) {
            iframeUrl.searchParams.append(url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT, r2CLIPBOARDINTERCEPT);
        }
        if (r2SESSIONINFO) {
            iframeUrl.searchParams.append(url_params_1.URL_PARAM_SESSION_INFO, r2SESSIONINFO);
        }
        if (r2DEBUG) {
            iframeUrl.searchParams.append(url_params_1.URL_PARAM_DEBUG_VISUALS, r2DEBUG);
        }
        if (r2ERS) {
            iframeUrl.searchParams.append(url_params_1.URL_PARAM_EPUBREADINGSYSTEM, r2ERS);
        }
        if (r2CSS) {
            iframeUrl.searchParams.append(url_params_1.URL_PARAM_CSS, r2CSS);
        }
        iframeUrl.searchParams.append(url_params_1.URL_PARAM_IS_IFRAME, "1");
        src_ = iframeUrl.toString();
        debug("IFRAME SRC PATCH: " + src + " ==> " + src_);
        el.setAttribute("src", src_);
    };
    var processTree = function (el) {
        var elName = el.nodeName.toLowerCase();
        if (elName === "iframe") {
            patchElementSrc(el);
        }
        else {
            if (!el.childNodes) {
                return;
            }
            for (var i = 0; i < el.childNodes.length; i++) {
                var childNode = el.childNodes[i];
                if (childNode.nodeType === 1) {
                    processTree(childNode);
                }
            }
        }
    };
    processTree(documant.body);
    var serialized = dom_1.serializeDOM(documant);
    var prefix = htmlStr.substr(0, iHtmlStart);
    var iHtmlStart_ = serialized.indexOf("<html");
    if (iHtmlStart_ < 0) {
        return htmlStr;
    }
    var remaining = serialized.substr(iHtmlStart_);
    var newStr = "" + prefix + remaining;
    return newStr;
};
var transformerHttpBase = function (publication, link, url, htmlStr, sessionInfo) {
    if (!_customUrlProtocolSchemeHandlerWasCalled) {
        return htmlStr;
    }
    if (!url) {
        return htmlStr;
    }
    var iHead = htmlStr.indexOf("</head>");
    if (iHead < 0) {
        return htmlStr;
    }
    var urlHttp = url;
    if (urlHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        urlHttp = sessions_1.convertCustomSchemeToHttpUrl(urlHttp);
    }
    var url_ = new URL(urlHttp);
    url_.search = "";
    url_.hash = "";
    var urlStr = url_.toString();
    var baseStr = "\n<base href=\"" + urlStr + "\" />\n";
    var newStr = htmlStr.substr(0, iHead) + baseStr + htmlStr.substr(iHead);
    newStr = transformerHttpBaseIframes(publication, link, url, newStr, sessionInfo);
    return newStr;
};
var INJECT_HTTP_BASE = true;
function initSessions() {
    var _this = this;
    electron_1.app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    if (INJECT_HTTP_BASE) {
        transformer_1.Transformers.instance().add(new transformer_html_1.TransformerHTML(transformerHttpBase));
    }
    else {
        transformer_1.Transformers.instance().add(new transformer_html_1.TransformerHTML(transformerAudioVideo));
    }
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
        var err_2, webViewSession;
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
                    err_2 = _a.sent();
                    debug(err_2);
                    return [3, 4];
                case 4:
                    if (electron_1.session.defaultSession) {
                        if (USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP) {
                            electron_1.session.defaultSession.protocol.registerStreamProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, streamProtocolHandler, function (error) {
                                if (error) {
                                    debug("registerStreamProtocol ERROR (default session)");
                                    debug(error);
                                }
                                else {
                                    debug("registerStreamProtocol OKAY (default session)");
                                }
                            });
                        }
                        else {
                            electron_1.session.defaultSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler, function (error) {
                                if (error) {
                                    debug("registerHttpProtocol ERROR (default session)");
                                    debug(error);
                                }
                                else {
                                    debug("registerHttpProtocol OKAY (default session)");
                                }
                            });
                        }
                    }
                    webViewSession = getWebViewSession();
                    if (webViewSession) {
                        if (USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP) {
                            webViewSession.protocol.registerStreamProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, streamProtocolHandler, function (error) {
                                if (error) {
                                    debug("registerStreamProtocol ERROR (webview session)");
                                    debug(error);
                                }
                                else {
                                    debug("registerStreamProtocol OKAY (webview session)");
                                }
                            });
                        }
                        else {
                            webViewSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler, function (error) {
                                if (error) {
                                    debug("registerHttpProtocol ERROR (webview session)");
                                    debug(error);
                                }
                                else {
                                    debug("registerHttpProtocol OKAY (webview session)");
                                }
                            });
                        }
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
            var err_3;
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
                        err_3 = _a.sent();
                        debug(err_3);
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
        var prom1, prom2, results, results_1, results_1_1, result, err_4;
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
                    err_4 = _b.sent();
                    debug(err_4);
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
        var sess, err_5;
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
                    err_5 = _a.sent();
                    debug(err_5);
                    return [3, 4];
                case 4: return [2, Promise.resolve()];
            }
        });
    });
}
exports.clearWebviewSession = clearWebviewSession;
function clearDefaultSession() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var err_6;
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
                    err_6 = _a.sent();
                    debug(err_6);
                    return [3, 4];
                case 4: return [2, Promise.resolve()];
            }
        });
    });
}
exports.clearDefaultSession = clearDefaultSession;
function clearSessions() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var err_7;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, promiseAllSettled([clearDefaultSession(), clearWebviewSession()])];
                case 1:
                    _a.sent();
                    return [3, 3];
                case 2:
                    err_7 = _a.sent();
                    debug(err_7);
                    return [3, 3];
                case 3: return [2, Promise.resolve()];
            }
        });
    });
}
exports.clearSessions = clearSessions;
//# sourceMappingURL=sessions.js.map