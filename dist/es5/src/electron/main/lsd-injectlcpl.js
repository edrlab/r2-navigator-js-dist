"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lsdLcpUpdateInject = void 0;
var tslib_1 = require("tslib");
var debug_ = require("debug");
var fs = require("fs");
var lcp_1 = require("r2-lcp-js/dist/es5/src/parser/epub/lcp");
var serializable_1 = require("r2-lcp-js/dist/es5/src/serializable");
var zipInjector_1 = require("r2-utils-js/dist/es5/src/_utils/zip/zipInjector");
var debug = debug_("r2:navigator#electron/main/lsd-injectlcpl");
function lsdLcpUpdateInject(lcplStr, publication, publicationPath) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var lcplJson, isAudio, zipEntryPath, lcpl;
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            lcplJson = global.JSON.parse(lcplStr);
            debug(lcplJson);
            isAudio = publication.Metadata &&
                publication.Metadata.RDFType &&
                /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
            zipEntryPath = isAudio ? "license.lcpl" : "META-INF/license.lcpl";
            try {
                lcpl = (0, serializable_1.TaJsonDeserialize)(lcplJson, lcp_1.LCP);
            }
            catch (erorz) {
                return [2, Promise.reject(erorz)];
            }
            lcpl.ZipPath = zipEntryPath;
            lcpl.JsonSource = lcplStr;
            lcpl.init();
            publication.LCP = lcpl;
            return [2, new Promise(function (resolve, reject) { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
                    var newPublicationPath;
                    return (0, tslib_1.__generator)(this, function (_a) {
                        newPublicationPath = publicationPath + ".new";
                        (0, zipInjector_1.injectBufferInZip)(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath, function (err) {
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