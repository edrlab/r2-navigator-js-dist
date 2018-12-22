"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("util");
var debugBrowser = require("debug");
var debugNode = require("debug/src/node");
function consoleRedirect(debugNamespace, stdout, stderr, printInOriginalConsole) {
    var _consoleFunctionNames = ["error", "info", "log", "warn"];
    if (console.debug && (typeof console.debug === "function")) {
        _consoleFunctionNames.push("debug");
    }
    var outStream = stderr || stdout;
    var debugNodeInstance = debugNode(debugNamespace + "_");
    function debugLog() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        outStream.write(util.format.apply(util, args) + "\n");
    }
    debugNodeInstance.log = debugLog.bind(debugNodeInstance);
    function processConsoleFunctionCall() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var processed = false;
        if (args.length >= 4) {
            if (typeof args[0] === "string" &&
                args[0].startsWith("%c") &&
                args[0].length >= 3) {
                var c2i = args[0].indexOf(" %c");
                if (c2i >= 3) {
                    var ns = args[0].substr(2, c2i - 2);
                    var lci = args[0].lastIndexOf("%c +");
                    if (lci > c2i) {
                        var d = c2i + 3;
                        var l = lci - d;
                        var msg = args[0].substr(d, l);
                        var count = (msg.replace(/%%/g, "").match(/%[Oosdjc]/g) || []).length;
                        var newAr = [msg];
                        if (count > 0) {
                            for (var j = 0; j < count; j++) {
                                newAr.push(args[j + 3]);
                            }
                        }
                        var k = count + 3 + 1;
                        if (k < args.length) {
                            for (var j = k; j < args.length; j++) {
                                newAr.push(args[j]);
                            }
                        }
                        var nsp = debugNodeInstance.namespace;
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
    debugBrowser.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        processConsoleFunctionCall.apply(console, args);
        if (printInOriginalConsole) {
            var consoleFunctionName = "log";
            var originalConsoleFunction = originalConsole[consoleFunctionName];
            originalConsoleFunction.apply(console, args);
        }
    };
    var originalConsole = {};
    _consoleFunctionNames.forEach(function (consoleFunctionName) {
        var consoleFunction = console[consoleFunctionName];
        originalConsole[consoleFunctionName] = consoleFunction.bind(console);
        function newConsoleFunction() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            processConsoleFunctionCall.apply(this, args);
            if (printInOriginalConsole) {
                var originalConsoleFunction = originalConsole[consoleFunctionName];
                originalConsoleFunction.apply(this, args);
            }
        }
        console[consoleFunctionName] = newConsoleFunction.bind(console);
    });
    return function () {
        _consoleFunctionNames.forEach(function (consoleFunctionName) {
            var originalConsoleFunction = originalConsole[consoleFunctionName];
            console[consoleFunctionName] = originalConsoleFunction.bind(console);
        });
    };
}
exports.consoleRedirect = consoleRedirect;
//# sourceMappingURL=console-redirect.js.map