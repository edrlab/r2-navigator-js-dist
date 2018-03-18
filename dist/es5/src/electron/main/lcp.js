"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var crypto = require("crypto");
var debug_ = require("debug");
var debug = debug_("r2:navigator#electron/main/lcp");
function doTryLcpPass(publicationsServer, publicationFilePath, lcpPasses, isSha256Hex) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var publication, passesSha256Hex, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publication = publicationsServer.cachedPublication(publicationFilePath);
                    if (!publication || !publication.LCP) {
                        return [2, Promise.reject("no publication LCP data?! " + publicationFilePath)];
                    }
                    if (isSha256Hex) {
                        passesSha256Hex = lcpPasses;
                    }
                    else {
                        passesSha256Hex = lcpPasses.map(function (lcpPass) {
                            var checkSum = crypto.createHash("sha256");
                            checkSum.update(lcpPass);
                            var passSha256Hex = checkSum.digest("hex");
                            return passSha256Hex;
                        });
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, publication.LCP.tryUserKeys(passesSha256Hex)];
                case 2: return [2, _a.sent()];
                case 3:
                    err_1 = _a.sent();
                    debug(err_1);
                    debug("FAIL publication.LCP.tryUserKeys(): " + err_1);
                    return [2, Promise.reject(err_1)];
                case 4: return [2];
            }
        });
    });
}
exports.doTryLcpPass = doTryLcpPass;
//# sourceMappingURL=lcp.js.map