"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const sessions_1 = require("../../common/sessions");
exports.registerProtocol = () => {
    electron_1.webFrame.registerURLSchemeAsPrivileged(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, {
        allowServiceWorkers: false,
        bypassCSP: false,
        corsEnabled: true,
        secure: true,
        supportFetchAPI: true,
    });
};
//# sourceMappingURL=protocol.js.map