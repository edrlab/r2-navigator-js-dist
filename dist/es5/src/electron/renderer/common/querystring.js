"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getURLQueryParams = void 0;
var win = global.window;
var getURLQueryParams = function (search) {
    var params = {};
    var query = search || win.location.search;
    if (query && query.length) {
        query = query.substring(1);
        var keyParams = query.split("&");
        keyParams.forEach(function (keyParam) {
            var keyVal = keyParam.split("=");
            if (keyVal.length > 1) {
                params[keyVal[0]] = decodeURIComponent(keyVal[1]);
            }
        });
    }
    return params;
};
exports.getURLQueryParams = getURLQueryParams;
//# sourceMappingURL=querystring.js.map