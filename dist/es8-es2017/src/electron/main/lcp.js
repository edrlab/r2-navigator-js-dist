"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const debug = debug_("r2:electron:main:lcp");
function installLcpHandler(publicationsServer) {
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, async (event, publicationFilePath, lcpPass, isSha256Hex) => {
        let okay = false;
        try {
            okay = await tryLcpPass(publicationFilePath, lcpPass, isSha256Hex);
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
    });
    async function tryLcpPass(publicationFilePath, lcpPass, isSha256Hex) {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP) {
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
        try {
            await publication.LCP.tryUserKeys([lcpPassHex]);
        }
        catch (err) {
            debug(err);
            debug("FAIL publication.LCP.tryUserKeys(): " + err);
            return false;
        }
        return true;
    }
}
exports.installLcpHandler = installLcpHandler;
//# sourceMappingURL=lcp.js.map