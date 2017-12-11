"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtils_1 = require("r2-streamer-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug_ = require("debug");
const electron_1 = require("electron");
const moment = require("moment");
const request = require("request");
const requestPromise = require("request-promise-native");
const events_1 = require("../common/events");
const lsd_injectlcpl_1 = require("./lsd-injectlcpl");
const lsd_register_1 = require("./lsd-register");
const lsd_renew_1 = require("./lsd-renew");
const lsd_return_1 = require("./lsd-return");
const debug = debug_("r2:electron:main:lsd");
function installLsdHandler(publicationsServer, deviceIDManager) {
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RETURN, async (event, publicationFilePath) => {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, "Internal error!");
            return;
        }
        let renewResponseJson;
        try {
            renewResponseJson = await lsd_return_1.lsdReturn(publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, true, "Returned.");
            return;
        }
        catch (err) {
            debug(err);
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RETURN_RES, false, err);
        }
    });
    electron_1.ipcMain.on(events_1.R2_EVENT_LCP_LSD_RENEW, async (event, publicationFilePath, endDateStr) => {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP || !publication.LCP.LSDJson) {
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, "Internal error!");
            return;
        }
        const endDate = endDateStr.length ? moment(endDateStr).toDate() : undefined;
        let renewResponseJson;
        try {
            renewResponseJson = await lsd_renew_1.lsdRenew(endDate, publication.LCP.LSDJson, deviceIDManager);
            publication.LCP.LSDJson = renewResponseJson;
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, true, "Renewed.");
            return;
        }
        catch (err) {
            debug(err);
            event.sender.send(events_1.R2_EVENT_LCP_LSD_RENEW_RES, false, err);
        }
    });
}
exports.installLsdHandler = installLsdHandler;
async function launchStatusDocumentProcessing(publication, publicationPath, deviceIDManager, onStatusDocumentProcessingComplete) {
    if (!publication.LCP || !publication.LCP.Links) {
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
        return;
    }
    const linkStatus = publication.LCP.Links.find((link) => {
        return link.Rel === "status";
    });
    if (!linkStatus) {
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
        return;
    }
    debug(linkStatus);
    const failure = (err) => {
        debug(err);
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
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
            debug(err);
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
            return;
        }
        if (!responseData) {
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
            return;
        }
        const responseStr = responseData.toString("utf8");
        if (response.headers["content-type"] === "application/vnd.readium.license.status.v1.0+json" ||
            response.headers["content-type"] === "application/json") {
            debug(responseStr);
        }
        const lsdJson = global.JSON.parse(responseStr);
        debug(lsdJson);
        publication.LCP.LSDJson = lsdJson;
        let licenseUpdateResponseJson;
        try {
            licenseUpdateResponseJson = await lsd_injectlcpl_1.lsdLcpUpdate(lsdJson, publication);
        }
        catch (err) {
            debug(err);
        }
        if (licenseUpdateResponseJson) {
            let res;
            try {
                res = await lsd_injectlcpl_1.lsdLcpUpdateInject(licenseUpdateResponseJson, publication, publicationPath);
                debug("EPUB SAVED: " + res);
            }
            catch (err) {
                debug(err);
            }
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
            return;
        }
        if (lsdJson.status === "revoked"
            || lsdJson.status === "returned"
            || lsdJson.status === "cancelled"
            || lsdJson.status === "expired") {
            debug("What?! LSD " + lsdJson.status);
            if (onStatusDocumentProcessingComplete) {
                onStatusDocumentProcessingComplete();
            }
            return;
        }
        let registerResponseJson;
        try {
            registerResponseJson = await lsd_register_1.lsdRegister(lsdJson, deviceIDManager);
            publication.LCP.LSDJson = registerResponseJson;
        }
        catch (err) {
            debug(err);
        }
        if (onStatusDocumentProcessingComplete) {
            onStatusDocumentProcessingComplete();
        }
    };
    const headers = {
        "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
    };
    const needsStreamingResponse = true;
    if (needsStreamingResponse) {
        request.get({
            headers,
            method: "GET",
            uri: linkStatus.Href,
        })
            .on("response", success)
            .on("error", failure);
    }
    else {
        let response;
        try {
            response = await requestPromise({
                headers,
                method: "GET",
                resolveWithFullResponse: true,
                uri: linkStatus.Href,
            });
        }
        catch (err) {
            failure(err);
            return;
        }
        await success(response);
    }
}
exports.launchStatusDocumentProcessing = launchStatusDocumentProcessing;
//# sourceMappingURL=lsd.js.map