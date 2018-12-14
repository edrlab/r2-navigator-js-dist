"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transformer_1 = require("r2-shared-js/dist/es8-es2017/src/transform/transformer");
const transformer_html_1 = require("r2-shared-js/dist/es8-es2017/src/transform/transformer-html");
const express = require("express");
const readium_css_inject_1 = require("../common/readium-css-inject");
const readium_css_settings_1 = require("../common/readium-css-settings");
function setupReadiumCSS(server, folderPath, readiumCssGetter) {
    const staticOptions = {
        dotfiles: "ignore",
        etag: true,
        fallthrough: false,
        immutable: true,
        index: false,
        maxAge: "1d",
        redirect: false,
        setHeaders: (res, _path, _stat) => {
            server.setResponseCORS(res);
        },
    };
    server.expressUse("/" + readium_css_settings_1.READIUM_CSS_URL_PATH, express.static(folderPath, staticOptions));
    if (readiumCssGetter) {
        const transformer = (publication, link, str) => {
            let mediaType = "application/xhtml+xml";
            if (link && link.TypeLink) {
                mediaType = link.TypeLink;
            }
            const readiumcssJson = readiumCssGetter(publication, link);
            if (readiumcssJson) {
                return readium_css_inject_1.transformHTML(str, readiumcssJson, mediaType);
            }
            else {
                return str;
            }
        };
        transformer_1.Transformers.instance().add(new transformer_html_1.TransformerHTML(transformer));
    }
}
exports.setupReadiumCSS = setupReadiumCSS;
//# sourceMappingURL=readium-css.js.map