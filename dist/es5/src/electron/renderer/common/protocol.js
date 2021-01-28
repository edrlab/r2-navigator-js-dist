"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProtocol = void 0;
var electron_1 = require("electron");
var sessions_1 = require("../../common/sessions");
var registerProtocol = function () {
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
                    stream: true,
                    supportFetchAPI: true,
                },
                scheme: sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL,
            }]);
    }
};
exports.registerProtocol = registerProtocol;
//# sourceMappingURL=protocol.js.map