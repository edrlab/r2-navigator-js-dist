"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doLsdRenew = exports.doLsdReturn = void 0;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const moment = require("moment");
const renew_1 = require("r2-lcp-js/dist/es6-es2015/src/lsd/renew");
const return_1 = require("r2-lcp-js/dist/es6-es2015/src/lsd/return");
const debug = debug_("r2:navigator#electron/main/lsd");
function doLsdReturn(publicationsServer, deviceIDManager, publicationFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSD) {
            return Promise.reject("no publication LCP LSD data?!");
        }
        let returnResponseLsd;
        try {
            returnResponseLsd = yield return_1.lsdReturn_(publication.LCP.LSD, deviceIDManager);
        }
        catch (err) {
            debug(err);
            return Promise.reject(err);
        }
        if (returnResponseLsd) {
            publication.LCP.LSD = returnResponseLsd;
            return Promise.resolve(publication.LCP.LSD);
        }
        return Promise.reject("doLsdReturn?!");
    });
}
exports.doLsdReturn = doLsdReturn;
function doLsdRenew(publicationsServer, deviceIDManager, publicationFilePath, endDateStr) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSD) {
            return Promise.reject("no publication LCP LSD data?!");
        }
        const endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
        let returnResponseLsd;
        try {
            returnResponseLsd = yield renew_1.lsdRenew_(endDate, publication.LCP.LSD, deviceIDManager);
        }
        catch (err) {
            debug(err);
            return Promise.reject(err);
        }
        if (returnResponseLsd) {
            publication.LCP.LSD = returnResponseLsd;
            return Promise.resolve(publication.LCP.LSD);
        }
        return Promise.reject("doLsdRenew?!");
    });
}
exports.doLsdRenew = doLsdRenew;
//# sourceMappingURL=lsd.js.map