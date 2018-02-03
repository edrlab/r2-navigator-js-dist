"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var crypto = require("crypto");
var debug_ = require("debug");
var electron_1 = require("electron");
var events_1 = require("../common/events");
var debug = debug_("r2:navigator#electron/main/lcp");
function installLcpHandler(publicationsServer) {
    var _this = this;
    electron_1.ipcMain.on(events_1.R2_EVENT_TRY_LCP_PASS, function (event, publicationFilePath, lcpPass, isSha256Hex) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var passSha256Hex, checkSum, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, tryLcpPass(publicationFilePath, lcpPass, isSha256Hex)];
                case 1:
                    _a.sent();
                    passSha256Hex = void 0;
                    if (isSha256Hex) {
                        passSha256Hex = lcpPass;
                    }
                    else {
                        checkSum = crypto.createHash("sha256");
                        checkSum.update(lcpPass);
                        passSha256Hex = checkSum.digest("hex");
                    }
                    event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, true, "Correct.", passSha256Hex);
                    return [3, 3];
                case 2:
                    err_1 = _a.sent();
                    debug(err_1);
                    event.sender.send(events_1.R2_EVENT_TRY_LCP_PASS_RES, false, err_1, "xxx");
                    return [3, 3];
                case 3: return [2];
            }
        });
    }); });
    function tryLcpPass(publicationFilePath, lcpPass, isSha256Hex) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var publication, lcpPassHex, checkSum, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        publication = publicationsServer.cachedPublication(publicationFilePath);
                        if (!publication || !publication.LCP) {
                            return [2, Promise.reject("no publication LCP data?!")];
                        }
                        if (isSha256Hex) {
                            lcpPassHex = lcpPass;
                        }
                        else {
                            checkSum = crypto.createHash("sha256");
                            checkSum.update(lcpPass);
                            lcpPassHex = checkSum.digest("hex");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, publication.LCP.tryUserKeys([lcpPassHex])];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        err_2 = _a.sent();
                        debug(err_2);
                        debug("FAIL publication.LCP.tryUserKeys(): " + err_2);
                        return [2, Promise.reject(err_2)];
                    case 4: return [2, Promise.resolve(true)];
                }
            });
        });
    }
}
exports.installLcpHandler = installLcpHandler;
//# sourceMappingURL=lcp.js.map