"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var renew_1 = require("r2-lcp-js/dist/es5/src/lsd/renew");
var return_1 = require("r2-lcp-js/dist/es5/src/lsd/return");
var debug_ = require("debug");
var moment = require("moment");
var debug = debug_("r2:navigator#electron/main/lsd");
function doLsdReturn(publicationsServer, deviceIDManager, publicationFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var publication, renewResponseJson, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
                        return [2, Promise.reject("no publication LCP LSD data?!")];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, return_1.lsdReturn(publication.LCP.LSDJson, deviceIDManager)];
                case 2:
                    renewResponseJson = _a.sent();
                    publication.LCP.LSDJson = renewResponseJson;
                    return [2, Promise.resolve(renewResponseJson)];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    return [2, Promise.reject(err_1)];
                case 4: return [2];
            }
        });
    });
}
exports.doLsdReturn = doLsdReturn;
function doLsdRenew(publicationsServer, deviceIDManager, publicationFilePath, endDateStr) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var publication, endDate, renewResponseJson, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
                        return [2, Promise.reject("Internal error!")];
                    }
                    endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, renew_1.lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager)];
                case 2:
                    renewResponseJson = _a.sent();
                    publication.LCP.LSDJson = renewResponseJson;
                    return [2, Promise.resolve(renewResponseJson)];
                case 3:
                    err_2 = _a.sent();
                    debug(err_2);
                    return [2, Promise.reject(err_2)];
                case 4: return [2];
            }
        });
    });
}
exports.doLsdRenew = doLsdRenew;
//# sourceMappingURL=lsd.js.map