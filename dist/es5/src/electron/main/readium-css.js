"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupReadiumCSS = void 0;
var express = require("express");
var transformer_1 = require("r2-shared-js/dist/es5/src/transform/transformer");
var transformer_html_1 = require("r2-shared-js/dist/es5/src/transform/transformer-html");
var readium_css_inject_1 = require("../common/readium-css-inject");
var readium_css_settings_1 = require("../common/readium-css-settings");
var url_params_1 = require("../renderer/common/url-params");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
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
    var transformerReadiumCss = function (publication, link, url, str, sessionInfo) {
        var isIframe = false;
        if (url) {
            var url_ = new URL(url);
            if (url_.searchParams.has(url_params_1.URL_PARAM_IS_IFRAME)) {
                isIframe = true;
            }
        }
        if (isIframe) {
            return str;
        }
        var readiumcssJson = readiumCssGetter(publication, link, sessionInfo);
        if (isFixedLayout(publication, link)) {
            var readiumcssJson_ = { setCSS: undefined, isFixedLayout: true };
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
                var u = server.serverUrl();
                if (u) {
                    readiumcssJson.urlRoot = u;
                }
            }
            if (IS_DEV) {
                console.log("_____ readiumCssJson.urlRoot (setupReadiumCSS() transformer): ", readiumcssJson.urlRoot);
            }
            var mediaType = "application/xhtml+xml";
            if (link && link.TypeLink) {
                mediaType = link.TypeLink;
            }
            return (0, readium_css_inject_1.readiumCssTransformHtml)(str, readiumcssJson, mediaType);
        }
        else {
            return str;
        }
    };
    transformer_1.Transformers.instance().add(new transformer_html_1.TransformerHTML(transformerReadiumCss));
}
exports.setupReadiumCSS = setupReadiumCSS;
//# sourceMappingURL=readium-css.js.map