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

:root[style] dialog#${exports.POPUP_DIALOG_CLASS}::backdrop,
:root dialog#${exports.POPUP_DIALOG_CLASS}::backdrop {
    background: rgba(0, 0, 0, 0.3) !important;
}
:root[style*="readium-night-on"] dialog#${exports.POPUP_DIALOG_CLASS}::backdrop {
    background: rgba(0, 0, 0, 0.65) !important;
}

:root[style] dialog#${exports.POPUP_DIALOG_CLASS},
:root dialog#${exports.POPUP_DIALOG_CLASS} {
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

    background: white !important;
    border-color: black !important;

    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);

    display: grid;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-columns: 1.5em auto 1.5em;
    grid-template-rows: auto 1.5em;
}
:root[style*="readium-night-on"] dialog#${exports.POPUP_DIALOG_CLASS} {
    background: #333333 !important;
    border-color: white !important;
}
:root[style*="readium-sepia-on"] dialog#${exports.POPUP_DIALOG_CLASS} {
    background: var(--RS__backgroundColor) !important;
}
:root[style*="--USER__backgroundColor"] dialog#${exports.POPUP_DIALOG_CLASS} {
    background: var(--USER__backgroundColor) !important;
}
:root[style] .${exports.FOOTNOTES_CONTAINER_CLASS},
:root .${exports.FOOTNOTES_CONTAINER_CLASS} {
    overflow: auto;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 3;

    padding: 0.3em;
    margin: 0.2em;
}

:root[style] .${exports.FOOTNOTES_CONTAINER_CLASS} > div > *,
:root .${exports.FOOTNOTES_CONTAINER_CLASS} > div > * {
    margin: 0 !important;
    padding: 0 !important;
}

/*
:root[style] .${exports.FOOTNOTES_CLOSE_BUTTON_CLASS},
:root .${exports.FOOTNOTES_CLOSE_BUTTON_CLASS} {
    border: 1px solid black;
    background: white !important;
    color: black !important;

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
    background: black !important;
    color: white !important;
}
*/
`;
exports.TTS_ID_PREVIOUS = "r2-tts-previous";
exports.TTS_ID_NEXT = "r2-tts-next";
exports.TTS_ID_SLIDER = "r2-tts-slider";
exports.TTS_ID_ACTIVE_WORD = "r2-tts-active-word";
exports.TTS_ID_ACTIVE_UTTERANCE = "r2-tts-active-utterance";
exports.TTS_CLASS_UTTERANCE = "r2-tts-utterance";
exports.TTS_ID_CONTAINER = "r2-tts-txt";
exports.TTS_ID_INFO = "r2-tts-info";
exports.TTS_NAV_BUTTON_CLASS = "r2-tts-button";
exports.TTS_ID_SPEAKING_DOC_ELEMENT = "r2-tts-speaking-el";
exports.TTS_CLASS_INJECTED_SPAN = "r2-tts-speaking-txt";
exports.TTS_CLASS_INJECTED_SUBSPAN = "r2-tts-speaking-word";
exports.TTS_ID_INJECTED_PARENT = "r2-tts-speaking-txt-parent";
exports.TTS_POPUP_DIALOG_CLASS = "r2-tts-popup-dialog";
exports.ttsCssStyles = `

:root[style] dialog#${exports.POPUP_DIALOG_CLASS}.${exports.TTS_POPUP_DIALOG_CLASS},
:root dialog#${exports.POPUP_DIALOG_CLASS}.${exports.TTS_POPUP_DIALOG_CLASS} {
    width: auto;
    max-width: 100%;

    height: auto;
    max-height: 100%;

    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;

    margin: 0;
    padding: 0;

    box-shadow: none;

    border-radius: 0;
    border-style: solid;
    border-width: 2px;
    border-color: black !important;
}

:root[style] div#${exports.TTS_ID_CONTAINER},
:root div#${exports.TTS_ID_CONTAINER} {
    overflow: auto;
    overflow-x: hidden;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    padding: 1em;
    margin: 0;
    margin-left: 0.2em;
    margin-top: 0.2em;
    margin-right: 0.2em;

    hyphens: none !important;
    word-break: keep-all !important;
    word-wrap: break-word !important;

    font-size: 120% !important;

    line-height: initial !important;

    color: #999999 !important;
}
:root[style*="--USER__lineHeight"] div#${exports.TTS_ID_CONTAINER} {
    line-height: calc(var(--USER__lineHeight) * 1.2) !important;
}
:root[style*="readium-night-on"] div#${exports.TTS_ID_CONTAINER} {
    color: #bbbbbb !important;
}
:root[style*="readium-sepia-on"] div#${exports.TTS_ID_CONTAINER}{
    background: var(--RS__backgroundColor) !important;
    color: var(--RS__textColor) !important;
}
:root[style*="--USER__backgroundColor"] div#${exports.TTS_ID_CONTAINER} {
    background: var(--USER__backgroundColor) !important;
}
:root[style*="--USER__textColor"] div#${exports.TTS_ID_CONTAINER} {
    color: var(--USER__textColor) !important;
}
:root[style] #${exports.TTS_ID_INFO},
:root #${exports.TTS_ID_INFO} {
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

:root[style] #${exports.TTS_ID_SLIDER},
:root #${exports.TTS_ID_SLIDER} {
    padding: 0;
    margin: 0;
    margin-left: 6px;
    margin-right: 6px;
    margin-top: 6px;
    margin-bottom: 6px;

    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 2;
    grid-row-end: 3;

    cursor: pointer;
    -webkit-appearance: none;

    background: transparent !important;
}
:root #${exports.TTS_ID_SLIDER}::-webkit-slider-runnable-track {
    cursor: pointer;

    width: 100%;
    height: 0.5em;

    background: #999999;

    padding: 0;
    margin: 0;
}
:root[style*="readium-night-on"] #${exports.TTS_ID_SLIDER}::-webkit-slider-runnable-track {
    background: #545454;
}
:root #${exports.TTS_ID_SLIDER}::-webkit-slider-thumb {
    -webkit-appearance: none;

    cursor: pointer;

    width: 0.8em;
    height: 1.5em;

    padding: 0;
    margin: 0;
    margin-top: -0.5em;

    border: none;
    border-radius: 0.2em;

    background: #333333;
}
:root[style*="readium-night-on"] #${exports.TTS_ID_SLIDER}::-webkit-slider-thumb {
    background: white;
}
:root[style] button.${exports.TTS_NAV_BUTTON_CLASS} > span,
:root button.${exports.TTS_NAV_BUTTON_CLASS} > span {
    vertical-align: baseline;
}
:root[style] button.${exports.TTS_NAV_BUTTON_CLASS},
:root button.${exports.TTS_NAV_BUTTON_CLASS} {
    border: none;

    font-size: 100% !important;
    font-family: Arial !important;
    cursor: pointer;

    padding: 0;
    margin-top: 0.2em;
    margin-bottom: 0.2em;

    background: transparent !important;
    color: black !important;
}
:root[style*="readium-night-on"] button.${exports.TTS_NAV_BUTTON_CLASS} {
    color: white !important;
}
/*
:root[style*="readium-sepia-on"] button.${exports.TTS_NAV_BUTTON_CLASS} {
    background: var(--RS__backgroundColor) !important;
}
:root[style*="--USER__backgroundColor"] button.${exports.TTS_NAV_BUTTON_CLASS} {
    background: var(--USER__backgroundColor) !important;
}
*/
:root[style] #${exports.TTS_ID_PREVIOUS},
:root #${exports.TTS_ID_PREVIOUS} {
    margin-left: 0.2em;

    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 2;
    grid-row-end: 3;
}
:root[style] #${exports.TTS_ID_NEXT},
:root #${exports.TTS_ID_NEXT} {
    margin-right: 0.2em;

    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 2;
    grid-row-end: 3;
}

:root[style] .${exports.TTS_ID_SPEAKING_DOC_ELEMENT},
:root .${exports.TTS_ID_SPEAKING_DOC_ELEMENT} {
    /*
    outline-color: silver;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 1px;
    */
}
:root[style] .${exports.TTS_CLASS_INJECTED_SPAN},
:root .${exports.TTS_CLASS_INJECTED_SPAN} {
    color: black !important;
    background: #FFFFCC !important;

    /* text-decoration: underline; */

    padding: 0;
    margin: 0;
}
/*
:root[style*="readium-night-on"] .${exports.TTS_CLASS_INJECTED_SPAN} {
    color: white !important;
    background: #333300 !important;
}
:root[style] .${exports.TTS_CLASS_INJECTED_SUBSPAN},
:root .${exports.TTS_CLASS_INJECTED_SUBSPAN} {
    text-decoration: underline;
    padding: 0;
    margin: 0;
}
*/
:root[style] .${exports.TTS_ID_INJECTED_PARENT},
:root .${exports.TTS_ID_INJECTED_PARENT} {
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

.${exports.TTS_CLASS_UTTERANCE} {
    margin-bottom: 1em;
    padding: 0;
    display: block;
}

:root[style] div#${exports.TTS_ID_ACTIVE_UTTERANCE},
:root div#${exports.TTS_ID_ACTIVE_UTTERANCE} {
    /* background-color: yellow !important; */

    color: black !important;
}
:root[style*="readium-night-on"] div#${exports.TTS_ID_ACTIVE_UTTERANCE} {
    color: white !important;
}
:root[style*="readium-sepia-on"] div#${exports.TTS_ID_ACTIVE_UTTERANCE} {
    color: black !important;
}
:root[style*="--USER__textColor"] div#${exports.TTS_ID_ACTIVE_UTTERANCE} {
    color: var(--USER__textColor) !important;
}

:root[style] span#${exports.TTS_ID_ACTIVE_WORD},
:root span#${exports.TTS_ID_ACTIVE_WORD} {
    color: black !important;

    /*
    text-decoration: underline;
    text-underline-position: under;
    */
    outline-color: black;
    outline-offset: 2px;
    outline-style: solid;
    outline-width: 1px;

    padding: 0;
    margin: 0;
}
:root[style*="readium-night-on"] span#${exports.TTS_ID_ACTIVE_WORD} {
    color: white !important;
    outline-color: white;
}
:root[style*="readium-sepia-on"] span#${exports.TTS_ID_ACTIVE_WORD} {
    color: black !important;
    outline-color: black;
}
:root[style*="--USER__textColor"] span#${exports.TTS_ID_ACTIVE_WORD} {
    color: var(--USER__textColor) !important;
    outline-color: var(--USER__textColor);
}
`;
exports.ROOT_CLASS_INVISIBLE_MASK = "r2-visibility-mask";
exports.visibilityMaskCssStyles = `
:root[style] *.${exports.ROOT_CLASS_INVISIBLE_MASK},
:root *.${exports.ROOT_CLASS_INVISIBLE_MASK} {
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
:root[style] *:focus,
:root *:focus {
    outline: none;
}
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} *.${exports.CSS_CLASS_NO_FOCUS_OUTLINE}:focus,
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} *.${exports.CSS_CLASS_NO_FOCUS_OUTLINE}:focus {
    outline: none !important;
}
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} *:focus,
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} *:focus {
    outline-color: blue !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;
}
/*
:root[style]:not(.${exports.ROOT_CLASS_KEYBOARD_INTERACT}) *:focus,
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
:root[style] *:target,
:root *:target {
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
:root[style] *.r2-no-target-outline:target,
:root *.r2-no-target-outline:target {
    outline: inherit !important;
}
`;
exports.selectionCssStyles = `
:root[style] ::selection,
:root ::selection {
background: rgb(155, 179, 240) !important;
color: black !important;
}

:root[style*="readium-night-on"] ::selection {
background: rgb(100, 122, 177) !important;
color: white !important;
}
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
background: red;
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
:root[style] *[${exports.readPosCssStylesAttr1}],
:root *[${exports.readPosCssStylesAttr1}] {
    color: black !important;
    background: magenta !important;

    outline-color: magenta !important;
    outline-style: solid !important;
    outline-width: 6px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${exports.readPosCssStylesAttr2}],
:root[style*="readium-night-on"] *[${exports.readPosCssStylesAttr2}],
:root[style] *[${exports.readPosCssStylesAttr2}],
:root *[${exports.readPosCssStylesAttr2}] {
    color: black !important;
    background: yellow !important;

    outline-color: yellow !important;
    outline-style: solid !important;
    outline-width: 4px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${exports.readPosCssStylesAttr3}],
:root[style*="readium-night-on"] *[${exports.readPosCssStylesAttr3}],
:root[style] *[${exports.readPosCssStylesAttr3}],
:root *[${exports.readPosCssStylesAttr3}] {
    color: black !important;
    background: green !important;

    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${exports.readPosCssStylesAttr4}],
:root[style*="readium-night-on"] *[${exports.readPosCssStylesAttr4}],
:root[style] *[${exports.readPosCssStylesAttr4}],
:root *[${exports.readPosCssStylesAttr4}] {
    color: black !important;
    background: silver !important;

    outline-color: silver !important;
    outline-style: solid !important;
    outline-width: 1px !important;
    outline-offset: 0px !important;
}`;
//# sourceMappingURL=styles.js.map