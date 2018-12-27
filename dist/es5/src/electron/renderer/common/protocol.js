"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var sessions_1 = require("../../common/sessions");
exports.registerProtocol = function () {
    electron_1.webFrame.registerURLSchemeAsPrivileged(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, {
        allowServiceWorkers: false,
        bypassCSP: false,
        corsEnabled: true,
        secure: true,
        supportFetchAPI: true,
    });
};
//# sourceMappingURL=protocol.js.map