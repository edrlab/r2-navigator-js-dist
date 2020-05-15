"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lsdLcpUpdateInject = void 0;
const debug_ = require("debug");
const fs = require("fs");
const lcp_1 = require("r2-lcp-js/dist/es8-es2017/src/parser/epub/lcp");
const serializable_1 = require("r2-lcp-js/dist/es8-es2017/src/serializable");
const zipInjector_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/zip/zipInjector");
const debug = debug_("r2:navigator#electron/main/lsd-injectlcpl");
async function lsdLcpUpdateInject(lcplStr, publication, publicationPath) {
    const lcplJson = global.JSON.parse(lcplStr);
    debug(lcplJson);
    const isAudio = publication.Metadata &&
        publication.Metadata.RDFType &&
        /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
    const zipEntryPath = isAudio ? "license.lcpl" : "META-INF/license.lcpl";
    let lcpl;
    try {
        lcpl = serializable_1.TaJsonDeserialize(lcplJson, lcp_1.LCP);
    }
    catch (erorz) {
        return Promise.reject(erorz);
    }
    lcpl.ZipPath = zipEntryPath;
    lcpl.JsonSource = lcplStr;
    lcpl.init();
    publication.LCP = lcpl;
    return new Promise(async (resolve, reject) => {
        const newPublicationPath = publicationPath + ".new";
        zipInjector_1.injectBufferInZip(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath, (err) => {
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
    });
}
exports.lsdLcpUpdateInject = lsdLcpUpdateInject;
//# sourceMappingURL=lsd-injectlcpl.js.map