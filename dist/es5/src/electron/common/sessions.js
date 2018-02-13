"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2_SESSION_WEBVIEW = "persist:readium2pubwebview";
exports.READIUM2_ELECTRON_HTTP_PROTOCOL = "httpsr2";
exports.convertHttpUrlToCustomScheme = function (url) {
    var matches = url.match(/(http[s]?):\/\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)(?::([0-9]+))?\/pub\/([^\/]+)(\/.*)?/);
    if (matches && matches.length > 1) {
        var pubID = matches[4].replace(/([A-Z])/g, "_$1").replace(/=/g, "-");
        var url_ = exports.READIUM2_ELECTRON_HTTP_PROTOCOL + "://" +
            "id" + pubID +
            "/x" + matches[1] +
            "/ip" + matches[2] +
            "/p" + matches[3] +
            matches[5];
        return url_;
    }
    return url;
};
exports.convertCustomSchemeToHttpUrl = function (url) {
    var url_ = url.replace(exports.READIUM2_ELECTRON_HTTP_PROTOCOL + "://", "");
    var matches = url_.match(/id([^\/]+)\/x(http[s]?)\/ip([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\/p([0-9]+)?(\/.*)?/);
    if (matches && matches.length > 1) {
        var pubID = matches[1].replace(/-/g, "=").replace(/(_[a-zA-Z])/g, function (match) {
            var ret = match.substr(1).toUpperCase();
            return ret;
        });
        url_ = matches[2] + "://" +
            matches[3] + ":" + matches[4] +
            "/pub/" + pubID +
            matches[5];
        return url_;
    }
    return url;
};
//# sourceMappingURL=sessions.js.map