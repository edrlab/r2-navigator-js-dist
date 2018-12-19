"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.focusCssStyles = `
@keyframes readium2ElectronAnimation_FOCUS {
    100% {
        outline: inherit;
    }
}
*:focus {
    outline-color: blue !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 0px !important;
    animation: readium2ElectronAnimation_FOCUS 3s forwards;
}
*.no-focus-outline:focus {
    outline: inherit !important;
}
`;
exports.targetCssStyles = `
@keyframes readium2ElectronAnimation_TARGET {
    100% {
        outline: inherit;
    }
}
*:target {
    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;
    animation: readium2ElectronAnimation_TARGET 3s forwards;
}
*.no-target-outline:target {
    outline: inherit !important;
}
`;
exports.selectionCssStyles = `
::selection {
background-color: rgb(155, 179, 240) !important;
color: black !important;
}

:root.mdc-theme--dark ::selection {
background-color: rgb(100, 122, 177) !important;
color: white !important;
}
/*
.readium2-hash {
    color: black !important;
    background-color: rgb(185, 207, 255) !important;
}
:root.mdc-theme--dark .readium2-hash {
    color: white !important;
    background-color: rgb(67, 64, 125) !important;
}
*/
`;
exports.scrollBarCssStyles = `
::-webkit-scrollbar-button {
height: 0px !important;
width: 0px !important;
}

::-webkit-scrollbar-corner {
background: transparent !important;
}

/*::-webkit-scrollbar-track-piece {
background-color: red;
} */

::-webkit-scrollbar {
width:  14px;
height: 14px;
}

::-webkit-scrollbar-thumb {
background: #727272;
background-clip: padding-box !important;
border: 3px solid transparent !important;
border-radius: 30px;
}

::-webkit-scrollbar-thumb:hover {
background: #4d4d4d;
}

::-webkit-scrollbar-track {
box-shadow: inset 0 0 3px rgba(40, 40, 40, 0.2);
background: #dddddd;
box-sizing: content-box;
}

::-webkit-scrollbar-track:horizontal {
border-top: 1px solid silver;
}
::-webkit-scrollbar-track:vertical {
border-left: 1px solid silver;
}

:root.mdc-theme--dark ::-webkit-scrollbar-thumb {
background: #a4a4a4;
border: 3px solid #545454;
}

:root.mdc-theme--dark ::-webkit-scrollbar-thumb:hover {
background: #dedede;
}

:root.mdc-theme--dark ::-webkit-scrollbar-track {
background: #545454;
}

:root.mdc-theme--dark ::-webkit-scrollbar-track:horizontal {
border-top: 1px solid black;
}
:root.mdc-theme--dark ::-webkit-scrollbar-track:vertical {
border-left: 1px solid black;
}`;
exports.readPosCssStylesAttr1 = "data-readium2-read-pos1";
exports.readPosCssStylesAttr2 = "data-readium2-read-pos2";
exports.readPosCssStylesAttr3 = "data-readium2-read-pos3";
exports.readPosCssStylesAttr4 = "data-readium2-read-pos4";
exports.readPosCssStyles = `
:root[style*="readium-sepia-on"] *[${exports.readPosCssStylesAttr1}],
:root[style*="readium-night-on"] *[${exports.readPosCssStylesAttr1}],
*[${exports.readPosCssStylesAttr1}] {
    color: black !important;
    background-color: magenta !important;

    outline-color: magenta !important;
    outline-style: solid !important;
    outline-width: 6px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${exports.readPosCssStylesAttr2}],
:root[style*="readium-night-on"] *[${exports.readPosCssStylesAttr2}],
*[${exports.readPosCssStylesAttr2}] {
    color: black !important;
    background-color: yellow !important;

    outline-color: yellow !important;
    outline-style: solid !important;
    outline-width: 4px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${exports.readPosCssStylesAttr3}],
:root[style*="readium-night-on"] *[${exports.readPosCssStylesAttr3}],
*[${exports.readPosCssStylesAttr3}] {
    color: black !important;
    background-color: green !important;

    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${exports.readPosCssStylesAttr4}],
:root[style*="readium-night-on"] *[${exports.readPosCssStylesAttr4}],
*[${exports.readPosCssStylesAttr4}] {
    color: black !important;
    background-color: silver !important;

    outline-color: silver !important;
    outline-style: solid !important;
    outline-width: 1px !important;
    outline-offset: 0px !important;
}`;
//# sourceMappingURL=styles.js.map