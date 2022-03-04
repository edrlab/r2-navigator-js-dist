"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doLsdRenew = exports.doLsdReturn = void 0;
var tslib_1 = require("tslib");
var debug_ = require("debug");
var moment = require("moment");
var renew_1 = require("r2-lcp-js/dist/es5/src/lsd/renew");
var return_1 = require("r2-lcp-js/dist/es5/src/lsd/return");
var debug = debug_("r2:navigator#electron/main/lsd");
function doLsdReturn(publicationsServer, deviceIDManager, publicationFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var publication, returnResponseLsd, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSD) {
                        return [2, Promise.reject("no publication LCP LSD data?!")];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, (0, return_1.lsdReturn_)(publication.LCP.LSD, deviceIDManager)];
                case 2:
                    returnResponseLsd = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    return [2, Promise.reject(err_1)];
                case 4:
                    if (returnResponseLsd) {
                        publication.LCP.LSD = returnResponseLsd;
                        return [2, Promise.resolve(publication.LCP.LSD)];
                    }
                    return [2, Promise.reject("doLsdReturn?!")];
            }
        });
    });
}
exports.doLsdReturn = doLsdReturn;
function doLsdRenew(publicationsServer, deviceIDManager, publicationFilePath, endDateStr) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var publication, endDate, returnResponseLsd, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSD) {
                        return [2, Promise.reject("no publication LCP LSD data?!")];
                    }
                    endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, (0, renew_1.lsdRenew_)(endDate, publication.LCP.LSD, deviceIDManager)];
                case 2:
                    returnResponseLsd = _a.sent();
                    return [3, 4];
                case 3:
                    err_2 = _a.sent();
                    debug(err_2);
                    return [2, Promise.reject(err_2)];
                case 4:
                    if (returnResponseLsd) {
                        publication.LCP.LSD = returnResponseLsd;
                        return [2, Promise.resolve(publication.LCP.LSD)];
                    }
                    return [2, Promise.reject("doLsdRenew?!")];
            }
        });
    });
}
exports.doLsdRenew = doLsdRenew;
//# sourceMappingURL=lsd.js.map