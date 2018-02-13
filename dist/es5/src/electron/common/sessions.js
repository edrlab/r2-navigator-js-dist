"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2_SESSION_WEBVIEW = "persist:readium2pubwebview";
exports.READIUM2_ELECTRON_HTTP_PROTOCOL = "httpsr2";
exports.convertHttpUrlToCustomScheme = function (url) {
    var matches = url.match(/(http[s]?):\/\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)(?::([0-9]+))?\/pub\/([^\/]+)(\/.*)?/);
    if (matches && matches.length > 1) {
        var pubID = matches[4].replace(/([A-Z])/g, "_$1");
        var url_ = exports.READIUM2_ELECTRON_HTTP_PROTOCOL +
            "://" + matches[1] +
            ".ip" + matches[2] +
            ".p" + matches[3] +
            ".id" + pubID +
            matches[5];
        return url_;
    }
    return url;
};
exports.convertCustomSchemeToHttpUrl = function (url) {
    var url_ = url.replace(exports.READIUM2_ELECTRON_HTTP_PROTOCOL + "://", "");
    var matches = url_.match(/(http[s]?)\.ip([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.p([0-9]+)?\.id([^\/]+)(\/.*)?/);
    if (matches && matches.length > 1) {
        var pubID = matches[4].replace(/(_[a-zA-Z])/g, function (match) {
            var ret = match.substr(1).toUpperCase();
            return ret;
        });
        url_ = matches[1] + "://" +
            matches[2] + ":" + matches[3] +
            "/pub/" + pubID +
            matches[5];
        return url_;
    }
    return url;
};
//# sourceMappingURL=sessions.js.map