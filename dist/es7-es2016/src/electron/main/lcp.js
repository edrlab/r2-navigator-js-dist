"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doTryLcpPass = void 0;
const tslib_1 = require("tslib");
const crypto = require("crypto");
const debug_ = require("debug");
const debug = debug_("r2:navigator#electron/main/lcp");
function doTryLcpPass(publicationsServer, publicationFilePath, lcpPasses, isSha256Hex) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const publication = publicationsServer.cachedPublication(publicationFilePath);
        if (!publication || !publication.LCP) {
            return Promise.reject("no publication LCP data?! " + publicationFilePath);
        }
        let passesSha256Hex;
        if (isSha256Hex) {
            passesSha256Hex = lcpPasses;
        }
        else {
            passesSha256Hex = lcpPasses.map((lcpPass) => {
                const checkSum = crypto.createHash("sha256");
                checkSum.update(lcpPass);
                const passSha256Hex = checkSum.digest("hex");
                return passSha256Hex;
            });
        }
        try {
            return yield publication.LCP.tryUserKeys(passesSha256Hex);
        }
        catch (err) {
            debug(err);
            debug("FAIL publication.LCP.tryUserKeys(): " + err);
            return Promise.reject(err);
        }
    });
}
exports.doTryLcpPass = doTryLcpPass;
//# sourceMappingURL=lcp.js.map