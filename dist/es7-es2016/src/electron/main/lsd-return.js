"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const BufferUtils_1 = require("r2-shared-js/dist/es7-es2016/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:electron:main:lsd");
function lsdReturn(lsdJson, deviceIDManager) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!lsdJson.links) {
            return Promise.reject("No LSD links!");
        }
        const licenseReturn = lsdJson.links.find((link) => {
            return link.rel === "return";
        });
        if (!licenseReturn) {
            return Promise.reject("No LSD return link!");
        }
        const deviceID = deviceIDManager.getDeviceID();
        const deviceNAME = deviceIDManager.getDeviceNAME();
        let returnURL = licenseReturn.href;
        if (licenseReturn.templated === true || licenseReturn.templated === "true") {
            const urlTemplate = new URITemplate(returnURL);
            returnURL = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
        }
        debug("RETURN: " + returnURL);
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const failure = (err) => {
                reject(err);
            };
            const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                Object.keys(response.headers).forEach((header) => {
                    debug(header + " => " + response.headers[header]);
                });
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    failure("HTTP CODE " + response.statusCode);
                    return;
                }
                let responseData;
                try {
                    responseData = yield BufferUtils_1.streamToBufferPromise(response);
                }
                catch (err) {
                    reject(err);
                    return;
                }
                if (!responseData) {
                    return;
                }
                const responseStr = responseData.toString("utf8");
                debug(responseStr);
                const responseJson = global.JSON.parse(responseStr);
                debug(responseJson);
                resolve(responseJson);
            });
            const headers = {
                "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
            };
            const needsStreamingResponse = true;
            if (needsStreamingResponse) {
                request.put({
                    headers,
                    method: "PUT",
                    uri: returnURL,
                })
                    .on("response", success)
                    .on("error", failure);
            }
            else {
                let response;
                try {
                    response = yield requestPromise({
                        headers,
                        method: "PUT",
                        resolveWithFullResponse: true,
                        uri: returnURL,
                    });
                }
                catch (err) {
                    failure(err);
                    return;
                }
                yield success(response);
            }
        }));
    });
}
exports.lsdReturn = lsdReturn;
//# sourceMappingURL=lsd-return.js.map