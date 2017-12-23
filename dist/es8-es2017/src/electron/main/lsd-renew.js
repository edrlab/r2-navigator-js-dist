"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const URI = require("urijs");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:electron:main:lsd");
async function lsdRenew(end, lsdJson, deviceIDManager) {
    if (!lsdJson.links) {
        return Promise.reject("No LSD links!");
    }
    const licenseRenew = lsdJson.links.find((link) => {
        return link.rel === "renew";
    });
    if (!licenseRenew) {
        return Promise.reject("No LSD renew link!");
    }
    const deviceID = deviceIDManager.getDeviceID();
    const deviceNAME = deviceIDManager.getDeviceNAME();
    let renewURL = licenseRenew.href;
    if (licenseRenew.templated === true || licenseRenew.templated === "true") {
        const urlTemplate = new URITemplate(renewURL);
        renewURL = urlTemplate.expand({ end: "xxx", id: deviceID, name: deviceNAME }, { strict: false });
        const renewURI = new URI(renewURL);
        renewURI.search((data) => {
            data.end = end;
        });
        renewURL = renewURI.toString();
    }
    debug("RENEW: " + renewURL);
    return new Promise(async (resolve, reject) => {
        const failure = (err) => {
            reject(err);
        };
        const success = async (response) => {
            Object.keys(response.headers).forEach((header) => {
                debug(header + " => " + response.headers[header]);
            });
            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                failure("HTTP CODE " + response.statusCode);
                return;
            }
            let responseData;
            try {
                responseData = await BufferUtils_1.streamToBufferPromise(response);
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
        };
        const headers = {
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
        };
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.put({
                headers,
                method: "PUT",
                uri: renewURL,
            })
                .on("response", success)
                .on("error", failure);
        }
        else {
            let response;
            try {
                response = await requestPromise({
                    headers,
                    method: "PUT",
                    resolveWithFullResponse: true,
                    uri: renewURL,
                });
            }
            catch (err) {
                failure(err);
                return;
            }
            await success(response);
        }
    });
}
exports.lsdRenew = lsdRenew;
//# sourceMappingURL=lsd-renew.js.map