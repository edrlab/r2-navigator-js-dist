"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const renew_1 = require("r2-lcp-js/dist/es7-es2016/src/lsd/renew");
const return_1 = require("r2-lcp-js/dist/es7-es2016/src/lsd/return");
const debug_ = require("debug");
const moment = require("moment");
const debug = debug_("r2:navigator#electron/main/lsd");
function doLsdReturn(publicationsServer, deviceIDManager, publicationFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            return Promise.reject("no publication LCP LSD data?!");
        }
        let renewResponseJson;
        try {
            renewResponseJson = yield return_1.lsdReturn(publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            return Promise.resolve(renewResponseJson);
        }
        catch (err) {
            debug(err);
            return Promise.reject(err);
        }
    });
}
exports.doLsdReturn = doLsdReturn;
function doLsdRenew(publicationsServer, deviceIDManager, publicationFilePath, endDateStr) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            return Promise.reject("Internal error!");
        }
        const endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
        let renewResponseJson;
        try {
            renewResponseJson = yield renew_1.lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            return Promise.resolve(renewResponseJson);
        }
        catch (err) {
            debug(err);
            return Promise.reject(err);
        }
    });
}
exports.doLsdRenew = doLsdRenew;
//# sourceMappingURL=lsd.js.map