"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs");
const lcp_1 = require("r2-shared-js/dist/es7-es2016/src/parser/epub/lcp");
const BufferUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/stream/BufferUtils");
const zipInjector_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/zip/zipInjector");
const debug_ = require("debug");
const moment = require("moment");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_1 = require("ta-json");
const debug = debug_("r2:electron:main:lsd");
function lsdLcpUpdateInject(lcplStr, publication, publicationPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const lcplJson = global.JSON.parse(lcplStr);
        debug(lcplJson);
        const zipEntryPath = "META-INF/license.lcpl";
        let lcpl;
        try {
            lcpl = ta_json_1.JSON.deserialize(lcplJson, lcp_1.LCP);
        }
        catch (erorz) {
            return Promise.reject(erorz);
        }
        lcpl.ZipPath = zipEntryPath;
        lcpl.JsonSource = lcplStr;
        lcpl.init();
        publication.LCP = lcpl;
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const newPublicationPath = publicationPath + ".new";
            zipInjector_1.injectBufferInZip(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath, (err) => {
                reject(err);
            }, () => {
                debug("EPUB license.lcpl injected.");
                setTimeout(() => {
                    fs.unlinkSync(publicationPath);
                    setTimeout(() => {
                        fs.renameSync(newPublicationPath, publicationPath);
                        resolve(publicationPath);
                    }, 500);
                }, 500);
            });
        }));
    });
}
exports.lsdLcpUpdateInject = lsdLcpUpdateInject;
function lsdLcpUpdate(lsdJson, publication) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (lsdJson.updated && lsdJson.updated.license &&
            (publication.LCP.Updated || publication.LCP.Issued)) {
            const updatedLicenseLSD = moment(lsdJson.updated.license);
            const updatedLicense = moment(publication.LCP.Updated || publication.LCP.Issued);
            const forceUpdate = false;
            if (forceUpdate ||
                updatedLicense.isBefore(updatedLicenseLSD)) {
                debug("LSD license updating...");
                if (lsdJson.links) {
                    const licenseLink = lsdJson.links.find((link) => {
                        return link.rel === "license";
                    });
                    if (!licenseLink) {
                        return Promise.reject("LSD license link is missing.");
                    }
                    debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + licenseLink.href);
                    return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const failure = (err) => {
                            reject(err);
                        };
                        const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                            Object.keys(response.headers).forEach((header) => {
                                debug(header + " => " + response.headers[header]);
                            });
                            if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                                if (licenseLink.href.indexOf("/licenses/") > 0) {
                                    licenseLink.href = licenseLink.href.replace("/licenses/", "/api/v1/purchases/license/");
                                    debug("TRYING AGAIN: " + licenseLink.href);
                                    let newRes;
                                    try {
                                        newRes = yield lsdLcpUpdate(lsdJson, publication);
                                    }
                                    catch (err) {
                                        failure(err);
                                        return;
                                    }
                                    resolve(newRes);
                                }
                                else {
                                    failure("HTTP CODE " + response.statusCode);
                                }
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
                            const lcplStr = responseData.toString("utf8");
                            debug(lcplStr);
                            resolve(lcplStr);
                        });
                        const headers = {
                            "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
                        };
                        const needsStreamingResponse = true;
                        if (needsStreamingResponse) {
                            request.get({
                                headers,
                                method: "GET",
                                uri: licenseLink.href,
                            })
                                .on("response", success)
                                .on("error", failure);
                        }
                        else {
                            let response;
                            try {
                                response = yield requestPromise({
                                    headers,
                                    method: "GET",
                                    resolveWithFullResponse: true,
                                    uri: licenseLink.href,
                                });
                            }
                            catch (err) {
                                failure(err);
                                return;
                            }
                            yield success(response);
                        }
                    }));
                }
            }
        }
        return Promise.reject("No LSD LCP update.");
    });
}
exports.lsdLcpUpdate = lsdLcpUpdate;
//# sourceMappingURL=lsd-injectlcpl.js.map