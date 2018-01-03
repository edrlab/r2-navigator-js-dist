"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const lcp_1 = require("r2-lcp-js/dist/es6-es2015/src/parser/epub/lcp");
const zipInjector_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/zip/zipInjector");
const debug_ = require("debug");
const electron_1 = require("electron");
const request = require("request");
const requestPromise = require("request-promise-native");
const ta_json_1 = require("ta-json");
const events_1 = require("../common/events");
const lsd_1 = require("./lsd");
const debug = debug_("r2:electron:main:lcp");
function installLcpHandler(publicationsServer, deviceIDManager) {
    lsd_1.installLsdHandler(publicationsServer, deviceIDManager);
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, (event, publicationFilePath, lcpPass, isSha256Hex) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        let okay = false;
        try {
            okay = yield tryLcpPass(publicationFilePath, lcpPass, isSha256Hex);
        }
        catch (err) {
            debug(err);
            okay = false;
        }
        let passSha256Hex;
        if (okay) {
            if (isSha256Hex) {
                passSha256Hex = lcpPass;
            }
            else {
                const checkSum = crypto.createHash("sha256");
                checkSum.update(lcpPass);
                passSha256Hex = checkSum.digest("hex");
            }
        }
        event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, okay, (okay ? "Correct." : "Please try again."), passSha256Hex ? passSha256Hex : "xxx");
    }));
    function tryLcpPass(publicationFilePath, lcpPass, isSha256Hex) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const publication = publicationsServer.cachedPublication(publicationFilePath);
            if (!publication) {
                return false;
            }
            let lcpPassHex;
            if (isSha256Hex) {
                lcpPassHex = lcpPass;
            }
            else {
                const checkSum = crypto.createHash("sha256");
                checkSum.update(lcpPass);
                lcpPassHex = checkSum.digest("hex");
            }
            let okay = false;
            try {
                okay = yield publication.LCP.setUserPassphrase(lcpPassHex);
            }
            catch (err) {
                debug(err);
                okay = false;
            }
            if (!okay) {
                debug("FAIL publication.LCP.setUserPassphrase()");
            }
            return okay;
        });
    }
}
exports.installLcpHandler = installLcpHandler;
function downloadFromLCPL(filePath, dir, destFileName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const lcplStr = fs.readFileSync(filePath, { encoding: "utf8" });
            const lcplJson = global.JSON.parse(lcplStr);
            const lcpl = ta_json_1.JSON.deserialize(lcplJson, lcp_1.LCP);
            if (lcpl.Links) {
                const pubLink = lcpl.Links.find((link) => {
                    return link.Rel === "publication";
                });
                if (pubLink) {
                    const destPathTMP = path.join(dir, destFileName + ".tmp");
                    const destPathFINAL = path.join(dir, destFileName);
                    const failure = (err) => {
                        debug(err);
                        reject(pubLink.Href + " (" + err + ")");
                    };
                    const success = (response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        Object.keys(response.headers).forEach((header) => {
                            debug(header + " => " + response.headers[header]);
                        });
                        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                            failure("HTTP CODE " + response.statusCode);
                            return;
                        }
                        const destStreamTMP = fs.createWriteStream(destPathTMP);
                        response.pipe(destStreamTMP);
                        destStreamTMP.on("finish", () => {
                            const zipError = (err) => {
                                debug(err);
                                reject(destPathTMP + " (" + err + ")");
                            };
                            const doneCallback = () => {
                                setTimeout(() => {
                                    fs.unlinkSync(destPathTMP);
                                }, 1000);
                                resolve([destPathFINAL, pubLink.Href]);
                            };
                            const zipEntryPath = "META-INF/license.lcpl";
                            zipInjector_1.injectFileInZip(destPathTMP, destPathFINAL, filePath, zipEntryPath, zipError, doneCallback);
                        });
                    });
                    const needsStreamingResponse = true;
                    if (needsStreamingResponse) {
                        request.get({
                            headers: {},
                            method: "GET",
                            uri: pubLink.Href,
                        })
                            .on("response", success)
                            .on("error", failure);
                    }
                    else {
                        let response;
                        try {
                            response = yield requestPromise({
                                headers: {},
                                method: "GET",
                                resolveWithFullResponse: true,
                                uri: pubLink.Href,
                            });
                        }
                        catch (err) {
                            failure(err);
                            return;
                        }
                        yield success(response);
                    }
                }
            }
        }));
    });
}
exports.downloadFromLCPL = downloadFromLCPL;
//# sourceMappingURL=lcp.js.map