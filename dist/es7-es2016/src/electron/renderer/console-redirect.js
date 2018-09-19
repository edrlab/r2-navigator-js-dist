"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const debugNode = require("debug/src/node");
const _consoleFunctionNames = ["error", "info", "log", "warn"];
if (console.debug && (typeof console.debug === "function")) {
    _consoleFunctionNames.push("debug");
}
function consoleRedirect(debugNamespace, stdout, stderr, printInOriginalConsole) {
    const outStream = stderr || stdout;
    let debug;
    if (debugNamespace && outStream) {
        debug = debugNode(debugNamespace);
        debug.log = (...args) => {
            outStream.write(util.format.apply(util, args) + "\n");
        };
    }
    const originalConsole = {};
    _consoleFunctionNames.forEach((consoleFunctionName) => {
        const consoleFunction = console[consoleFunctionName];
        originalConsole[consoleFunctionName] = consoleFunction.bind(console);
        console[consoleFunctionName] = function (...args) {
            if (debug) {
                debug.apply(this, args);
            }
            else {
                const writeStream = (consoleFunctionName === "error" || consoleFunctionName === "warn")
                    ? stderr
                    : stdout;
                if (writeStream) {
                    writeStream.write(util.format.apply(util, args) + "\n");
                }
            }
            if (printInOriginalConsole) {
                return originalConsole[consoleFunctionName].apply(this, args);
            }
        };
    });
    return () => {
        _consoleFunctionNames.forEach((consoleFunctionName) => {
            console[consoleFunctionName] = originalConsole[consoleFunctionName];
        });
    };
}
exports.consoleRedirect = consoleRedirect;
//# sourceMappingURL=console-redirect.js.map