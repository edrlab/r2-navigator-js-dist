"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renew_1 = require("r2-lcp-js/dist/es8-es2017/src/lsd/renew");
const return_1 = require("r2-lcp-js/dist/es8-es2017/src/lsd/return");
const debug_ = require("debug");
const moment = require("moment");
const debug = debug_("r2:navigator#electron/main/lsd");
async function doLsdReturn(publicationsServer, deviceIDManager, publicationFilePath) {
    const publication = publicationsServer.cachedPublication(publicationFilePath);
    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
        return Promise.reject("no publication LCP LSD data?!");
    }
    let renewResponseJson;
    try {
        renewResponseJson = await return_1.lsdReturn(publication.LCP.LSDJson, deviceIDManager);
        publication.LCP.LSDJson = renewResponseJson;
        return Promise.resolve(renewResponseJson);
    }
    catch (err) {
        debug(err);
        return Promise.reject(err);
    }
}
exports.doLsdReturn = doLsdReturn;
async function doLsdRenew(publicationsServer, deviceIDManager, publicationFilePath, endDateStr) {
    const publication = publicationsServer.cachedPublication(publicationFilePath);
    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
        return Promise.reject("Internal error!");
    }
    const endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
    let renewResponseJson;
    try {
        renewResponseJson = await renew_1.lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager);
        publication.LCP.LSDJson = renewResponseJson;
        return Promise.resolve(renewResponseJson);
    }
    catch (err) {
        debug(err);
        return Promise.reject(err);
    }
}
exports.doLsdRenew = doLsdRenew;
//# sourceMappingURL=lsd.js.map