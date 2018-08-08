"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("util");
var debugNode = require("debug/node");
var _consoleFunctionNames = ["error", "info", "log", "warn"];
if (console.debug && (typeof console.debug === "function")) {
    _consoleFunctionNames.push("debug");
}
function consoleRedirect(debugNamespace, stdout, stderr, printInOriginalConsole) {
    var outStream = stderr || stdout;
    var debug;
    if (debugNamespace && outStream) {
        debug = debugNode(debugNamespace);
        debug.log = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            outStream.write(util.format.apply(util, args) + "\n");
        };
    }
    var originalConsole = {};
    _consoleFunctionNames.forEach(function (consoleFunctionName) {
        var consoleFunction = console[consoleFunctionName];
        originalConsole[consoleFunctionName] = consoleFunction.bind(console);
        console[consoleFunctionName] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (debug) {
                debug.apply(this, args);
            }
            else {
                var writeStream = (consoleFunctionName === "error" || consoleFunctionName === "warn")
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
    return function () {
        _consoleFunctionNames.forEach(function (consoleFunctionName) {
            console[consoleFunctionName] = originalConsole[consoleFunctionName];
        });
    };
}
exports.consoleRedirect = consoleRedirect;
//# sourceMappingURL=console-redirect.js.map