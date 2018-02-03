"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const crypto = require("crypto");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const debug = debug_("r2:navigator#electron/main/lcp");
function installLcpHandler(publicationsServer) {
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, (event, publicationFilePath, lcpPass, isSha256Hex) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield tryLcpPass(publicationFilePath, lcpPass, isSha256Hex);
            let passSha256Hex;
            if (isSha256Hex) {
                passSha256Hex = lcpPass;
            }
            else {
                const checkSum = crypto.createHash("sha256");
                checkSum.update(lcpPass);
                passSha256Hex = checkSum.digest("hex");
            }
            event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, true, "Correct.", passSha256Hex);
        }
        catch (err) {
            debug(err);
            event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, false, err, "xxx");
        }
    }));
    function tryLcpPass(publicationFilePath, lcpPass, isSha256Hex) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const publication = publicationsServer.cachedPublication(publicationFilePath);
            if (!publication || !publication.LCP) {
                return Promise.reject("no publication LCP data?!");
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
            try {
                yield publication.LCP.tryUserKeys([lcpPassHex]);
            }
            catch (err) {
                debug(err);
                debug("FAIL publication.LCP.tryUserKeys(): " + err);
                return Promise.reject(err);
            }
            return Promise.resolve(true);
        });
    }
}
exports.installLcpHandler = installLcpHandler;
//# sourceMappingURL=lcp.js.map