"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSessions = exports.clearDefaultSession = exports.clearWebviewSession = exports.getWebViewSession = exports.clearSession = exports.initSessions = exports.secureSessions = void 0;
const debug_ = require("debug");
const electron_1 = require("electron");
const request = require("request");
const requestPromise = require("request-promise-native");
const transformer_1 = require("r2-shared-js/dist/es8-es2017/src/transform/transformer");
const transformer_html_1 = require("r2-shared-js/dist/es8-es2017/src/transform/transformer-html");
const dom_1 = require("../common/dom");
const sessions_1 = require("../common/sessions");
const url_params_1 = require("../renderer/common/url-params");
const debug = debug_("r2:navigator#electron/main/sessions");
const USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP = true;
async function promiseAllSettled(promises) {
    const promises_ = promises.map(async (promise) => {
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
    });
    return Promise.all(promises_);
}
let _server;
function secureSessions(server) {
    _server = server;
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
                cancel: false,
                responseHeaders: Object.assign(Object.assign({}, details.responseHeaders), { "Content-Security-Policy": [`default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ${sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL}: ${serverUrl}`] }),
            });
        }
        else {
            callback({
                cancel: false,
                responseHeaders: Object.assign({}, details.responseHeaders),
            });
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
            callback({
                cancel: false,
                requestHeaders: Object.assign({}, details.requestHeaders),
            });
        }
        else {
            callback({
                cancel: false,
                requestHeaders: Object.assign({}, details.requestHeaders),
            });
        }
    };
    const setCertificateVerifyProcCB = (req, callback) => {
        if (server.isSecured()) {
            const info = server.serverInfo();
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
let _customUrlProtocolSchemeHandlerWasCalled = false;
const streamProtocolHandler = async (req, callback) => {
    _customUrlProtocolSchemeHandlerWasCalled = true;
    const url = (0, sessions_1.convertCustomSchemeToHttpUrl)(req.url);
    const u = new URL(url);
    let ref = u.origin;
    if (req.referrer && req.referrer.trim()) {
        ref = req.referrer;
    }
    const failure = (err) => {
        debug(err);
        callback({});
    };
    const success = (response) => {
        const headers = {};
        Object.keys(response.headers).forEach((header) => {
            const val = response.headers[header];
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
        const obj = {
            data: response,
            headers,
            statusCode: response.statusCode,
        };
        callback(obj);
    };
    const reqHeaders = req.headers;
    if (_server) {
        const serverUrl = _server.serverUrl();
        if (_server.isSecured() &&
            ((serverUrl && url.startsWith(serverUrl)) ||
                url.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {
            const header = _server.getSecureHTTPHeader(url);
            if (header) {
                reqHeaders[header.name] = header.value;
            }
        }
    }
    const needsStreamingResponse = true;
    if (needsStreamingResponse) {
        request.get({
            headers: reqHeaders,
            method: "GET",
            rejectUnauthorized: false,
            uri: url,
        })
            .on("response", (response) => {
            success(response);
        })
            .on("error", (err) => {
            failure(err);
        });
    }
    else {
        let response;
        try {
            response = await requestPromise({
                headers: reqHeaders,
                method: "GET",
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                uri: url,
            });
            success(response);
        }
        catch (err) {
            failure(err);
        }
    }
};
const httpProtocolHandler = (req, callback) => {
    _customUrlProtocolSchemeHandlerWasCalled = true;
    const url = (0, sessions_1.convertCustomSchemeToHttpUrl)(req.url);
    callback({
        method: req.method,
        session: getWebViewSession(),
        url,
    });
};
const transformerAudioVideo = (_publication, link, url, htmlStr, _sessionInfo) => {
    if (!_customUrlProtocolSchemeHandlerWasCalled) {
        return htmlStr;
    }
    if (!url) {
        return htmlStr;
    }
    if (htmlStr.indexOf("<audio") < 0 && htmlStr.indexOf("<video") < 0) {
        return htmlStr;
    }
    const iHtmlStart = htmlStr.indexOf("<html");
    if (iHtmlStart < 0) {
        return htmlStr;
    }
    const iBodyStart = htmlStr.indexOf("<body");
    if (iBodyStart < 0) {
        return htmlStr;
    }
    const parseableChunk = htmlStr.substr(iHtmlStart);
    const htmlStrToParse = `<?xml version="1.0" encoding="utf-8"?>${parseableChunk}`;
    let mediaType = "application/xhtml+xml";
    if (link && link.TypeLink) {
        mediaType = link.TypeLink;
    }
    const documant = (0, dom_1.parseDOM)(htmlStrToParse, mediaType);
    let urlHttp = url;
    if (urlHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        urlHttp = (0, sessions_1.convertCustomSchemeToHttpUrl)(urlHttp);
    }
    const url_ = new URL(urlHttp);
    url_.search = "";
    url_.hash = "";
    const urlStr = url_.toString();
    const patchElementSrc = (el) => {
        const src = el.getAttribute("src");
        if (!src || src[0] === "/" ||
            /^https?:\/\//.test(src) || /^data:\/\//.test(src)) {
            return;
        }
        let src_ = src;
        if (src_.startsWith("./")) {
            src_ = src_.substr(2);
        }
        src_ = `${urlStr}/../${src_}`;
        debug(`VIDEO/AUDIO SRC PATCH: ${src} ==> ${src_}`);
        el.setAttribute("src", src_);
    };
    const processTree = (el) => {
        let elName = el.nodeName.toLowerCase();
        if (elName === "audio" || elName === "video") {
            patchElementSrc(el);
            if (!el.childNodes) {
                return;
            }
            for (let i = 0; i < el.childNodes.length; i++) {
                const childNode = el.childNodes[i];
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
            for (let i = 0; i < el.childNodes.length; i++) {
                const childNode = el.childNodes[i];
                if (childNode.nodeType === 1) {
                    processTree(childNode);
                }
            }
        }
    };
    processTree(documant.body);
    const serialized = (0, dom_1.serializeDOM)(documant);
    const prefix = htmlStr.substr(0, iHtmlStart);
    const iHtmlStart_ = serialized.indexOf("<html");
    if (iHtmlStart_ < 0) {
        return htmlStr;
    }
    const remaining = serialized.substr(iHtmlStart_);
    const newStr = `${prefix}${remaining}`;
    return newStr;
};
const transformerHttpBaseIframes = (_publication, link, url, htmlStr, _sessionInfo) => {
    if (!_customUrlProtocolSchemeHandlerWasCalled) {
        return htmlStr;
    }
    if (!url) {
        return htmlStr;
    }
    if (htmlStr.indexOf("<iframe") < 0) {
        return htmlStr;
    }
    const iHtmlStart = htmlStr.indexOf("<html");
    if (iHtmlStart < 0) {
        return htmlStr;
    }
    const iBodyStart = htmlStr.indexOf("<body");
    if (iBodyStart < 0) {
        return htmlStr;
    }
    const parseableChunk = htmlStr.substr(iHtmlStart);
    const htmlStrToParse = `<?xml version="1.0" encoding="utf-8"?>${parseableChunk}`;
    let mediaType = "application/xhtml+xml";
    if (link && link.TypeLink) {
        mediaType = link.TypeLink;
    }
    const documant = (0, dom_1.parseDOM)(htmlStrToParse, mediaType);
    let urlHttp = url;
    if (!urlHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        urlHttp = (0, sessions_1.convertHttpUrlToCustomScheme)(urlHttp);
    }
    const url_ = new URL(urlHttp);
    const r2CSS = url_.searchParams.get(url_params_1.URL_PARAM_CSS);
    const r2ERS = url_.searchParams.get(url_params_1.URL_PARAM_EPUBREADINGSYSTEM);
    const r2DEBUG = url_.searchParams.get(url_params_1.URL_PARAM_DEBUG_VISUALS);
    const r2CLIPBOARDINTERCEPT = url_.searchParams.get(url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT);
    const r2SESSIONINFO = url_.searchParams.get(url_params_1.URL_PARAM_SESSION_INFO);
    const r2WEBVIEWSLOT = url_.searchParams.get(url_params_1.URL_PARAM_WEBVIEW_SLOT);
    const r2SECONDWEBVIEW = url_.searchParams.get(url_params_1.URL_PARAM_SECOND_WEBVIEW);
    url_.search = "";
    url_.hash = "";
    const urlStr = url_.toString();
    const patchElementSrc = (el) => {
        const src = el.getAttribute("src");
        if (!src || src[0] === "/" ||
            /^https?:\/\//.test(src) || /^data:\/\//.test(src)) {
            return;
        }
        let src_ = src;
        if (src_.startsWith("./")) {
            src_ = src_.substr(2);
        }
        src_ = `${urlStr}/../${src_}`;
        const iframeUrl = new URL(src_);
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
        if (r2WEBVIEWSLOT) {
            iframeUrl.searchParams.append(url_params_1.URL_PARAM_WEBVIEW_SLOT, r2WEBVIEWSLOT);
        }
        if (r2SECONDWEBVIEW) {
            iframeUrl.searchParams.append(url_params_1.URL_PARAM_SECOND_WEBVIEW, r2SECONDWEBVIEW);
        }
        iframeUrl.searchParams.append(url_params_1.URL_PARAM_IS_IFRAME, "1");
        src_ = iframeUrl.toString();
        debug(`IFRAME SRC PATCH: ${src} ==> ${src_}`);
        el.setAttribute("src", src_);
    };
    const processTree = (el) => {
        const elName = el.nodeName.toLowerCase();
        if (elName === "iframe") {
            patchElementSrc(el);
        }
        else {
            if (!el.childNodes) {
                return;
            }
            for (let i = 0; i < el.childNodes.length; i++) {
                const childNode = el.childNodes[i];
                if (childNode.nodeType === 1) {
                    processTree(childNode);
                }
            }
        }
    };
    processTree(documant.body);
    const serialized = (0, dom_1.serializeDOM)(documant);
    const prefix = htmlStr.substr(0, iHtmlStart);
    const iHtmlStart_ = serialized.indexOf("<html");
    if (iHtmlStart_ < 0) {
        return htmlStr;
    }
    const remaining = serialized.substr(iHtmlStart_);
    const newStr = `${prefix}${remaining}`;
    return newStr;
};
const transformerHttpBase = (publication, link, url, htmlStr, sessionInfo) => {
    if (!_customUrlProtocolSchemeHandlerWasCalled) {
        return htmlStr;
    }
    if (!url) {
        return htmlStr;
    }
    const iHead = htmlStr.indexOf("</head>");
    if (iHead < 0) {
        return htmlStr;
    }
    let urlHttp = url;
    if (urlHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        urlHttp = (0, sessions_1.convertCustomSchemeToHttpUrl)(urlHttp);
    }
    const url_ = new URL(urlHttp);
    url_.search = "";
    url_.hash = "";
    const urlStr = url_.toString();
    const baseStr = `
<base href="${urlStr}" />
`;
    let newStr = htmlStr.substr(0, iHead) + baseStr + htmlStr.substr(iHead);
    newStr = newStr.replace(/<(audio|video)/g, "<$1 data-r2-crossorigin=\"true\" crossorigin=\"anonymous\" ");
    newStr = transformerHttpBaseIframes(publication, link, url, newStr, sessionInfo);
    return newStr;
};
const INJECT_HTTP_BASE = true;
function initSessions() {
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
                    stream: true,
                    supportFetchAPI: true,
                },
                scheme: sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL,
            }]);
    }
    electron_1.app.on("ready", async () => {
        debug("app ready");
        try {
            await clearSessions();
        }
        catch (err) {
            debug(err);
        }
        if (electron_1.session.defaultSession) {
            if (USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP) {
                electron_1.session.defaultSession.protocol.registerStreamProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, streamProtocolHandler);
            }
            else {
                electron_1.session.defaultSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler);
            }
        }
        const webViewSession = getWebViewSession();
        if (webViewSession) {
            if (USE_STREAM_PROTOCOL_INSTEAD_OF_HTTP) {
                webViewSession.protocol.registerStreamProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, streamProtocolHandler);
            }
            else {
                webViewSession.protocol.registerHttpProtocol(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, httpProtocolHandler);
            }
            webViewSession.setPermissionRequestHandler((wc, permission, callback) => {
                debug("setPermissionRequestHandler");
                debug(wc.getURL());
                debug(permission);
                callback(true);
            });
        }
    });
}
exports.initSessions = initSessions;
async function clearSession(sess, str) {
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
            "cachestorage",
        ],
    });
    try {
        const results = await promiseAllSettled([prom1, prom2]);
        for (const result of results) {
            debug(`SESSION CACHE + STORAGE DATA CLEARED - ${str} => ${result.status}`);
        }
    }
    catch (err) {
        debug(err);
    }
    return Promise.resolve();
}
exports.clearSession = clearSession;
function getWebViewSession() {
    return electron_1.session.fromPartition(sessions_1.R2_SESSION_WEBVIEW, { cache: true });
}
exports.getWebViewSession = getWebViewSession;
async function clearWebviewSession() {
    const sess = getWebViewSession();
    if (sess) {
        try {
            await clearSession(sess, "[" + sessions_1.R2_SESSION_WEBVIEW + "]");
        }
        catch (err) {
            debug(err);
        }
    }
    return Promise.resolve();
}
exports.clearWebviewSession = clearWebviewSession;
async function clearDefaultSession() {
    if (electron_1.session.defaultSession) {
        try {
            await clearSession(electron_1.session.defaultSession, "[default]");
        }
        catch (err) {
            debug(err);
        }
    }
    return Promise.resolve();
}
exports.clearDefaultSession = clearDefaultSession;
async function clearSessions() {
    try {
        await promiseAllSettled([clearDefaultSession(), clearWebviewSession()]);
    }
    catch (err) {
        debug(err);
    }
    return Promise.resolve();
}
exports.clearSessions = clearSessions;
//# sourceMappingURL=sessions.js.map