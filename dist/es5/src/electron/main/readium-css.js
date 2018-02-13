"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
function setupReadiumCSS(server, folderPath) {
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
    server.expressUse("/readium-css", express.static(folderPath, staticOptions));
}
exports.setupReadiumCSS = setupReadiumCSS;
//# sourceMappingURL=readium-css.js.map