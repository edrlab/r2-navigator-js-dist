"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWindowNavigatorEpubReadingSystem = void 0;
function setWindowNavigatorEpubReadingSystem(win, obj) {
    var ers = {};
    win.navigator.epubReadingSystem = ers;
    ers.name = obj.name || "Readium2";
    ers.version = obj.version || "0.0.0";
    ers.hasFeature = function (feature, _version) {
        switch (feature) {
            case "dom-manipulation": {
                return true;
            }
            case "layout-changes": {
                return true;
            }
            case "touch-events": {
                return true;
            }
            case "mouse-events": {
                return true;
            }
            case "keyboard-events": {
                return true;
            }
            case "spine-scripting": {
                return true;
            }
            default: return false;
        }
    };
}
exports.setWindowNavigatorEpubReadingSystem = setWindowNavigatorEpubReadingSystem;
//# sourceMappingURL=epubReadingSystem.js.map