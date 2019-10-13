"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const sessions_1 = require("../../common/sessions");
exports.registerProtocol = () => {
    if (electron_1.webFrame.registerURLSchemeAsPrivileged) {
        electron_1.webFrame.registerURLSchemeAsPrivileged(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL, {
            allowServiceWorkers: false,
            bypassCSP: false,
            corsEnabled: true,
            secure: true,
            supportFetchAPI: true,
        });
    }
    else {
        electron_1.protocol.registerSchemesAsPrivileged([{
                privileges: {
                    allowServiceWorkers: false,
                    bypassCSP: false,
                    corsEnabled: true,
                    secure: true,
                    standard: true,
                    supportFetchAPI: true,
                },
                scheme: sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL,
            }]);
    }
};
//# sourceMappingURL=protocol.js.map