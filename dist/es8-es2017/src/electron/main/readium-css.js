"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const transformer_1 = require("r2-shared-js/dist/es8-es2017/src/transform/transformer");
const transformer_html_1 = require("r2-shared-js/dist/es8-es2017/src/transform/transformer-html");
const readium_css_inject_1 = require("../common/readium-css-inject");
const readium_css_settings_1 = require("../common/readium-css-settings");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function isFixedLayout(publication, link) {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }
    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}
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
    const transformer = (publication, link, str, sessionInfo) => {
        let mediaType = "application/xhtml+xml";
        if (link && link.TypeLink) {
            mediaType = link.TypeLink;
        }
        let readiumcssJson = readiumCssGetter(publication, link, sessionInfo);
        if (isFixedLayout(publication, link)) {
            const readiumcssJson_ = { setCSS: undefined, isFixedLayout: true };
            if (readiumcssJson.setCSS) {
                if (readiumcssJson.setCSS.mathJax) {
                }
                if (readiumcssJson.setCSS.reduceMotion) {
                }
            }
            readiumcssJson = readiumcssJson_;
        }
        if (readiumcssJson) {
            if (!readiumcssJson.urlRoot) {
                const u = server.serverUrl();
                if (u) {
                    readiumcssJson.urlRoot = u;
                }
            }
            if (IS_DEV) {
                console.log("_____ readiumCssJson.urlRoot (setupReadiumCSS() transformer): ", readiumcssJson.urlRoot);
            }
            return readium_css_inject_1.transformHTML(str, readiumcssJson, mediaType);
        }
        else {
            return str;
        }
    };
    transformer_1.Transformers.instance().add(new transformer_html_1.TransformerHTML(transformer));
}
exports.setupReadiumCSS = setupReadiumCSS;
//# sourceMappingURL=readium-css.js.map