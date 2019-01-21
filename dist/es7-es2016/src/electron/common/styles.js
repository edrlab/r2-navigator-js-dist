"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_CLASS_REDUCE_MOTION = "r2-reduce-motion";
exports.ROOT_CLASS_NO_FOOTNOTES = "r2-no-popup-foonotes";
exports.POPUP_DIALOG_CLASS = "r2-popup-dialog";
exports.FOOTNOTES_CONTAINER_CLASS = "r2-footnote-container";
exports.FOOTNOTES_CLOSE_BUTTON_CLASS = "r2-footnote-close";
exports.FOOTNOTE_FORCE_SHOW = "r2-footnote-force-show";
exports.footnotesCssStyles = `
@namespace epub "http://www.idpf.org/2007/ops";

:root:not(.${exports.ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="footnote"]:not(.${exports.FOOTNOTE_FORCE_SHOW}),
:root:not(.${exports.ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="note"]:not(.${exports.FOOTNOTE_FORCE_SHOW}),
:root:not(.${exports.ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="endnote"]:not(.${exports.FOOTNOTE_FORCE_SHOW}),
:root:not(.${exports.ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="rearnote"]:not(.${exports.FOOTNOTE_FORCE_SHOW}) {
    display: none;
}

/*
:root.${exports.POPUP_DIALOG_CLASS} {
    overflow: hidden !important;
}
*/

dialog.${exports.POPUP_DIALOG_CLASS}::backdrop {
    background-color: rgba(0, 0, 0, 0.3);
}
:root[style*="readium-night-on"] dialog.${exports.POPUP_DIALOG_CLASS}::backdrop {
    background-color: rgba(0, 0, 0, 0.65) !important;
}

dialog.${exports.POPUP_DIALOG_CLASS} {
    z-index: 3;

    position: fixed;

    width: 90%;
    max-width: 40em;

    bottom: 1em;
    height: 7em;

    margin: 0 auto;
    padding: 0;

    border-radius: 0.3em;
    border-width: 1px;

    background-color: white;
    border-color: black;

    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);

    display: grid;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-columns: 1.5em auto 1.5em;
    grid-template-rows: auto 1.5em;
}
:root[style*="readium-night-on"] dialog.${exports.POPUP_DIALOG_CLASS} {
    background-color: #333333 !important;
    border-color: white !important;
}

.${exports.FOOTNOTES_CONTAINER_CLASS} {
    overflow: auto;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 3;

    padding: 0.3em;
    margin: 0.2em;
}

.${exports.FOOTNOTES_CONTAINER_CLASS} > div > * {
    margin: 0 !important;
    padding: 0 !important;
}

/*
.${exports.FOOTNOTES_CLOSE_BUTTON_CLASS} {
    border: 1px solid black;
    background-color: white;
    color: black;

    border-radius: 0.8em;
    position: absolute;
    top: -0.9em;
    left: -0.9em;
    width: 1.8em;
    height: 1.8em;
    font-size: 1em !important;
    font-family: Arial !important;
    cursor: pointer;
}
:root[style*="readium-night-on"] .${exports.FOOTNOTES_CLOSE_BUTTON_CLASS} {
    border: 1px solid white !important;
    background-color: black !important;
    color: white !important;
}
*/
`;
exports.TTS_ID_PREVIOUS = "r2-tts-previous";
exports.TTS_ID_NEXT = "r2-tts-next";
exports.TTS_ID_SLIDER = "r2-tts-slider";
exports.TTS_ID_ACTIVE_WORD = "r2-tts-active-word";
exports.TTS_ID_CONTAINER = "r2-tts-txt";
exports.TTS_ID_INFO = "r2-tts-info";
exports.TTS_NAV_BUTTON_CLASS = "r2-tts-button";
exports.TTS_ID_SPEAKING_DOC_ELEMENT = "r2-tts-speaking-el";
exports.TTS_CLASS_INJECTED_SPAN = "r2-tts-speaking-txt";
exports.TTS_CLASS_INJECTED_SUBSPAN = "r2-tts-speaking-word";
exports.TTS_ID_INJECTED_PARENT = "r2-tts-speaking-txt-parent";
exports.ttsCssStyles = `

#${exports.TTS_ID_CONTAINER} {
    overflow: auto;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    padding: 0.3em;
    margin: 0;
    margin-left: 0.2em;
    margin-top: 0.2em;
    margin-right: 0.2em;

    hyphens: none !important;
    word-break: keep-all !important;
    word-wrap: break-word !important;

    /*
    font-size: 120% !important;
    line-height: 1.3em !important;
    */

    color: #888888 !important;
}
:root[style*="readium-night-on"] #${exports.TTS_ID_CONTAINER} {
    color: #bbbbbb !important;
}
#${exports.TTS_ID_INFO} {
    display: none;

    padding: 0;
    margin: 0;

    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 2;
    grid-row-end: 3;

    font-family: Arial !important;
    font-size: 90% !important;
}

#${exports.TTS_ID_SLIDER} {
    padding: 0;
    margin: 0;

    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 2;
    grid-row-end: 3;
}

.${exports.TTS_NAV_BUTTON_CLASS} {
    border-radius: 0.3em;
    border: 1px solid #EEEEEE;
    background-color: white;
    color: black;

    font-size: 100% !important;
    font-family: Arial !important;
    cursor: pointer;

    padding: 0;
    margin-top: 0.2em;
    margin-bottom: 0.2em;
}
:root[style*="readium-night-on"] .${exports.TTS_NAV_BUTTON_CLASS} {
    border: 1px solid white !important;
    background-color: black !important;
    color: white !important;
}
#${exports.TTS_ID_PREVIOUS} {
    margin-left: 0.2em;

    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 2;
    grid-row-end: 3;
}
#${exports.TTS_ID_NEXT} {
    margin-right: 0.2em;

    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 2;
    grid-row-end: 3;
}

.${exports.TTS_ID_SPEAKING_DOC_ELEMENT} {
    /*
    outline-color: silver;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 1px;
    */
}
.${exports.TTS_CLASS_INJECTED_SPAN} {
    color: black !important;
    background-color: #FFFFCC !important;

    /* text-decoration: underline; */

    padding: 0;
    margin: 0;
}
/*
:root[style*="readium-night-on"] .${exports.TTS_CLASS_INJECTED_SPAN} {
    color: white !important;
    background-color: #333300 !important;
}
.${exports.TTS_CLASS_INJECTED_SUBSPAN} {
    text-decoration: underline;
    padding: 0;
    margin: 0;
}

*/
.${exports.TTS_ID_INJECTED_PARENT} {
    /*
    outline-color: black;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 1px;
    */
}
:root[style*="readium-night-on"] .${exports.TTS_ID_INJECTED_PARENT} {
    /*
    outline-color: white !important;
    */
}

#${exports.TTS_ID_ACTIVE_WORD}  {
    color: black;
    text-decoration: underline;

    padding: 0;
    margin: 0;
}
:root[style*="readium-night-on"] #${exports.TTS_ID_ACTIVE_WORD} {
    color: white !important;
}
`;
exports.ROOT_CLASS_INVISIBLE_MASK = "r2-visibility-mask";
exports.visibilityMaskCssStyles = `
*.${exports.ROOT_CLASS_INVISIBLE_MASK} {
    visibility: hidden !important;
}
`;
exports.ROOT_CLASS_KEYBOARD_INTERACT = "r2-keyboard-interact";
exports.CSS_CLASS_NO_FOCUS_OUTLINE = "r2-no-focus-outline";
exports.focusCssStyles = `
@keyframes readium2ElectronAnimation_FOCUS {
    0% {
    }
    100% {
        outline: inherit;
    }
}
*:focus {
    outline: none;
}
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} *.${exports.CSS_CLASS_NO_FOCUS_OUTLINE}:focus {
    outline: none !important;
}
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} *:focus {
    outline-color: blue !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;
}
/*
:root:not(.${exports.ROOT_CLASS_KEYBOARD_INTERACT}) *:focus {
    animation-name: readium2ElectronAnimation_FOCUS;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
}
*/
`;
exports.targetCssStyles = `
@keyframes readium2ElectronAnimation_TARGET {
    0% {
    }
    100% {
        outline: inherit;
    }
}
*:target {
    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;

    animation-name: readium2ElectronAnimation_TARGET;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
}
*.r2-no-target-outline:target {
    outline: inherit !important;
}
`;
exports.selectionCssStyles = `
::selection {
background-color: rgb(155, 179, 240) !important;
color: black !important;
}

:root[style*="readium-night-on"] ::selection {
background-color: rgb(100, 122, 177) !important;
color: white !important;
}
/*
.readium2-hash {
    color: black !important;
    background-color: rgb(185, 207, 255) !important;
}
:root[style*="readium-night-on"] .readium2-hash {
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

:root[style*="readium-night-on"] ::-webkit-scrollbar-thumb {
background: #a4a4a4;
border: 3px solid #545454;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-thumb:hover {
background: #dedede;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-track {
background: #545454;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-track:horizontal {
border-top: 1px solid black;
}
:root[style*="readium-night-on"] ::-webkit-scrollbar-track:vertical {
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