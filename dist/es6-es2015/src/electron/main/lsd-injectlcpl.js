"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lsdLcpUpdateInject = void 0;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const fs = require("fs");
const lcp_1 = require("r2-lcp-js/dist/es6-es2015/src/parser/epub/lcp");
const serializable_1 = require("r2-lcp-js/dist/es6-es2015/src/serializable");
const zipInjector_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/zip/zipInjector");
const debug = debug_("r2:navigator#electron/main/lsd-injectlcpl");
function lsdLcpUpdateInject(lcplStr, publication, publicationPath) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const lcplJson = global.JSON.parse(lcplStr);
        debug(lcplJson);
        const isAudio = publication.Metadata &&
            publication.Metadata.RDFType &&
            /https?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
        const zipEntryPath = isAudio ? "license.lcpl" : "META-INF/license.lcpl";
        let lcpl;
        try {
            lcpl = (0, serializable_1.TaJsonDeserialize)(lcplJson, lcp_1.LCP);
        }
        catch (erorz) {
            return Promise.reject(erorz);
        }
        lcpl.ZipPath = zipEntryPath;
        lcpl.JsonSource = lcplStr;
        lcpl.init();
        publication.LCP = lcpl;
        return new Promise((resolve, reject) => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const newPublicationPath = publicationPath + ".new";
            (0, zipInjector_1.injectBufferInZip)(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath, (err) => {
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
//# sourceMappingURL=lsd-injectlcpl.js.map