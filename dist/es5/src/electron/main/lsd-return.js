"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BufferUtils_1 = require("r2-streamer-js/dist/es5/src/_utils/stream/BufferUtils");
var debug_ = require("debug");
var request = require("request");
var requestPromise = require("request-promise-native");
var URITemplate = require("urijs/src/URITemplate");
var debug = debug_("r2:electron:main:lsd");
function lsdReturn(lsdJson, deviceIDManager) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        var licenseReturn, deviceID, deviceNAME, returnURL, urlTemplate;
        return tslib_1.__generator(this, function (_a) {
            if (!lsdJson.links) {
                return [2, Promise.reject("No LSD links!")];
            }
            licenseReturn = lsdJson.links.find(function (link) {
                return link.rel === "return";
            });
            if (!licenseReturn) {
                return [2, Promise.reject("No LSD return link!")];
            }
            deviceID = deviceIDManager.getDeviceID();
            deviceNAME = deviceIDManager.getDeviceNAME();
            returnURL = licenseReturn.href;
            if (licenseReturn.templated === true || licenseReturn.templated === "true") {
                urlTemplate = new URITemplate(returnURL);
                returnURL = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
            }
            debug("RETURN: " + returnURL);
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
                                    var responseData, err_2, responseStr, responseJson;
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
                                                err_2 = _a.sent();
                                                reject(err_2);
                                                return [2];
                                            case 4:
                                                if (!responseData) {
                                                    return [2];
                                                }
                                                responseStr = responseData.toString("utf8");
                                                debug(responseStr);
                                                responseJson = global.JSON.parse(responseStr);
                                                debug(responseJson);
                                                resolve(responseJson);
                                                return [2];
                                        }
                                    });
                                }); };
                                headers = {
                                    "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                                };
                                needsStreamingResponse = true;
                                if (!needsStreamingResponse) return [3, 1];
                                request.put({
                                    headers: headers,
                                    method: "PUT",
                                    uri: returnURL,
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
                                        method: "PUT",
                                        resolveWithFullResponse: true,
                                        uri: returnURL,
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
        });
    });
}
exports.lsdReturn = lsdReturn;
//# sourceMappingURL=lsd-return.js.map