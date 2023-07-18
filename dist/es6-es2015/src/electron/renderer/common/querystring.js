"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getURLQueryParams = void 0;
const win = global.window;
const getURLQueryParams = (search) => {
    const params = {};
    let query = search || win.location.search;
    if (query && query.length) {
        query = query.substring(1);
        const keyParams = query.split("&");
        keyParams.forEach((keyParam) => {
            const keyVal = keyParam.split("=");
            if (keyVal.length > 1) {
                params[keyVal[0]] = decodeURIComponent(keyVal[1]);
            }
        });
    }
    return params;
};
exports.getURLQueryParams = getURLQueryParams;
//# sourceMappingURL=querystring.js.map