"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var lcp_1 = require("r2-shared-js/dist/es5/src/parser/epub/lcp");
var zipInjector_1 = require("r2-utils-js/dist/es5/src/_utils/zip/zipInjector");
var debug_ = require("debug");
var electron_1 = require("electron");
var request = require("request");
var requestPromise = require("request-promise-native");
var ta_json_1 = require("ta-json");
var events_1 = require("../common/events");
var lsd_1 = require("./lsd");
var debug = debug_("r2:electron:main:lcp");
function installLcpHandler(publicationsServer, deviceIDManager) {
    var _this = this;
    lsd_1.installLsdHandler(publicationsServer, deviceIDManager);
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, function (event, publicationFilePath, lcpPass, isSha256Hex) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var okay, err_1, passSha256Hex, checkSum;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    okay = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, tryLcpPass(publicationFilePath, lcpPass, isSha256Hex)];
                case 2:
                    okay = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    okay = false;
                    return [3, 4];
                case 4:
                    if (okay) {
                        if (isSha256Hex) {
                            passSha256Hex = lcpPass;
                        }
                        else {
                            checkSum = crypto.createHash("sha256");
                            checkSum.update(lcpPass);
                            passSha256Hex = checkSum.digest("hex");
                        }
                    }
                    event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, okay, (okay ? "Correct." : "Please try again."), passSha256Hex ? passSha256Hex : "xxx");
                    return [2];
            }
        });
    }); });
    function tryLcpPass(publicationFilePath, lcpPass, isSha256Hex) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var publication, lcpPassHex, checkSum, okay, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        publication = publicationsServer.cachedPublication(publicationFilePath);
                        if (!publication) {
                            return [2, false];
                        }
                        if (isSha256Hex) {
                            lcpPassHex = lcpPass;
                        }
                        else {
                            checkSum = crypto.createHash("sha256");
                            checkSum.update(lcpPass);
                            lcpPassHex = checkSum.digest("hex");
                        }
                        okay = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, publication.LCP.setUserPassphrase(lcpPassHex)];
                    case 2:
                        okay = _a.sent();
                        return [3, 4];
                    case 3:
                        err_2 = _a.sent();
                        debug(err_2);
                        okay = false;
                        return [3, 4];
                    case 4:
                        if (!okay) {
                            debug("FAIL publication.LCP.setUserPassphrase()");
                        }
                        return [2, okay];
                }
            });
        });
    }
}
exports.installLcpHandler = installLcpHandler;
function downloadFromLCPL(filePath, dir, destFileName) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    var lcplStr, lcplJson, lcpl, pubLink_1, destPathTMP_1, destPathFINAL_1, failure_1, success, needsStreamingResponse, response, err_3;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
                                lcplJson = global.JSON.parse(lcplStr);
                                lcpl = ta_json_1.JSON.deserialize(lcplJson, lcp_1.LCP);
                                if (!lcpl.Links) return [3, 7];
                                pubLink_1 = lcpl.Links.find(function (link) {
                                    return link.Rel === "publication";
                                });
                                if (!pubLink_1) return [3, 7];
                                destPathTMP_1 = path.join(dir, destFileName + ".tmp");
                                destPathFINAL_1 = path.join(dir, destFileName);
                                failure_1 = function (err) {
                                    debug(err);
                                    reject(pubLink_1.Href + " (" + err + ")");
                                };
                                success = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    var destStreamTMP;
                                    return tslib_1.__generator(this, function (_a) {
                                        Object.keys(response.headers).forEach(function (header) {
                                            debug(header + " => " + response.headers[header]);
                                        });
                                        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                                            failure_1("HTTP CODE " + response.statusCode);
                                            return [2];
                                        }
                                        destStreamTMP = fs.createWriteStream(destPathTMP_1);
                                        response.pipe(destStreamTMP);
                                        destStreamTMP.on("finish", function () {
                                            var zipError = function (err) {
                                                debug(err);
                                                reject(destPathTMP_1 + " (" + err + ")");
                                            };
                                            var doneCallback = function () {
                                                setTimeout(function () {
                                                    fs.unlinkSync(destPathTMP_1);
                                                }, 1000);
                                                resolve([destPathFINAL_1, pubLink_1.Href]);
                                            };
                                            var zipEntryPath = "META-INF/license.lcpl";
                                            zipInjector_1.injectFileInZip(destPathTMP_1, destPathFINAL_1, filePath, zipEntryPath, zipError, doneCallback);
                                        });
                                        return [2];
                                    });
                                }); };
                                needsStreamingResponse = true;
                                if (!needsStreamingResponse) return [3, 1];
                                request.get({
                                    headers: {},
                                    method: "GET",
                                    uri: pubLink_1.Href,
                                })
                                    .on("response", success)
                                    .on("error", failure_1);
                                return [3, 7];
                            case 1:
                                response = void 0;
                                _a.label = 2;
                            case 2:
                                _a.trys.push([2, 4, , 5]);
                                return [4, requestPromise({
                                        headers: {},
                                        method: "GET",
                                        resolveWithFullResponse: true,
                                        uri: pubLink_1.Href,
                                    })];
                            case 3:
                                response = _a.sent();
                                return [3, 5];
                            case 4:
                                err_3 = _a.sent();
                                failure_1(err_3);
                                return [2];
                            case 5: return [4, success(response)];
                            case 6:
                                _a.sent();
                                _a.label = 7;
                            case 7: return [2];
                        }
                    });
                }); })];
        });
    });
}
exports.downloadFromLCPL = downloadFromLCPL;
//# sourceMappingURL=lcp.js.map