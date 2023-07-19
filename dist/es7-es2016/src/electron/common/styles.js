"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetCssStyles = exports.focusCssStyles = exports.visibilityMaskCssStyles = exports.ROOT_CLASS_INVISIBLE_MASK_REMOVED = exports.ROOT_CLASS_INVISIBLE_MASK = exports.ttsCssStyles = exports.TTS_POPUP_DIALOG_CLASS = exports.TTS_ID_SPEAKING_DOC_ELEMENT = exports.TTS_NAV_BUTTON_CLASS = exports.TTS_ID_CONTAINER = exports.TTS_CLASS_UTTERANCE_HEADING5 = exports.TTS_CLASS_UTTERANCE_HEADING4 = exports.TTS_CLASS_UTTERANCE_HEADING3 = exports.TTS_CLASS_UTTERANCE_HEADING2 = exports.TTS_CLASS_UTTERANCE_HEADING1 = exports.TTS_CLASS_UTTERANCE = exports.TTS_ID_ACTIVE_UTTERANCE = exports.TTS_ID_ACTIVE_WORD = exports.TTS_ID_SLIDER = exports.TTS_ID_NEXT = exports.TTS_ID_PREVIOUS = exports.TTS_CLASS_IS_ACTIVE = exports.TTS_CLASS_THEME1 = exports.mediaOverlaysCssStyles = exports.R2_MO_CLASS_ACTIVE_PLAYBACK = exports.R2_MO_CLASS_ACTIVE = exports.footnotesCssStyles = exports.CSS_CLASS_NO_FOCUS_OUTLINE = exports.ROOT_CLASS_KEYBOARD_INTERACT = exports.POPUP_DIALOG_CLASS_COLLAPSE = exports.POPUP_DIALOG_CLASS = exports.POPOUTIMAGE_RESET_ID = exports.POPOUTIMAGE_PLUS_ID = exports.POPOUTIMAGE_MINUS_ID = exports.POPOUTIMAGE_CONTROLS_ID = exports.POPOUTIMAGE_CLOSE_ID = exports.POPOUTIMAGE_CONTAINER_ID = exports.FOOTNOTE_FORCE_SHOW = exports.FOOTNOTES_CLOSE_BUTTON_CLASS = exports.FOOTNOTES_CONTAINER_CLASS = exports.ROOT_CLASS_NO_FOOTNOTES = exports.ROOT_CLASS_FIXED_LAYOUT = exports.ROOT_CLASS_MATHJAX = exports.ROOT_CLASS_REDUCE_MOTION = exports.LINK_TARGET_CLASS = exports.SKIP_LINK_ID = exports.ZERO_TRANSFORM_CLASS = exports.HIDE_CURSOR_CLASS = exports.CLASS_PAGINATED = exports.WebViewSlotEnum = void 0;
exports.audioCssStyles = exports.AUDIO_FORWARD_ID = exports.AUDIO_REWIND_ID = exports.AUDIO_NEXT_ID = exports.AUDIO_PREVIOUS_ID = exports.AUDIO_PLAYPAUSE_ID = exports.AUDIO_RATE_ID = exports.AUDIO_PERCENT_ID = exports.AUDIO_TIME_ID = exports.AUDIO_SLIDER_ID = exports.AUDIO_TITLE_ID = exports.AUDIO_COVER_ID = exports.AUDIO_CONTROLS_ID = exports.AUDIO_SECTION_ID = exports.AUDIO_BODY_ID = exports.AUDIO_ID = exports.AUDIO_PROGRESS_CLASS = exports.AUDIO_BUFFER_CANVAS_ID = exports.readPosCssStyles = exports.readPosCssStylesAttr4 = exports.readPosCssStylesAttr3 = exports.readPosCssStylesAttr2 = exports.readPosCssStylesAttr1 = exports.scrollBarCssStyles = exports.selectionCssStyles = void 0;
var WebViewSlotEnum;
(function (WebViewSlotEnum) {
    WebViewSlotEnum["center"] = "center";
    WebViewSlotEnum["left"] = "left";
    WebViewSlotEnum["right"] = "right";
})(WebViewSlotEnum || (exports.WebViewSlotEnum = WebViewSlotEnum = {}));
exports.CLASS_PAGINATED = "r2-css-paginated";
exports.HIDE_CURSOR_CLASS = "r2-hideCursor";
exports.ZERO_TRANSFORM_CLASS = "r2-zeroTransform";
exports.SKIP_LINK_ID = "r2-skip-link";
exports.LINK_TARGET_CLASS = "r2-link-target";
exports.ROOT_CLASS_REDUCE_MOTION = "r2-reduce-motion";
exports.ROOT_CLASS_MATHJAX = "r2-mathjax";
exports.ROOT_CLASS_FIXED_LAYOUT = "r2-fixed-layout";
exports.ROOT_CLASS_NO_FOOTNOTES = "r2-no-popup-foonotes";
exports.FOOTNOTES_CONTAINER_CLASS = "r2-footnote-container";
exports.FOOTNOTES_CLOSE_BUTTON_CLASS = "r2-footnote-close";
exports.FOOTNOTE_FORCE_SHOW = "r2-footnote-force-show";
exports.POPOUTIMAGE_CONTAINER_ID = "r2-popoutimage-container-id";
exports.POPOUTIMAGE_CLOSE_ID = "r2-popoutimage-close-id";
exports.POPOUTIMAGE_CONTROLS_ID = "r2-popoutimage-controls-id";
exports.POPOUTIMAGE_MINUS_ID = "r2-popoutimage-minus-id";
exports.POPOUTIMAGE_PLUS_ID = "r2-popoutimage-plus-id";
exports.POPOUTIMAGE_RESET_ID = "r2-popoutimage-reset-id";
exports.POPUP_DIALOG_CLASS = "r2-popup-dialog";
exports.POPUP_DIALOG_CLASS_COLLAPSE = "r2-popup-dialog-collapse";
exports.ROOT_CLASS_KEYBOARD_INTERACT = "r2-keyboard-interact";
exports.CSS_CLASS_NO_FOCUS_OUTLINE = "r2-no-focus-outline";
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

:root[style] dialog#${exports.POPUP_DIALOG_CLASS}:not(.${exports.POPUP_DIALOG_CLASS_COLLAPSE})::backdrop,
:root dialog#${exports.POPUP_DIALOG_CLASS}:not(.${exports.POPUP_DIALOG_CLASS_COLLAPSE})::backdrop {
    background: rgba(0, 0, 0, 0.3) !important;
}
:root[style*="readium-night-on"] dialog#${exports.POPUP_DIALOG_CLASS}:not(.${exports.POPUP_DIALOG_CLASS_COLLAPSE})::backdrop {
    background: rgba(0, 0, 0, 0.65) !important;
}
:root[style] dialog#${exports.POPUP_DIALOG_CLASS}.${exports.POPUP_DIALOG_CLASS_COLLAPSE}::backdrop,
:root dialog#${exports.POPUP_DIALOG_CLASS}.${exports.POPUP_DIALOG_CLASS_COLLAPSE}::backdrop {
    background: transparent !important;
}

:root[style] dialog#${exports.POPUP_DIALOG_CLASS},
:root dialog#${exports.POPUP_DIALOG_CLASS} {
    z-index: 3;

    position: fixed;

    width: 90%;
    max-width: 40em;

    top: auto;
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

:root[style] dialog#${exports.POPUP_DIALOG_CLASS}.${exports.POPUP_DIALOG_CLASS_COLLAPSE},
:root dialog#${exports.POPUP_DIALOG_CLASS}.${exports.POPUP_DIALOG_CLASS_COLLAPSE} {
    top: auto;
    height: 1px;
}

:root[style] div#${exports.POPOUTIMAGE_CONTAINER_ID},
:root div#${exports.POPOUTIMAGE_CONTAINER_ID},
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} div#${exports.POPOUTIMAGE_CONTAINER_ID},
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} div#${exports.POPOUTIMAGE_CONTAINER_ID} {
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 3;

    /*
    outline-color: magenta !important;
    outline-style: dotted !important;
    outline-width: 4px !important;
    outline-offset: -4px !important;
    */

    padding: 0;
    margin: 0;

    box-sizing: border-box;

    cursor: pointer;

    /* position: relative; */

    display: flex;
    /* no need for vertical / horizontal control, as we use margin:auto
    justify-content: center;
    align-items: center;
    */

    /* FXL, just in case the top-level transform scale isn't applied */
    overflow-y: auto;
    overflow-x: auto;
}

@keyframes readium2ElectronAnimation_IMG_OUTLINE {
    0% {
        outline-offset: -0.4em;
    }
    25% {
        outline-offset: 0em;
    }
    50% {
        outline-offset: 0.8em;
    }
    75% {
        outline-offset: 0em;
    }
    100% {
        outline-offset: -0.4em;
    }
}

:root[style] img[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root img[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} img[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} img[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root[style] image[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root image[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} image[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} image[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root[style] svg[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root svg[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} svg[data-${exports.POPOUTIMAGE_CONTAINER_ID}],
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} svg[data-${exports.POPOUTIMAGE_CONTAINER_ID}]
{
    outline-color: magenta !important;
    outline-style: solid !important;
    outline-width: 0.2em !important;
    /* outline-offset: 2px !important; */

    cursor: pointer !important;

    animation-name: readium2ElectronAnimation_IMG_OUTLINE;
    animation-iteration-count: infinite;
    animation-duration: 1s;
    animation-delay: 0s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
}

/*
:root[style*="readium-night-on"]
*/
:root[style] div#${exports.POPOUTIMAGE_CONTAINER_ID} #${exports.POPOUTIMAGE_CONTROLS_ID},
:root div#${exports.POPOUTIMAGE_CONTAINER_ID} #${exports.POPOUTIMAGE_CONTROLS_ID} {
    border: 1px solid black;
    background: white !important;
    color: black !important;
    padding: 0.2em;
    margin: 0;
    border-radius: 0.8em;
    position: absolute;
    top: 0.2em;
    left: 0.4em;
    width: auto;
    height: auto;
}
:root[style] div#${exports.POPOUTIMAGE_CONTAINER_ID} #${exports.POPOUTIMAGE_CLOSE_ID},
:root div#${exports.POPOUTIMAGE_CONTAINER_ID} #${exports.POPOUTIMAGE_CLOSE_ID} {
    position: absolute;
    top: 0.2em;
    right: 0.4em;
}
:root[style] div#${exports.POPOUTIMAGE_CONTAINER_ID} button,
:root div#${exports.POPOUTIMAGE_CONTAINER_ID} button {
    border: 2px solid black;
    background: white !important;
    color: black !important;
    font-family: Arial !important;
    font-size: 1.5em !important;
    font-weight: bold;
    user-select: none;
    padding: 0.2em;
    margin: 0;
    border-radius: 0.8em;
    width: 1.6em;
    display: inline-block;
    cursor: pointer !important;
}

:root[style] div#${exports.POPOUTIMAGE_CONTAINER_ID} > img,
:root div#${exports.POPOUTIMAGE_CONTAINER_ID} > img {

    /*
    outline-color: red !important;
    outline-style: dashed !important;
    outline-width: 2px !important;
    outline-offset: -2px !important;
    */

    transform-origin: 0px 0px;

    box-sizing: border-box;
    /* border: 2px solid #333333; */

    cursor: move !important;

    margin: 0 !important;
    object-fit: contain !important;
    position: relative !important;
    max-height: 100% !important;
    max-width: 100% !important;
    width: 100% !important;
    height: 100% !important;

    /*
    margin: auto !important;
    object-fit: cover !important;
    position: relative !important;
    max-height: 100% !important;
    max-width: 100% !important;
    width: auto !important;
    height: auto !important;
    */

    /* vertical centering breaks image height
    margin: auto !important;
    position: absolute !important;
    max-height: none !important;
    max-width: 100% !important;
    width: 100% !important;
    height: auto !important;

    top: 0 !important;
    bottom: 0 !important;
    */

    /* this works with position:relative in the parent (no need for flex)
    max-height: 100% !important;
    max-width: 100% !important;
    width: auto !important;
    height: auto !important;

    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    margin: auto !important;
    */
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

:root[style] .${exports.FOOTNOTES_CONTAINER_CLASS} > *,
:root .${exports.FOOTNOTES_CONTAINER_CLASS} > * {
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
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
exports.R2_MO_CLASS_ACTIVE = "r2-mo-active";
exports.R2_MO_CLASS_ACTIVE_PLAYBACK = "r2-mo-active-playback";
exports.mediaOverlaysCssStyles = `
:root[style] .${exports.R2_MO_CLASS_ACTIVE},
:root .${exports.R2_MO_CLASS_ACTIVE} {
    background-color: yellow !important;
    color: black !important;
}
:root[style*="readium-night-on"] .${exports.R2_MO_CLASS_ACTIVE} {
    background-color: #333333 !important;
    color: white !important;
}
:root[style*="readium-sepia-on"] .${exports.R2_MO_CLASS_ACTIVE} {
    background-color: silver !important;
    color: black !important;
}
`;
exports.TTS_CLASS_THEME1 = "r2-tts-theme1";
exports.TTS_CLASS_IS_ACTIVE = "r2-tts-isPlaying";
exports.TTS_ID_PREVIOUS = "r2-tts-previous";
exports.TTS_ID_NEXT = "r2-tts-next";
exports.TTS_ID_SLIDER = "r2-tts-slider";
exports.TTS_ID_ACTIVE_WORD = "r2-tts-active-word";
exports.TTS_ID_ACTIVE_UTTERANCE = "r2-tts-active-utterance";
exports.TTS_CLASS_UTTERANCE = "r2-tts-utterance";
exports.TTS_CLASS_UTTERANCE_HEADING1 = "r2-tts-utterance-h1";
exports.TTS_CLASS_UTTERANCE_HEADING2 = "r2-tts-utterance-h2";
exports.TTS_CLASS_UTTERANCE_HEADING3 = "r2-tts-utterance-h3";
exports.TTS_CLASS_UTTERANCE_HEADING4 = "r2-tts-utterance-h4";
exports.TTS_CLASS_UTTERANCE_HEADING5 = "r2-tts-utterance-h5";
exports.TTS_ID_CONTAINER = "r2-tts-txt";
exports.TTS_NAV_BUTTON_CLASS = "r2-tts-button";
exports.TTS_ID_SPEAKING_DOC_ELEMENT = "r2-tts-speaking-el";
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
    border-width: 1px;
    border-color: #777777 !important;
    border-left: 0;
    border-right: 0;
    border-top: 0;
}

:root[style] div#${exports.TTS_ID_CONTAINER},
:root div#${exports.TTS_ID_CONTAINER} {
    overflow: auto;
    overflow-x: hidden;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    padding: 0;
    margin: 0;

    max-width: 800px;
    margin-right: auto;
    margin-left: auto;

    hyphens: none !important;
    word-break: keep-all !important;
    word-wrap: break-word !important;

    line-height: initial !important;

    color: #444444 !important;

    border-radius: 0;
    border-style: solid;
    border-width: 1px;
    border-color: #777777 !important;
    border-left: 0;
    border-right: 0;
    border-top: 0;
}

:root[style] div#${exports.TTS_ID_CONTAINER} > div,
:root div#${exports.TTS_ID_CONTAINER} > div {
    font-size: 1.2rem !important;
}
:root[style] div#${exports.TTS_ID_CONTAINER} > img,
:root div#${exports.TTS_ID_CONTAINER} > img,
:root[style] div#${exports.TTS_ID_CONTAINER} > svg,
:root div#${exports.TTS_ID_CONTAINER} > svg {
    display: block;
    border: 3px solid transparent;
    max-width: 50%;
    margin-left: auto;
    margin-right: auto;
}
:root[style] div#${exports.TTS_ID_CONTAINER} > img + div,
:root div#${exports.TTS_ID_CONTAINER} > img + div,
:root[style] div#${exports.TTS_ID_CONTAINER} > svg + div,
:root div#${exports.TTS_ID_CONTAINER} > svg + div {
    text-align: center;
    text-decoration: underline;
}

:root[style*="--USER__lineHeight"] div#${exports.TTS_ID_CONTAINER} {
    line-height: calc(var(--USER__lineHeight) * 1) !important;
}
:root[style*="readium-night-on"] div#${exports.TTS_ID_CONTAINER} {
    color: #bbbbbb !important;
}
:root[style*="readium-sepia-on"] div#${exports.TTS_ID_CONTAINER} {
    background: var(--RS__backgroundColor) !important;
    color: var(--RS__textColor) !important;
}
:root[style*="--USER__backgroundColor"] div#${exports.TTS_ID_CONTAINER} {
    background: var(--USER__backgroundColor) !important;
}
:root[style*="--USER__textColor"] div#${exports.TTS_ID_CONTAINER} {
    color: var(--USER__textColor) !important;
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
    outline-color: magenta;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 1px;
}

:root[style] .${exports.TTS_CLASS_UTTERANCE},
:root .${exports.TTS_CLASS_UTTERANCE} {
    margin-bottom: 0.1em;
    padding-top: 0.3em;
    padding-bottom: 0.3em;
    padding-left: 1em;
    padding-right: 1em;
    display: block;

    box-sizing: border-box;
    border: 1px solid transparent !important;

    line-height: 1.5 !important;
}

:root[style] div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING1},
:root div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING1} {
    font-weight: bolder !important;
    font-size: 1.5rem !important;
}
:root[style] div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING2},
:root div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING2} {
    font-weight: bolder !important;
    font-size: 1.4rem !important;
}
:root[style] div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING3},
:root div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING3} {
    font-weight: bold !important;
    font-size: 1.3rem !important;
}
:root[style] div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING4},
:root div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING4} {
    font-weight: bold !important;
    font-size: 1.2rem !important;
}
:root[style] div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING5},
:root div#${exports.TTS_ID_CONTAINER} .${exports.TTS_CLASS_UTTERANCE_HEADING5} {
    font-weight: bold !important;
    font-size: 1.1rem !important;
}

:root[style] div#${exports.TTS_ID_ACTIVE_UTTERANCE},
:root div#${exports.TTS_ID_ACTIVE_UTTERANCE} {
    /* background-color: yellow !important; */

    border: 1px solid #777777 !important;
    border-radius: 0.4em !important;

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

    text-decoration: underline;
    text-decoration-color: #777777 !important;
    text-underline-position: under;
    /*
    outline-color: #777777;
    outline-offset: 2px;
    outline-style: solid;
    outline-width: 1px;
    */

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

:root div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1},
:root[style] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} {

    background-color: #f7f9f9 !important;
    color: #333333 !important;
}
:root[style*="readium-night-on"] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} {
    background: #111111 !important;
    color: #888888 !important;
}
:root[style*="readium-sepia-on"] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} {
    background: #fdf2e9 !important;
    color: #333333 !important;
}

:root[style] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} .${exports.TTS_CLASS_UTTERANCE},
:root div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} .${exports.TTS_CLASS_UTTERANCE} {
    background-color: transparent !important;
}

:root[style] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE},
:root div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE} {

    border: 0 !important;
    border-radius: 0px !important;

    background-color: #ecf0f1 !important;
    color: black !important;

    /* box-shadow: 0px 0px 10px 0px #f2f3f4; */
}
:root[style*="readium-night-on"] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE} {
    background-color: #222222 !important;
    color: white !important;
    /* box-shadow: 0px 0px 10px 0px #111100; */
}
:root[style*="readium-sepia-on"] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE} {
    background-color: #fef9e7 !important;
    color: black !important;
    /* box-shadow: 0px 0px 10px 0px #fdebd0; */
}

:root[style] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE} span#${exports.TTS_ID_ACTIVE_WORD},
:root div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE} span#${exports.TTS_ID_ACTIVE_WORD} {
    background-color: #f7dc6f !important;
    color: black !important;

    outline-color: #f7dc6f;
    outline-style: solid;
    outline-offset: unset;
    outline-width: 4px;

    text-decoration: none;
}
:root[style*="readium-night-on"] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE} span#${exports.TTS_ID_ACTIVE_WORD} {
    background-color: #d4ac0d !important;
    color: black !important;

    outline-color: #d4ac0d;
}
:root[style*="readium-sepia-on"] div#${exports.TTS_ID_CONTAINER}.${exports.TTS_CLASS_THEME1} div#${exports.TTS_ID_ACTIVE_UTTERANCE} span#${exports.TTS_ID_ACTIVE_WORD} {
    background-color: #f9e79f !important;
    color: black !important;

    outline-color: #f9e79f;
}
`;
exports.ROOT_CLASS_INVISIBLE_MASK = "r2-visibility-mask-class";
exports.ROOT_CLASS_INVISIBLE_MASK_REMOVED = "r2-visibility-mask-removed-class";
exports.visibilityMaskCssStyles = `

/*
bugfix: for some reason, "inherit" does not work in Chromium, so we patch ReadiumCSS here :(
(was "text-align: var(--USER__textAlign);" on HTML root and "text-align: inherit !important;" on body etc.)
*/
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] {
text-align: var(--USER__textAlign) !important;
}
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] body,
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] *:not(blockquote):not(figcaption) p,
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] li {
text-align: var(--USER__textAlign) !important;
}

/*
https://github.com/readium/readium-css/issues/117
no new stacking context, otherwise massive performance degradation with CSS Columns in large HTML documents
(web inspector profiler shows long paint times, some layout recalc triggers too)
*/
:root {
    -webkit-perspective: none !important;
    perspective: none !important;
}

:root[style].${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}),
:root.${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) {
    overflow: visible !important;
}
:root[style].${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body,
:root.${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body {
    /*
    Electron v19 --> v21 breaking change :(
    ("hidden" is now "clip")
    overflow-x: hidden !important;
    overflow-y: visible !important;
    */
    overflow-x: clip !important;
    overflow-y: visible !important;
}

/*
This only visually hides the scrollbars,
this does not prevent user-scrolling with keyboard arrows, space, drag on character selection, mouse wheel, etc.
We cannot completely disable "scroll" event (prevent default) because we need to detect when user keyboard-tabs through hyperlinks, in order to reset the correct scroll offset programmatically (page alignment on CSS column boundaries).
...so we continue to use "clip" for "overflow-x" (see above)

:root[style].${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body::-webkit-scrollbar,
:root.${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body::-webkit-scrollbar {
    display: none;
}
*/

:root[style].${exports.ROOT_CLASS_FIXED_LAYOUT},
:root.${exports.ROOT_CLASS_FIXED_LAYOUT} {
    overflow: hidden !important;
}
:root[style].${exports.ROOT_CLASS_FIXED_LAYOUT} > body,
:root.${exports.ROOT_CLASS_FIXED_LAYOUT} > body {
    overflow: hidden !important;
    margin: 0 !important;
}

:root.${exports.CLASS_PAGINATED} > body,
:root:not(.${exports.CLASS_PAGINATED}) > body,
:root.${exports.ROOT_CLASS_FIXED_LAYOUT} > body,
:root:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body,
:root[style].${exports.CLASS_PAGINATED} > body,
:root[style]:not(.${exports.CLASS_PAGINATED}) > body,
:root[style].${exports.ROOT_CLASS_FIXED_LAYOUT} > body,
:root[style]:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body {
    /* see ensureHighlightsContainer() */
    position: relative !important;
    /* display: block; */
}

:root[style]:not(.${exports.CLASS_PAGINATED}):not(.${exports.ROOT_CLASS_FIXED_LAYOUT}),
:root:not(.${exports.CLASS_PAGINATED}):not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) {
    height: 100vh !important;
}

:root[style].${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}),
:root.${exports.CLASS_PAGINATED}:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) {
    /* display: block; */
    /*
    Chrome Electron 19 - Chrome v102 CSS regression bug!
    display: flex; ... then transition to block or flow-root
    See SKIP_LINK_ID rules below :(
    (hacky, but works without regressions or layout shift)
    */
}
:root[style]:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body,
:root:not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body {
    min-height: inherit;
}
:root[style]:not(.${exports.CLASS_PAGINATED}):not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body,
:root:not(.${exports.CLASS_PAGINATED}):not(.${exports.ROOT_CLASS_FIXED_LAYOUT}) > body {
    height: inherit;
}

/*
// This workaround fixes the issue of "bleeding" body background color due to scale+translate CSS 2D transform
// https://github.com/edrlab/thorium-reader/issues/1529#issuecomment-900166745
background: unset !important;
background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=) !important;
*/

:root.${exports.ROOT_CLASS_INVISIBLE_MASK}[style] > body,
:root.${exports.ROOT_CLASS_INVISIBLE_MASK} > body {
    /* visibility: hidden !important; */
    opacity: 0;
}
:root.${exports.ROOT_CLASS_INVISIBLE_MASK_REMOVED}[style] > body,
:root.${exports.ROOT_CLASS_INVISIBLE_MASK_REMOVED} > body {
    opacity: 1;
    /*
    animation-name: readium2ElectronAnimation_INVISIBLE_MASK;
    animation-duration: 0.5s;
    animation-delay: 0s;
    animation-timing-function: linear;
    */
    /* animation-fill-mode: forwards; */
}
@keyframes readium2ElectronAnimation_INVISIBLE_MASK {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
`;
exports.focusCssStyles = `

#${exports.SKIP_LINK_ID} {
    display: flex !important;
    overflow: hidden !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: absolute !important;
    left: 0px !important;
    top: 0px !important;
    width: 1px !important;
    height: 1px !important;
    background-color: transparent !important;
    color: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    border: 0 !important;
    outline: 0 !important;
}
/*
#${exports.SKIP_LINK_ID}:focus {
    width: auto;
    height: auto;
}
*/
:root[style] *:focus,
:root *:focus {
    outline: none;
}
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} *.${exports.CSS_CLASS_NO_FOCUS_OUTLINE}:focus:not(:target):not(.${exports.LINK_TARGET_CLASS}),
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} *.${exports.CSS_CLASS_NO_FOCUS_OUTLINE}:focus:not(:target):not(.${exports.LINK_TARGET_CLASS}) {
    outline: none !important;
}
:root[style].${exports.ROOT_CLASS_KEYBOARD_INTERACT} *:focus:not(:target):not(.${exports.LINK_TARGET_CLASS}),
:root.${exports.ROOT_CLASS_KEYBOARD_INTERACT} *:focus:not(:target):not(.${exports.LINK_TARGET_CLASS}) {
    outline-color: blue !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;
}
/*
@keyframes readium2ElectronAnimation_FOCUS {
    0% {
    }
    100% {
        outline: inherit !important;
    }
}
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
/*
@keyframes readium2ElectronAnimation_TARGET {
    0% {
    }
    100% {
        outline: inherit !important;
    }
}
:root[style] *:target,
:root *:target,
*/
:root[style] *.${exports.LINK_TARGET_CLASS},
:root *.${exports.LINK_TARGET_CLASS}
{
    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;

    /*
    animation-name: readium2ElectronAnimation_TARGET;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    */
}
/*
:root[style] *.r2-no-target-outline:target,
:root *.r2-no-target-outline:target,
*/
:root[style] *.r2-no-target-outline.${exports.LINK_TARGET_CLASS},
:root *.r2-no-target-outline.${exports.LINK_TARGET_CLASS} {
    outline: inherit !important;
}
`;
exports.selectionCssStyles = `

:root[style].${exports.HIDE_CURSOR_CLASS},
:root.${exports.HIDE_CURSOR_CLASS},
:root[style].${exports.HIDE_CURSOR_CLASS} *,
:root.${exports.HIDE_CURSOR_CLASS} * {
    cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=), none !important;
}

.${exports.ZERO_TRANSFORM_CLASS} {
    will-change: scroll-position;
    transform: translateX(0px);
}

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

html.${exports.POPUP_DIALOG_CLASS}.${exports.TTS_CLASS_IS_ACTIVE} ::-webkit-scrollbar {
    display: none;
    /* visibility: hidden; */
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
exports.AUDIO_BUFFER_CANVAS_ID = "r2-audio-buffer-canvas";
exports.AUDIO_PROGRESS_CLASS = "r2-audio-progress";
exports.AUDIO_ID = "r2-audio";
exports.AUDIO_BODY_ID = "r2-audio-body";
exports.AUDIO_SECTION_ID = "r2-audio-section";
exports.AUDIO_CONTROLS_ID = "r2-audio-controls";
exports.AUDIO_COVER_ID = "r2-audio-cover";
exports.AUDIO_TITLE_ID = "r2-audio-title";
exports.AUDIO_SLIDER_ID = "r2-audio-slider";
exports.AUDIO_TIME_ID = "r2-audio-time";
exports.AUDIO_PERCENT_ID = "r2-audio-percent";
exports.AUDIO_RATE_ID = "r2-audio-rate";
exports.AUDIO_PLAYPAUSE_ID = "r2-audio-playPause";
exports.AUDIO_PREVIOUS_ID = "r2-audio-previous";
exports.AUDIO_NEXT_ID = "r2-audio-next";
exports.AUDIO_REWIND_ID = "r2-audio-rewind";
exports.AUDIO_FORWARD_ID = "r2-audio-forward";
exports.audioCssStyles = `

#${exports.AUDIO_CONTROLS_ID} select#${exports.AUDIO_RATE_ID} option {
    color: var(--RS__textColor) !important;
    background: var(--RS__backgroundColor) !important;
}

#${exports.AUDIO_BODY_ID} {
    padding: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    height: 100vh !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    user-select: none;
}

#${exports.AUDIO_SECTION_ID} {
    margin: 0;
    padding: 0;
    min-width: 500px;
}

#${exports.AUDIO_TITLE_ID} {
    margin-top: 1em;
    margin-bottom: 0;
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 800px;
    width: 80%;
    text-align: center;
}

#${exports.AUDIO_COVER_ID} {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 500px !important;
    max-height: 250px !important;
    margin-top: 0.4em;
    margin-bottom: 0.6em;
    cursor: pointer;
}

:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_COVER_ID} {
    cursor: wait;
}

#${exports.AUDIO_BUFFER_CANVAS_ID} {
    width: 500px;
    height: 20px;

    margin-left: auto;
    margin-right: auto;

    margin-bottom: 1em;

    display: block;
}

#${exports.AUDIO_ID} {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 800px;
    height: 2.5em;
    width: 80%;
}

#${exports.AUDIO_CONTROLS_ID} {
    display: block;
    padding: 0;
    margin: 0;
    margin-left: auto;
    margin-right: auto;

    max-width: 500px;
    min-width: 500px;
    width: 500px;
    height: auto;

    display: grid;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-columns: auto 3em 7em 3em auto;
    grid-template-rows: auto 1.5em auto;
}

#${exports.AUDIO_CONTROLS_ID} button {
    border: 0 !important;
    background-color: transparent !important;
    background: transparent !important;
    text-align: center;
    padding: 0;
    margin: 0;
    display: block;
    cursor: pointer;
    position: relative;
}

#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID} {
    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    box-sizing: border-box;

    justify-self: center;

    width: 60px;
    height: 60px;
}

:root #${exports.AUDIO_CONTROLS_ID} svg,
:root[style] #${exports.AUDIO_CONTROLS_ID} svg {
    fill: #202020;
}
:root[style*="readium-night-on"] #${exports.AUDIO_CONTROLS_ID} svg {
    fill: #999999;
}

:root:not(.${exports.AUDIO_PROGRESS_CLASS}) #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID} #${exports.AUDIO_PLAYPAUSE_ID}_0,
:root[style]:not(.${exports.AUDIO_PROGRESS_CLASS}) #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID} #${exports.AUDIO_PLAYPAUSE_ID}_0 {

    display: none;
}

:root:not(.${exports.AUDIO_PROGRESS_CLASS}) #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID}.pause #${exports.AUDIO_PLAYPAUSE_ID}_1 {
    display: none;
}

:root:not(.${exports.AUDIO_PROGRESS_CLASS}) #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID}.pause #${exports.AUDIO_PLAYPAUSE_ID}_0 {
    display: block;
}

:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID} svg {
    display: none;
}
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID} {
    cursor: wait;
}
:root[style].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID}:after {
    content: "";
    border-radius: 50%;

    position: absolute;
    width: 60px;
    height: 60px;
    left: 0px;
    top: 0px;

    transform: translateZ(0);
    animation: readium2ElectronAnimation_audioLoad-spin 1.1s infinite linear;

    border-top: 3px solid #999999;
    border-right: 3px solid #999999;
    border-bottom: 3px solid #999999;
    border-left: 3px solid #333333;
}
:root[style*="readium-night-on"].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PLAYPAUSE_ID}:after {

    border-top: 3px solid #202020;
    border-right: 3px solid #202020;
    border-bottom: 3px solid #202020;
    border-left: 3px solid white;
}
@keyframes readium2ElectronAnimation_audioLoad-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_NEXT_ID},
#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PREVIOUS_ID},
#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_REWIND_ID},
#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_FORWARD_ID} {
    width: 48px;
    height: 48px;
    position: relative;
    align-self: center;
}

#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_PREVIOUS_ID} {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: left;
}

#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_NEXT_ID} {
    grid-column-start: 5;
    grid-column-end: 6;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: right;
}
#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_REWIND_ID} {
    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: right;
}
#${exports.AUDIO_CONTROLS_ID} #${exports.AUDIO_FORWARD_ID} {
    grid-column-start: 4;
    grid-column-end: 5;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: left;
}
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_FORWARD_ID},
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_REWIND_ID} {
    display: none;
}

#${exports.AUDIO_PERCENT_ID}, #${exports.AUDIO_TIME_ID}, #${exports.AUDIO_RATE_ID} {
    font-size: 0.9em !important;
    font-family: sans-serif !important;
}
#${exports.AUDIO_PERCENT_ID}, #${exports.AUDIO_TIME_ID} {
    margin-top: -0.5em;
}
#${exports.AUDIO_RATE_ID} {
    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 3;
    grid-row-end: 4;

    font-size: 0.8em !important;
    width: 4em;

    justify-self: center;

    text-align: center !important;

    margin-top: -0.2em;

    -webkit-appearance: none;
    border: 1px solid #aaa;
    border-radius: .4em;
    box-sizing: border-box;
    padding: .15em .15em .15em .3em;
    background-color: transparent;

    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23aaa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat, repeat;
    background-position: right .3em top 50%, 0 0;
    background-size: .7em auto, 100%;
}
#${exports.AUDIO_TIME_ID} {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 3;
    grid-row-end: 4;

    text-align: left !important;
}
#${exports.AUDIO_PERCENT_ID} {
    grid-column-start: 5;
    grid-column-end: 6;
    grid-row-start: 3;
    grid-row-end: 4;

    text-align: right !important;
}

:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_RATE_ID},
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_PERCENT_ID},
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_TIME_ID} {
    visibility: hidden;
}

:root[style] #${exports.AUDIO_SLIDER_ID},
:root #${exports.AUDIO_SLIDER_ID} {
padding: 0;
margin: 0;

display: block;

grid-column-start: 1;
grid-column-end: 6;
grid-row-start: 2;
grid-row-end: 3;

cursor: pointer;

background: transparent !important;

background-clip: padding-box;
border-radius: 2px;
overflow: hidden;

position: relative;

-webkit-appearance: none;

--audiopercent: 50%;
--range-color-left: #545454;
--range-color-right: #999999;
--track-background: linear-gradient(to right, var(--range-color-left) var(--audiopercent), var(--range-color-right) 0) no-repeat 0 100% / 100% 100%;
}
:root[style*="readium-night-on"] #${exports.AUDIO_SLIDER_ID} {
    --range-color-right: #545454;
    --range-color-left: #999999;
}

:root[style].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID},
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID} {

cursor: wait;
}

:root[style].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}:before,
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}:before {
    content: '';
    position: absolute;
    background-color: #999999;
    left: 0;
    top: 1em;
    height: 0.4em;
    transform: translateZ(0);
    will-change: left, right;
    animation: readium2ElectronAnimation_audioLoad 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
}

:root[style].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}:after,
:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}:after {
    content: '';
    position: absolute;
    background-color: #999999;
    left: 0;
    top: 1em;
    height: 0.4em;
    transform: translateZ(0);
    will-change: left, right;
    animation: readium2ElectronAnimation_audioLoad-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
    animation-delay: 1.15s;
}

:root[style*="readium-night-on"].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}:after {
    background: #545454;
}

@keyframes readium2ElectronAnimation_audioLoad {
0% {
left: -35%;
right: 100%; }
60% {
left: 100%;
right: -90%; }
100% {
left: 100%;
right: -90%; } }

@keyframes readium2ElectronAnimation_audioLoad-short {
0% {
left: -200%;
right: 100%; }
60% {
left: 107%;
right: -8%; }
100% {
left: 107%;
right: -8%; } }

:root #${exports.AUDIO_SLIDER_ID}::-webkit-slider-runnable-track,
:root[style] #${exports.AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    cursor: pointer;

    width: 100%;
    height: 0.5em;

    background: #999999;
    background: var(--track-background);

    padding: 0;
    margin: 0;

    border: none;
    border-radius: 0.2em;
}
:root[style*="readium-night-on"] #${exports.AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {

    background: #545454;
    background: var(--track-background);
}

:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}::-webkit-slider-runnable-track,
:root[style].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    background: transparent !important;
    cursor: wait;
}
:root[style*="readium-night-on"].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    background: transparent !important;
}

:root #${exports.AUDIO_SLIDER_ID}::-webkit-slider-thumb,
:root[style] #${exports.AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    -webkit-appearance: none;

    cursor: pointer;

    width: 0.5em;
    height: 0.7em;

    padding: 0;
    margin: 0;
    margin-top: -0.1em;

    border: none;
    border-radius: 0.2em;

    background: #333333;
}
:root[style*="readium-night-on"] #${exports.AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: white;
}

:root.${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}::-webkit-slider-thumb,
:root[style].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: transparent !important;
    cursor: wait;
}
:root[style*="readium-night-on"].${exports.AUDIO_PROGRESS_CLASS} #${exports.AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: transparent !important;
}
`;
//# sourceMappingURL=styles.js.map