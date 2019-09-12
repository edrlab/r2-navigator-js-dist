"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var debug_ = require("debug");
var fs = require("fs");
var ta_json_x_1 = require("ta-json-x");
var lcp_1 = require("r2-lcp-js/dist/es5/src/parser/epub/lcp");
var zipInjector_1 = require("r2-utils-js/dist/es5/src/_utils/zip/zipInjector");
var debug = debug_("r2:navigator#electron/main/lsd-injectlcpl");
function lsdLcpUpdateInject(lcplStr, publication, publicationPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var lcplJson, zipEntryPath, lcpl;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            lcplJson = global.JSON.parse(lcplStr);
            debug(lcplJson);
            zipEntryPath = "META-INF/license.lcpl";
            try {
                lcpl = ta_json_x_1.JSON.deserialize(lcplJson, lcp_1.LCP);
            }
            catch (erorz) {
                return [2, Promise.reject(erorz)];
            }
            lcpl.ZipPath = zipEntryPath;
            lcpl.JsonSource = lcplStr;
            lcpl.init();
            publication.LCP = lcpl;
            return [2, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var newPublicationPath;
                    return tslib_1.__generator(this, function (_a) {
                        newPublicationPath = publicationPath + ".new";
                        zipInjector_1.injectBufferInZip(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath, function (err) {
                            reject(err);
                        }, function () {
                            debug("EPUB license.lcpl injected.");
                            setTimeout(function () {
                                fs.unlinkSync(publicationPath);
                                setTimeout(function () {
                                    fs.renameSync(newPublicationPath, publicationPath);
                                    resolve(publicationPath);
                                }, 500);
                            }, 500);
                        });
                        return [2];
                    });
                }); })];
        });
    });
}
exports.lsdLcpUpdateInject = lsdLcpUpdateInject;
//# sourceMappingURL=lsd-injectlcpl.js.map