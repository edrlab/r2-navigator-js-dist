"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BufferUtils_1 = require("r2-shared-js/dist/es5/src/_utils/stream/BufferUtils");
var debug_ = require("debug");
var electron_1 = require("electron");
var moment = require("moment");
var request = require("request");
var requestPromise = require("request-promise-native");
var events_1 = require("../common/events");
var lsd_injectlcpl_1 = require("./lsd-injectlcpl");
var lsd_register_1 = require("./lsd-register");
var lsd_renew_1 = require("./lsd-renew");
var lsd_return_1 = require("./lsd-return");
var debug = debug_("r2:electron:main:lsd");
function installLsdHandler(publicationsServer, deviceIDManager) {
    var _this = this;
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, function (event, publicationFilePath) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var publication, renewResponseJson, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
                        event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, "Internal error!");
                        return [2];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, lsd_return_1.lsdReturn(publication.LCP.LSDJson, deviceIDManager)];
                case 2:
                    renewResponseJson = _a.sent();
                    publication.LCP.LSDJson = renewResponseJson;
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, true, "Returned.");
                    return [2];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, err_1);
                    return [3, 4];
                case 4: return [2];
            }
        });
    }); });
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, function (event, publicationFilePath, endDateStr) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var publication, endDate, renewResponseJson, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
                        event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, "Internal error!");
                        return [2];
                    }
                    endDate = endDateStr.length ? moment(endDateStr).toDate() : undefined;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, lsd_renew_1.lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager)];
                case 2:
                    renewResponseJson = _a.sent();
                    publication.LCP.LSDJson = renewResponseJson;
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, true, "Renewed.");
                    return [2];
                case 3:
                    err_2 = _a.sent();
                    debug(err_2);
                    event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, err_2);
                    return [3, 4];
                case 4: return [2];
            }
        });
    }); });
}
exports.installLsdHandler = installLsdHandler;
function launchStatusDocumentProcessing(publication, publicationPath, deviceIDManager, onStatusDocumentProcessingComplete) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        var linkStatus, failure, success, headers, needsStreamingResponse, response, err_3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!publication.LCP || !publication.LCP.Links) {
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete();
                        }
                        return [2];
                    }
                    linkStatus = publication.LCP.Links.find(function (link) {
                        return link.Rel === "status";
                    });
                    if (!linkStatus) {
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete();
                        }
                        return [2];
                    }
                    debug(linkStatus);
                    failure = function (err) {
                        debug(err);
                        if (onStatusDocumentProcessingComplete) {
                            onStatusDocumentProcessingComplete();
                        }
                    };
                    success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var responseData, err_4, responseStr, lsdJson, licenseUpdateResponseJson, err_5, res, err_6, registerResponseJson, err_7;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    Object.keys(response.headers).forEach(function (header) {
                                        debug(header + " => " + response.headers[header]);
                                    });
                                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                                        failure("HTTP CODE " + response.statusCode);
                                        return [2];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4, BufferUtils_1.streamToBufferPromise(response)];
                                case 2:
                                    responseData = _a.sent();
                                    return [3, 4];
                                case 3:
                                    err_4 = _a.sent();
                                    debug(err_4);
                                    if (onStatusDocumentProcessingComplete) {
                                        onStatusDocumentProcessingComplete();
                                    }
                                    return [2];
                                case 4:
                                    if (!responseData) {
                                        if (onStatusDocumentProcessingComplete) {
                                            onStatusDocumentProcessingComplete();
                                        }
                                        return [2];
                                    }
                                    responseStr = responseData.toString("utf8");
                                    if (response.headers["content-type"] === "application/vnd.readium.license.status.v1.0+json" ||
                                        response.headers["content-type"] === "application/json") {
                                        debug(responseStr);
                                    }
                                    lsdJson = global.JSON.parse(responseStr);
                                    debug(lsdJson);
                                    publication.LCP.LSDJson = lsdJson;
                                    _a.label = 5;
                                case 5:
                                    _a.trys.push([5, 7, , 8]);
                                    return [4, lsd_injectlcpl_1.lsdLcpUpdate(lsdJson, publication)];
                                case 6:
                                    licenseUpdateResponseJson = _a.sent();
                                    return [3, 8];
                                case 7:
                                    err_5 = _a.sent();
                                    debug(err_5);
                                    return [3, 8];
                                case 8:
                                    if (!licenseUpdateResponseJson) return [3, 13];
                                    res = void 0;
                                    _a.label = 9;
                                case 9:
                                    _a.trys.push([9, 11, , 12]);
                                    return [4, lsd_injectlcpl_1.lsdLcpUpdateInject(licenseUpdateResponseJson, publication, publicationPath)];
                                case 10:
                                    res = _a.sent();
                                    debug("EPUB SAVED: " + res);
                                    return [3, 12];
                                case 11:
                                    err_6 = _a.sent();
                                    debug(err_6);
                                    return [3, 12];
                                case 12:
                                    if (onStatusDocumentProcessingComplete) {
                                        onStatusDocumentProcessingComplete();
                                    }
                                    return [2];
                                case 13:
                                    if (lsdJson.status === "revoked"
                                        || lsdJson.status === "returned"
                                        || lsdJson.status === "cancelled"
                                        || lsdJson.status === "expired") {
                                        debug("What?! LSD " + lsdJson.status);
                                        if (onStatusDocumentProcessingComplete) {
                                            onStatusDocumentProcessingComplete();
                                        }
                                        return [2];
                                    }
                                    _a.label = 14;
                                case 14:
                                    _a.trys.push([14, 16, , 17]);
                                    return [4, lsd_register_1.lsdRegister(lsdJson, deviceIDManager)];
                                case 15:
                                    registerResponseJson = _a.sent();
                                    publication.LCP.LSDJson = registerResponseJson;
                                    return [3, 17];
                                case 16:
                                    err_7 = _a.sent();
                                    debug(err_7);
                                    return [3, 17];
                                case 17:
                                    if (onStatusDocumentProcessingComplete) {
                                        onStatusDocumentProcessingComplete();
                                    }
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
                        uri: linkStatus.Href,
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
                            uri: linkStatus.Href,
                        })];
                case 3:
                    response = _a.sent();
                    return [3, 5];
                case 4:
                    err_3 = _a.sent();
                    failure(err_3);
                    return [2];
                case 5: return [4, success(response)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2];
            }
        });
    });
}
exports.launchStatusDocumentProcessing = launchStatusDocumentProcessing;
//# sourceMappingURL=lsd.js.map