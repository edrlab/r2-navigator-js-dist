"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleRedirect = void 0;
const debugBrowser = require("debug");
const debugNode = require("debug/src/node");
const util = require("util");
function consoleRedirect(debugNamespace, stdout, stderr, printInOriginalConsole) {
    const _consoleFunctionNames = ["error", "info", "log", "warn"];
    if (console.debug && (typeof console.debug === "function")) {
        _consoleFunctionNames.push("debug");
    }
    const outStream = stderr || stdout;
    const debugNodeInstance = debugNode(debugNamespace + "_");
    function debugLog(...args) {
        outStream.write(util.format.apply(util, args) + "\n");
    }
    debugNodeInstance.log = debugLog.bind(debugNodeInstance);
    function processConsoleFunctionCall(...args) {
        let processed = false;
        if (args.length >= 4) {
            if (typeof args[0] === "string" &&
                args[0].startsWith("%c") &&
                args[0].length >= 3) {
                const c2i = args[0].indexOf(" %c");
                if (c2i >= 3) {
                    const ns = args[0].substr(2, c2i - 2);
                    const lci = args[0].lastIndexOf("%c +");
                    if (lci > c2i) {
                        const d = c2i + 3;
                        const l = lci - d;
                        const msg = args[0].substr(d, l);
                        const count = (msg.replace(/%%/g, "").match(/%[Oosdjc]/g) || []).length;
                        const newAr = [msg];
                        if (count > 0) {
                            for (let j = 0; j < count; j++) {
                                newAr.push(args[j + 3]);
                            }
                        }
                        const k = count + 3 + 1;
                        if (k < args.length) {
                            for (let j = k; j < args.length; j++) {
                                newAr.push(args[j]);
                            }
                        }
                        const nsp = debugNodeInstance.namespace;
                        debugNodeInstance.namespace = ns;
                        debugNodeInstance.apply(debugNodeInstance, newAr);
                        debugNodeInstance.namespace = nsp;
                        processed = true;
                    }
                }
            }
        }
        if (!processed) {
            debugNodeInstance.apply(debugNodeInstance, args);
        }
    }
    debugBrowser.log = (...args) => {
        processConsoleFunctionCall.apply(console, args);
        if (printInOriginalConsole) {
            const consoleFunctionName = "log";
            const originalConsoleFunction = originalConsole[consoleFunctionName];
            originalConsoleFunction.apply(console, args);
        }
    };
    const originalConsole = {};
    _consoleFunctionNames.forEach((consoleFunctionName) => {
        const consoleFunction = console[consoleFunctionName];
        originalConsole[consoleFunctionName] = consoleFunction.bind(console);
        function newConsoleFunction(...args) {
            processConsoleFunctionCall.apply(this, args);
            if (printInOriginalConsole) {
                const originalConsoleFunction = originalConsole[consoleFunctionName];
                originalConsoleFunction.apply(this, args);
            }
        }
        console[consoleFunctionName] = newConsoleFunction.bind(console);
    });
    return () => {
        _consoleFunctionNames.forEach((consoleFunctionName) => {
            const originalConsoleFunction = originalConsole[consoleFunctionName];
            console[consoleFunctionName] = originalConsoleFunction.bind(console);
        });
    };
}
exports.consoleRedirect = consoleRedirect;
//# sourceMappingURL=console-redirect.js.map