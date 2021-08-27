"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCustomSchemeToHttpUrl = exports.convertHttpUrlToCustomScheme = exports.READIUM2_ELECTRON_HTTP_PROTOCOL = exports.R2_SESSION_WEBVIEW = void 0;
exports.R2_SESSION_WEBVIEW = "persist:readium2pubwebview";
const UrlUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/http/UrlUtils");
exports.READIUM2_ELECTRON_HTTP_PROTOCOL = "httpsr2";
const convertHttpUrlToCustomScheme = (url) => {
    const matches = url.match(/(http[s]?):\/\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)(?::([0-9]+))?\/pub\/([^\/]+)(\/.*)?/);
    if (matches && matches.length > 1) {
        const idMatch = matches[4];
        const decoded = decodeURIComponent(idMatch);
        const pubID = decoded.replace(/([A-Z])/g, "_$1").replace(/=/g, "-").replace(/\//g, ".");
        const url_ = exports.READIUM2_ELECTRON_HTTP_PROTOCOL + "://" +
            "id" + pubID +
            "/x" + matches[1] +
            "/ip" + matches[2] +
            "/p" + matches[3] +
            matches[5];
        return url_;
    }
    return url;
};
exports.convertHttpUrlToCustomScheme = convertHttpUrlToCustomScheme;
const convertCustomSchemeToHttpUrl = (url) => {
    let url_ = url.replace(exports.READIUM2_ELECTRON_HTTP_PROTOCOL + "://", "");
    const matches = url_.match(/id([^\/]+)\/x(http[s]?)\/ip([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\/p([0-9]+)?(\/.*)?/);
    if (matches && matches.length > 1) {
        const pubID = (0, UrlUtils_1.encodeURIComponent_RFC3986)(matches[1].replace(/-/g, "=").replace(/\./g, "\/").replace(/(_[a-zA-Z])/g, (match) => {
            const ret = match.substr(1).toUpperCase();
            return ret;
        }));
        url_ = matches[2] + "://" +
            matches[3] + ":" + matches[4] +
            "/pub/" + pubID +
            matches[5];
        return url_;
    }
    return url;
};
exports.convertCustomSchemeToHttpUrl = convertCustomSchemeToHttpUrl;
//# sourceMappingURL=sessions.js.map