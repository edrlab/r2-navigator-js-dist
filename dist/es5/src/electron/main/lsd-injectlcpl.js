"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = require("fs");
var lcp_1 = require("r2-shared-js/dist/es5/src/parser/epub/lcp");
var BufferUtils_1 = require("r2-shared-js/dist/es5/src/_utils/stream/BufferUtils");
var zipInjector_1 = require("r2-shared-js/dist/es5/src/_utils/zip/zipInjector");
var debug_ = require("debug");
var moment = require("moment");
var request = require("request");
var requestPromise = require("request-promise-native");
var ta_json_1 = require("ta-json");
var debug = debug_("r2:electron:main:lsd");
function lsdLcpUpdateInject(lcplStr, publication, publicationPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        var lcplJson, zipEntryPath, lcpl;
        return tslib_1.__generator(this, function (_a) {
            lcplJson = global.JSON.parse(lcplStr);
            debug(lcplJson);
            zipEntryPath = "META-INF/license.lcpl";
            try {
                lcpl = ta_json_1.JSON.deserialize(lcplJson, lcp_1.LCP);
            }
            catch (erorz) {
                return [2, Promise.reject(erorz)];
            }
            lcpl.ZipPath = zipEntryPath;
            lcpl.JsonSource = lcplStr;
            lcpl.init();
            publication.LCP = lcpl;
            return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var newPublicationPath;
                    return tslib_1.__generator(this, function (_a) {
                        newPublicationPath = publicationPath + ".new";
                        zipInjector_1.injectBufferInZip(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath, function (err) {
                            reject(err);
                        }, function () {
                            debug("EPUB license.lcpl injected.");
                            setTimeout(function () {
                                fs.unlinkSync(publicationPath);
                                setTimeout(function () {
                                    fs.renameSync(newPublicationPath, publicationPath);
                                    resolve(publicationPath);
                                }, 500);
                            }, 500);
                        });
                        return [2];
                    });
                }); })];
        });
    });
}
exports.lsdLcpUpdateInject = lsdLcpUpdateInject;
function lsdLcpUpdate(lsdJson, publication) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        var updatedLicenseLSD, updatedLicense, forceUpdate, licenseLink_1;
        return tslib_1.__generator(this, function (_a) {
            if (lsdJson.updated && lsdJson.updated.license &&
                (publication.LCP.Updated || publication.LCP.Issued)) {
                updatedLicenseLSD = moment(lsdJson.updated.license);
                updatedLicense = moment(publication.LCP.Updated || publication.LCP.Issued);
                forceUpdate = false;
                if (forceUpdate ||
                    updatedLicense.isBefore(updatedLicenseLSD)) {
                    debug("LSD license updating...");
                    if (lsdJson.links) {
                        licenseLink_1 = lsdJson.links.find(function (link) {
                            return link.rel === "license";
                        });
                        if (!licenseLink_1) {
                            return [2, Promise.reject("LSD license link is missing.")];
                        }
                        debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + licenseLink_1.href);
                        return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                var failure, success, headers, needsStreamingResponse, response, err_1;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            failure = function (err) {
                                                reject(err);
                                            };
                                            success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                                var newRes, err_2, responseData, err_3, lcplStr;
                                                return tslib_1.__generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            Object.keys(response.headers).forEach(function (header) {
                                                                debug(header + " => " + response.headers[header]);
                                                            });
                                                            if (!(response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) return [3, 7];
                                                            if (!(licenseLink_1.href.indexOf("/licenses/") > 0)) return [3, 5];
                                                            licenseLink_1.href = licenseLink_1.href.replace("/licenses/", "/api/v1/purchases/license/");
                                                            debug("TRYING AGAIN: " + licenseLink_1.href);
                                                            newRes = void 0;
                                                            _a.label = 1;
                                                        case 1:
                                                            _a.trys.push([1, 3, , 4]);
                                                            return [4, lsdLcpUpdate(lsdJson, publication)];
                                                        case 2:
                                                            newRes = _a.sent();
                                                            return [3, 4];
                                                        case 3:
                                                            err_2 = _a.sent();
                                                            failure(err_2);
                                                            return [2];
                                                        case 4:
                                                            resolve(newRes);
                                                            return [3, 6];
                                                        case 5:
                                                            failure("HTTP CODE " + response.statusCode);
                                                            _a.label = 6;
                                                        case 6: return [2];
                                                        case 7:
                                                            _a.trys.push([7, 9, , 10]);
                                                            return [4, BufferUtils_1.streamToBufferPromise(response)];
                                                        case 8:
                                                            responseData = _a.sent();
                                                            return [3, 10];
                                                        case 9:
                                                            err_3 = _a.sent();
                                                            reject(err_3);
                                                            return [2];
                                                        case 10:
                                                            if (!responseData) {
                                                                return [2];
                                                            }
                                                            lcplStr = responseData.toString("utf8");
                                                            debug(lcplStr);
                                                            resolve(lcplStr);
                                                            return [2];
                                                    }
                                                });
                                            }); };
                                            headers = {
                                                "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                                            };
                                            needsStreamingResponse = true;
                                            if (!needsStreamingResponse) return [3, 1];
                                            request.get({
                                                headers: headers,
                                                method: "GET",
                                                uri: licenseLink_1.href,
                                            })
                                                .on("response", success)
                                                .on("error", failure);
                                            return [3, 7];
                                        case 1:
                                            response = void 0;
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, 4, , 5]);
                                            return [4, requestPromise({
                                                    headers: headers,
                                                    method: "GET",
                                                    resolveWithFullResponse: true,
                                                    uri: licenseLink_1.href,
                                                })];
                                        case 3:
                                            response = _a.sent();
                                            return [3, 5];
                                        case 4:
                                            err_1 = _a.sent();
                                            failure(err_1);
                                            return [2];
                                        case 5: return [4, success(response)];
                                        case 6:
                                            _a.sent();
                                            _a.label = 7;
                                        case 7: return [2];
                                    }
                                });
                            }); })];
                    }
                }
            }
            return [2, Promise.reject("No LSD LCP update.")];
        });
    });
}
exports.lsdLcpUpdate = lsdLcpUpdate;
//# sourceMappingURL=lsd-injectlcpl.js.map