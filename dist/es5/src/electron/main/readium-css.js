"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var transformer_1 = require("r2-shared-js/dist/es5/src/transform/transformer");
var transformer_html_1 = require("r2-shared-js/dist/es5/src/transform/transformer-html");
var readium_css_inject_1 = require("../common/readium-css-inject");
var readium_css_settings_1 = require("../common/readium-css-settings");
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
    var staticOptions = {
        dotfiles: "ignore",
        etag: true,
        fallthrough: false,
        immutable: true,
        index: false,
        maxAge: "1d",
        redirect: false,
        setHeaders: function (res, _path, _stat) {
            server.setResponseCORS(res);
        },
    };
    server.expressUse("/" + readium_css_settings_1.READIUM_CSS_URL_PATH, express.static(folderPath, staticOptions));
    if (readiumCssGetter) {
        var transformer = function (publication, link, str) {
            var mediaType = "application/xhtml+xml";
            if (link && link.TypeLink) {
                mediaType = link.TypeLink;
            }
            var readiumcssJson = isFixedLayout(publication, link) ?
                { setCSS: undefined, isFixedLayout: true } :
                readiumCssGetter(publication, link);
            if (readiumcssJson) {
                readiumcssJson.urlRoot = server.serverUrl();
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