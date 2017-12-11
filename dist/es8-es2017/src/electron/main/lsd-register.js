"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtils_1 = require("r2-streamer-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const request = require("request");
const requestPromise = require("request-promise-native");
const URITemplate = require("urijs/src/URITemplate");
const debug = debug_("r2:electron:main:lsd");
async function lsdRegister(lsdJson, deviceIDManager) {
    if (!lsdJson.links) {
        return Promise.reject("No LSD links!");
    }
    const licenseRegister = lsdJson.links.find((link) => {
        return link.rel === "register";
    });
    if (!licenseRegister) {
        return Promise.reject("No LSD register link!");
    }
    const deviceID = deviceIDManager.getDeviceID();
    const deviceNAME = deviceIDManager.getDeviceNAME();
    let doRegister = false;
    if (lsdJson.status === "ready") {
        doRegister = true;
    }
    else if (lsdJson.status === "active") {
        const deviceIDForStatusDoc = deviceIDManager.checkDeviceID(lsdJson.id);
        if (!deviceIDForStatusDoc) {
            doRegister = true;
        }
        else if (deviceIDForStatusDoc !== deviceID) {
            debug("LSD registered device ID is different?");
            doRegister = true;
        }
    }
    if (!doRegister) {
        return Promise.reject("No need to LSD register.");
    }
    let registerURL = licenseRegister.href;
    if (licenseRegister.templated === true || licenseRegister.templated === "true") {
        const urlTemplate = new URITemplate(registerURL);
        registerURL = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
    }
    debug("REGISTER: " + registerURL);
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
            if (responseJson.status === "active") {
                deviceIDManager.recordDeviceID(responseJson.id);
            }
            resolve(responseJson);
        };
        const headers = {
            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
        };
        const needsStreamingResponse = true;
        if (needsStreamingResponse) {
            request.post({
                headers,
                method: "POST",
                uri: registerURL,
            })
                .on("response", success)
                .on("error", failure);
        }
        else {
            let response;
            try {
                response = await requestPromise({
                    headers,
                    method: "POST",
                    resolveWithFullResponse: true,
                    uri: registerURL,
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
exports.lsdRegister = lsdRegister;
//# sourceMappingURL=lsd-register.js.map