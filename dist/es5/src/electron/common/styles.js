"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZERO_TRANSFORM_CLASS = "r2-zeroTransform";
exports.SKIP_LINK_ID = "r2-skip-link";
exports.LINK_TARGET_CLASS = "r2-link-target";
exports.ROOT_CLASS_REDUCE_MOTION = "r2-reduce-motion";
exports.ROOT_CLASS_NO_FOOTNOTES = "r2-no-popup-foonotes";
exports.ROOT_CLASS_MATHJAX = "r2-mathjax";
exports.POPUP_DIALOG_CLASS = "r2-popup-dialog";
exports.FOOTNOTES_CONTAINER_CLASS = "r2-footnote-container";
exports.FOOTNOTES_CLOSE_BUTTON_CLASS = "r2-footnote-close";
exports.FOOTNOTE_FORCE_SHOW = "r2-footnote-force-show";
exports.footnotesCssStyles = "\n@namespace epub \"http://www.idpf.org/2007/ops\";\n\n:root:not(." + exports.ROOT_CLASS_NO_FOOTNOTES + ") aside[epub|type~=\"footnote\"]:not(." + exports.FOOTNOTE_FORCE_SHOW + "),\n:root:not(." + exports.ROOT_CLASS_NO_FOOTNOTES + ") aside[epub|type~=\"note\"]:not(." + exports.FOOTNOTE_FORCE_SHOW + "),\n:root:not(." + exports.ROOT_CLASS_NO_FOOTNOTES + ") aside[epub|type~=\"endnote\"]:not(." + exports.FOOTNOTE_FORCE_SHOW + "),\n:root:not(." + exports.ROOT_CLASS_NO_FOOTNOTES + ") aside[epub|type~=\"rearnote\"]:not(." + exports.FOOTNOTE_FORCE_SHOW + ") {\n    display: none;\n}\n\n/*\n:root." + exports.POPUP_DIALOG_CLASS + " {\n    overflow: hidden !important;\n}\n*/\n\n:root[style] dialog#" + exports.POPUP_DIALOG_CLASS + "::backdrop,\n:root dialog#" + exports.POPUP_DIALOG_CLASS + "::backdrop {\n    background: rgba(0, 0, 0, 0.3) !important;\n}\n:root[style*=\"readium-night-on\"] dialog#" + exports.POPUP_DIALOG_CLASS + "::backdrop {\n    background: rgba(0, 0, 0, 0.65) !important;\n}\n\n:root[style] dialog#" + exports.POPUP_DIALOG_CLASS + ",\n:root dialog#" + exports.POPUP_DIALOG_CLASS + " {\n    z-index: 3;\n\n    position: fixed;\n\n    width: 90%;\n    max-width: 40em;\n\n    bottom: 1em;\n    height: 7em;\n\n    margin: 0 auto;\n    padding: 0;\n\n    border-radius: 0.3em;\n    border-width: 1px;\n\n    background: white !important;\n    border-color: black !important;\n\n    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);\n\n    display: grid;\n    grid-column-gap: 0px;\n    grid-row-gap: 0px;\n\n    grid-template-columns: 1.5em auto 1.5em;\n    grid-template-rows: auto 1.5em;\n}\n:root[style*=\"readium-night-on\"] dialog#" + exports.POPUP_DIALOG_CLASS + " {\n    background: #333333 !important;\n    border-color: white !important;\n}\n:root[style*=\"readium-sepia-on\"] dialog#" + exports.POPUP_DIALOG_CLASS + " {\n    background: var(--RS__backgroundColor) !important;\n}\n:root[style*=\"--USER__backgroundColor\"] dialog#" + exports.POPUP_DIALOG_CLASS + " {\n    background: var(--USER__backgroundColor) !important;\n}\n:root[style] ." + exports.FOOTNOTES_CONTAINER_CLASS + ",\n:root ." + exports.FOOTNOTES_CONTAINER_CLASS + " {\n    overflow: auto;\n\n    grid-column-start: 1;\n    grid-column-end: 4;\n    grid-row-start: 1;\n    grid-row-end: 3;\n\n    padding: 0.3em;\n    margin: 0.2em;\n}\n\n:root[style] ." + exports.FOOTNOTES_CONTAINER_CLASS + " > div > *,\n:root ." + exports.FOOTNOTES_CONTAINER_CLASS + " > div > * {\n    margin: 0 !important;\n    padding: 0 !important;\n}\n\n/*\n:root[style] ." + exports.FOOTNOTES_CLOSE_BUTTON_CLASS + ",\n:root ." + exports.FOOTNOTES_CLOSE_BUTTON_CLASS + " {\n    border: 1px solid black;\n    background: white !important;\n    color: black !important;\n\n    border-radius: 0.8em;\n    position: absolute;\n    top: -0.9em;\n    left: -0.9em;\n    width: 1.8em;\n    height: 1.8em;\n    font-size: 1em !important;\n    font-family: Arial !important;\n    cursor: pointer;\n}\n:root[style*=\"readium-night-on\"] ." + exports.FOOTNOTES_CLOSE_BUTTON_CLASS + " {\n    border: 1px solid white !important;\n    background: black !important;\n    color: white !important;\n}\n*/\n";
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
exports.ttsCssStyles = "\n\n:root[style] dialog#" + exports.POPUP_DIALOG_CLASS + "." + exports.TTS_POPUP_DIALOG_CLASS + ",\n:root dialog#" + exports.POPUP_DIALOG_CLASS + "." + exports.TTS_POPUP_DIALOG_CLASS + " {\n    width: auto;\n    max-width: 100%;\n\n    height: auto;\n    max-height: 100%;\n\n    top: 0px;\n    bottom: 0px;\n    left: 0px;\n    right: 0px;\n\n    margin: 0;\n    padding: 0;\n\n    box-shadow: none;\n\n    border-radius: 0;\n    border-style: solid;\n    border-width: 2px;\n    border-color: black !important;\n}\n\n:root[style] div#" + exports.TTS_ID_CONTAINER + ",\n:root div#" + exports.TTS_ID_CONTAINER + " {\n    overflow: auto;\n    overflow-x: hidden;\n\n    grid-column-start: 1;\n    grid-column-end: 4;\n    grid-row-start: 1;\n    grid-row-end: 2;\n\n    padding: 1em;\n    margin: 0;\n    margin-left: 0.2em;\n    margin-top: 0.2em;\n    margin-right: 0.2em;\n\n    hyphens: none !important;\n    word-break: keep-all !important;\n    word-wrap: break-word !important;\n\n    font-size: 120% !important;\n\n    line-height: initial !important;\n\n    color: #999999 !important;\n}\n:root[style*=\"--USER__lineHeight\"] div#" + exports.TTS_ID_CONTAINER + " {\n    line-height: calc(var(--USER__lineHeight) * 1.2) !important;\n}\n:root[style*=\"readium-night-on\"] div#" + exports.TTS_ID_CONTAINER + " {\n    color: #bbbbbb !important;\n}\n:root[style*=\"readium-sepia-on\"] div#" + exports.TTS_ID_CONTAINER + "{\n    background: var(--RS__backgroundColor) !important;\n    color: var(--RS__textColor) !important;\n}\n:root[style*=\"--USER__backgroundColor\"] div#" + exports.TTS_ID_CONTAINER + " {\n    background: var(--USER__backgroundColor) !important;\n}\n:root[style*=\"--USER__textColor\"] div#" + exports.TTS_ID_CONTAINER + " {\n    color: var(--USER__textColor) !important;\n}\n:root[style] #" + exports.TTS_ID_INFO + ",\n:root #" + exports.TTS_ID_INFO + " {\n    display: none;\n\n    padding: 0;\n    margin: 0;\n\n    grid-column-start: 2;\n    grid-column-end: 3;\n    grid-row-start: 2;\n    grid-row-end: 3;\n\n    font-family: Arial !important;\n    font-size: 90% !important;\n}\n\n:root[style] #" + exports.TTS_ID_SLIDER + ",\n:root #" + exports.TTS_ID_SLIDER + " {\n    padding: 0;\n    margin: 0;\n    margin-left: 6px;\n    margin-right: 6px;\n    margin-top: 6px;\n    margin-bottom: 6px;\n\n    grid-column-start: 2;\n    grid-column-end: 3;\n    grid-row-start: 2;\n    grid-row-end: 3;\n\n    cursor: pointer;\n    -webkit-appearance: none;\n\n    background: transparent !important;\n}\n:root #" + exports.TTS_ID_SLIDER + "::-webkit-slider-runnable-track {\n    cursor: pointer;\n\n    width: 100%;\n    height: 0.5em;\n\n    background: #999999;\n\n    padding: 0;\n    margin: 0;\n}\n:root[style*=\"readium-night-on\"] #" + exports.TTS_ID_SLIDER + "::-webkit-slider-runnable-track {\n    background: #545454;\n}\n:root #" + exports.TTS_ID_SLIDER + "::-webkit-slider-thumb {\n    -webkit-appearance: none;\n\n    cursor: pointer;\n\n    width: 0.8em;\n    height: 1.5em;\n\n    padding: 0;\n    margin: 0;\n    margin-top: -0.5em;\n\n    border: none;\n    border-radius: 0.2em;\n\n    background: #333333;\n}\n:root[style*=\"readium-night-on\"] #" + exports.TTS_ID_SLIDER + "::-webkit-slider-thumb {\n    background: white;\n}\n:root[style] button." + exports.TTS_NAV_BUTTON_CLASS + " > span,\n:root button." + exports.TTS_NAV_BUTTON_CLASS + " > span {\n    vertical-align: baseline;\n}\n:root[style] button." + exports.TTS_NAV_BUTTON_CLASS + ",\n:root button." + exports.TTS_NAV_BUTTON_CLASS + " {\n    border: none;\n\n    font-size: 100% !important;\n    font-family: Arial !important;\n    cursor: pointer;\n\n    padding: 0;\n    margin-top: 0.2em;\n    margin-bottom: 0.2em;\n\n    background: transparent !important;\n    color: black !important;\n}\n:root[style*=\"readium-night-on\"] button." + exports.TTS_NAV_BUTTON_CLASS + " {\n    color: white !important;\n}\n/*\n:root[style*=\"readium-sepia-on\"] button." + exports.TTS_NAV_BUTTON_CLASS + " {\n    background: var(--RS__backgroundColor) !important;\n}\n:root[style*=\"--USER__backgroundColor\"] button." + exports.TTS_NAV_BUTTON_CLASS + " {\n    background: var(--USER__backgroundColor) !important;\n}\n*/\n:root[style] #" + exports.TTS_ID_PREVIOUS + ",\n:root #" + exports.TTS_ID_PREVIOUS + " {\n    margin-left: 0.2em;\n\n    grid-column-start: 1;\n    grid-column-end: 2;\n    grid-row-start: 2;\n    grid-row-end: 3;\n}\n:root[style] #" + exports.TTS_ID_NEXT + ",\n:root #" + exports.TTS_ID_NEXT + " {\n    margin-right: 0.2em;\n\n    grid-column-start: 3;\n    grid-column-end: 4;\n    grid-row-start: 2;\n    grid-row-end: 3;\n}\n\n:root[style] ." + exports.TTS_ID_SPEAKING_DOC_ELEMENT + ",\n:root ." + exports.TTS_ID_SPEAKING_DOC_ELEMENT + " {\n    /*\n    outline-color: silver;\n    outline-style: solid;\n    outline-width: 2px;\n    outline-offset: 1px;\n    */\n}\n:root[style] ." + exports.TTS_CLASS_INJECTED_SPAN + ",\n:root ." + exports.TTS_CLASS_INJECTED_SPAN + " {\n    color: black !important;\n    background: #FFFFCC !important;\n\n    /* text-decoration: underline; */\n\n    padding: 0;\n    margin: 0;\n}\n/*\n:root[style*=\"readium-night-on\"] ." + exports.TTS_CLASS_INJECTED_SPAN + " {\n    color: white !important;\n    background: #333300 !important;\n}\n:root[style] ." + exports.TTS_CLASS_INJECTED_SUBSPAN + ",\n:root ." + exports.TTS_CLASS_INJECTED_SUBSPAN + " {\n    text-decoration: underline;\n    padding: 0;\n    margin: 0;\n}\n*/\n:root[style] ." + exports.TTS_ID_INJECTED_PARENT + ",\n:root ." + exports.TTS_ID_INJECTED_PARENT + " {\n    /*\n    outline-color: black;\n    outline-style: solid;\n    outline-width: 2px;\n    outline-offset: 1px;\n    */\n}\n:root[style*=\"readium-night-on\"] ." + exports.TTS_ID_INJECTED_PARENT + " {\n    /*\n    outline-color: white !important;\n    */\n}\n\n." + exports.TTS_CLASS_UTTERANCE + " {\n    margin-bottom: 1em;\n    padding: 0;\n    display: block;\n}\n\n:root[style] div#" + exports.TTS_ID_ACTIVE_UTTERANCE + ",\n:root div#" + exports.TTS_ID_ACTIVE_UTTERANCE + " {\n    /* background-color: yellow !important; */\n\n    color: black !important;\n}\n:root[style*=\"readium-night-on\"] div#" + exports.TTS_ID_ACTIVE_UTTERANCE + " {\n    color: white !important;\n}\n:root[style*=\"readium-sepia-on\"] div#" + exports.TTS_ID_ACTIVE_UTTERANCE + " {\n    color: black !important;\n}\n:root[style*=\"--USER__textColor\"] div#" + exports.TTS_ID_ACTIVE_UTTERANCE + " {\n    color: var(--USER__textColor) !important;\n}\n\n:root[style] span#" + exports.TTS_ID_ACTIVE_WORD + ",\n:root span#" + exports.TTS_ID_ACTIVE_WORD + " {\n    color: black !important;\n\n    /*\n    text-decoration: underline;\n    text-underline-position: under;\n    */\n    outline-color: black;\n    outline-offset: 2px;\n    outline-style: solid;\n    outline-width: 1px;\n\n    padding: 0;\n    margin: 0;\n}\n:root[style*=\"readium-night-on\"] span#" + exports.TTS_ID_ACTIVE_WORD + " {\n    color: white !important;\n    outline-color: white;\n}\n:root[style*=\"readium-sepia-on\"] span#" + exports.TTS_ID_ACTIVE_WORD + " {\n    color: black !important;\n    outline-color: black;\n}\n:root[style*=\"--USER__textColor\"] span#" + exports.TTS_ID_ACTIVE_WORD + " {\n    color: var(--USER__textColor) !important;\n    outline-color: var(--USER__textColor);\n}\n";
exports.ROOT_CLASS_INVISIBLE_MASK = "r2-visibility-mask";
exports.visibilityMaskCssStyles = "\n:root[style] *." + exports.ROOT_CLASS_INVISIBLE_MASK + ",\n:root *." + exports.ROOT_CLASS_INVISIBLE_MASK + " {\n    visibility: hidden !important;\n}\n";
exports.ROOT_CLASS_KEYBOARD_INTERACT = "r2-keyboard-interact";
exports.CSS_CLASS_NO_FOCUS_OUTLINE = "r2-no-focus-outline";
exports.focusCssStyles = "\n\n#" + exports.SKIP_LINK_ID + " {\n    display: block;\n    overflow: hidden;\n    visibility: visible;\n    opacity: 1;\n    position: absolute;\n    left: 10px;\n    top: 10px;\n    width: 1px;\n    height: 1px;\n    background-color: transparent;\n    color: transparent;\n    padding: 0;\n    margin: 0;\n    border: 0;\n    outline: 0;\n}\n/*\n#" + exports.SKIP_LINK_ID + ":focus {\n    width: auto;\n    height: auto;\n}\n*/\n\n@keyframes readium2ElectronAnimation_FOCUS {\n    0% {\n    }\n    100% {\n        outline: inherit;\n    }\n}\n:root[style] *:focus,\n:root *:focus {\n    outline: none;\n}\n:root[style]." + exports.ROOT_CLASS_KEYBOARD_INTERACT + " *." + exports.CSS_CLASS_NO_FOCUS_OUTLINE + ":focus:not(:target):not(." + exports.LINK_TARGET_CLASS + "),\n:root." + exports.ROOT_CLASS_KEYBOARD_INTERACT + " *." + exports.CSS_CLASS_NO_FOCUS_OUTLINE + ":focus:not(:target):not(." + exports.LINK_TARGET_CLASS + ") {\n    outline: none !important;\n}\n:root[style]." + exports.ROOT_CLASS_KEYBOARD_INTERACT + " *:focus:not(:target):not(." + exports.LINK_TARGET_CLASS + "),\n:root." + exports.ROOT_CLASS_KEYBOARD_INTERACT + " *:focus:not(:target):not(." + exports.LINK_TARGET_CLASS + ") {\n    outline-color: blue !important;\n    outline-style: solid !important;\n    outline-width: 2px !important;\n    outline-offset: 2px !important;\n}\n/*\n:root[style]:not(." + exports.ROOT_CLASS_KEYBOARD_INTERACT + ") *:focus,\n:root:not(." + exports.ROOT_CLASS_KEYBOARD_INTERACT + ") *:focus {\n    animation-name: readium2ElectronAnimation_FOCUS;\n    animation-duration: 3s;\n    animation-delay: 1s;\n    animation-fill-mode: forwards;\n    animation-timing-function: linear;\n}\n*/\n";
exports.targetCssStyles = "\n@keyframes readium2ElectronAnimation_TARGET {\n    0% {\n    }\n    100% {\n        outline: inherit;\n    }\n}\n:root[style] *:target,\n:root *:target,\n:root[style] *." + exports.LINK_TARGET_CLASS + ",\n:root *." + exports.LINK_TARGET_CLASS + "\n{\n    outline-color: green !important;\n    outline-style: solid !important;\n    outline-width: 2px !important;\n    outline-offset: 2px !important;\n\n    animation-name: readium2ElectronAnimation_TARGET;\n    animation-duration: 3s;\n    animation-delay: 1s;\n    animation-fill-mode: forwards;\n    animation-timing-function: linear;\n}\n:root[style] *.r2-no-target-outline:target,\n:root *.r2-no-target-outline:target,\n:root[style] *.r2-no-target-outline." + exports.LINK_TARGET_CLASS + ",\n:root *.r2-no-target-outline." + exports.LINK_TARGET_CLASS + " {\n    outline: inherit !important;\n}\n";
exports.selectionCssStyles = "\n\n." + exports.ZERO_TRANSFORM_CLASS + " {\n    will-change: scroll-position;\n    transform: translateX(0px);\n}\n\n:root[style] ::selection,\n:root ::selection {\nbackground: rgb(155, 179, 240) !important;\ncolor: black !important;\n}\n\n:root[style*=\"readium-night-on\"] ::selection {\nbackground: rgb(100, 122, 177) !important;\ncolor: white !important;\n}\n";
exports.scrollBarCssStyles = "\n::-webkit-scrollbar-button {\nheight: 0px !important;\nwidth: 0px !important;\n}\n\n::-webkit-scrollbar-corner {\nbackground: transparent !important;\n}\n\n/*::-webkit-scrollbar-track-piece {\nbackground: red;\n} */\n\n::-webkit-scrollbar {\nwidth:  14px;\nheight: 14px;\n}\n\n::-webkit-scrollbar-thumb {\nbackground: #727272;\nbackground-clip: padding-box !important;\nborder: 3px solid transparent !important;\nborder-radius: 30px;\n}\n\n::-webkit-scrollbar-thumb:hover {\nbackground: #4d4d4d;\n}\n\n::-webkit-scrollbar-track {\nbox-shadow: inset 0 0 3px rgba(40, 40, 40, 0.2);\nbackground: #dddddd;\nbox-sizing: content-box;\n}\n\n::-webkit-scrollbar-track:horizontal {\nborder-top: 1px solid silver;\n}\n::-webkit-scrollbar-track:vertical {\nborder-left: 1px solid silver;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-thumb {\nbackground: #a4a4a4;\nborder: 3px solid #545454;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-thumb:hover {\nbackground: #dedede;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-track {\nbackground: #545454;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-track:horizontal {\nborder-top: 1px solid black;\n}\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-track:vertical {\nborder-left: 1px solid black;\n}";
exports.readPosCssStylesAttr1 = "data-readium2-read-pos1";
exports.readPosCssStylesAttr2 = "data-readium2-read-pos2";
exports.readPosCssStylesAttr3 = "data-readium2-read-pos3";
exports.readPosCssStylesAttr4 = "data-readium2-read-pos4";
exports.readPosCssStyles = "\n:root[style*=\"readium-sepia-on\"] *[" + exports.readPosCssStylesAttr1 + "],\n:root[style*=\"readium-night-on\"] *[" + exports.readPosCssStylesAttr1 + "],\n:root[style] *[" + exports.readPosCssStylesAttr1 + "],\n:root *[" + exports.readPosCssStylesAttr1 + "] {\n    color: black !important;\n    background: magenta !important;\n\n    outline-color: magenta !important;\n    outline-style: solid !important;\n    outline-width: 6px !important;\n    outline-offset: 0px !important;\n}\n:root[style*=\"readium-sepia-on\"] *[" + exports.readPosCssStylesAttr2 + "],\n:root[style*=\"readium-night-on\"] *[" + exports.readPosCssStylesAttr2 + "],\n:root[style] *[" + exports.readPosCssStylesAttr2 + "],\n:root *[" + exports.readPosCssStylesAttr2 + "] {\n    color: black !important;\n    background: yellow !important;\n\n    outline-color: yellow !important;\n    outline-style: solid !important;\n    outline-width: 4px !important;\n    outline-offset: 0px !important;\n}\n:root[style*=\"readium-sepia-on\"] *[" + exports.readPosCssStylesAttr3 + "],\n:root[style*=\"readium-night-on\"] *[" + exports.readPosCssStylesAttr3 + "],\n:root[style] *[" + exports.readPosCssStylesAttr3 + "],\n:root *[" + exports.readPosCssStylesAttr3 + "] {\n    color: black !important;\n    background: green !important;\n\n    outline-color: green !important;\n    outline-style: solid !important;\n    outline-width: 2px !important;\n    outline-offset: 0px !important;\n}\n:root[style*=\"readium-sepia-on\"] *[" + exports.readPosCssStylesAttr4 + "],\n:root[style*=\"readium-night-on\"] *[" + exports.readPosCssStylesAttr4 + "],\n:root[style] *[" + exports.readPosCssStylesAttr4 + "],\n:root *[" + exports.readPosCssStylesAttr4 + "] {\n    color: black !important;\n    background: silver !important;\n\n    outline-color: silver !important;\n    outline-style: solid !important;\n    outline-width: 1px !important;\n    outline-offset: 0px !important;\n}";
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
exports.AUDIO_PLAYPAUSE_ID = "r2-audio-playPause";
exports.AUDIO_PREVIOUS_ID = "r2-audio-previous";
exports.AUDIO_NEXT_ID = "r2-audio-next";
exports.AUDIO_REWIND_ID = "r2-audio-rewind";
exports.AUDIO_FORWARD_ID = "r2-audio-forward";
exports.audioCssStyles = "\n\n#" + exports.AUDIO_BODY_ID + " {\n    padding: 0 !important;\n    margin-top: 0 !important;\n    margin-bottom: 0 !important;\n    height: 100vh !important;\n    display: flex !important;\n    align-items: center;\n    justify-content: center;\n    user-select: none;\n}\n\n#" + exports.AUDIO_SECTION_ID + " {\n    margin: 0;\n    padding: 0;\n    min-width: 500px;\n}\n\n#" + exports.AUDIO_TITLE_ID + " {\n    margin-top: 1em;\n    margin-bottom: 0;\n    display: block;\n    margin-left: auto;\n    margin-right: auto;\n    max-width: 800px;\n    width: 80%;\n    text-align: center;\n}\n\n#" + exports.AUDIO_COVER_ID + " {\n    display: block;\n    margin-left: auto;\n    margin-right: auto;\n    max-width: 500px !important;\n    max-height: 250px !important;\n    margin-top: 0.4em;\n    margin-bottom: 0.6em;\n    cursor: pointer;\n}\n\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_COVER_ID + " {\n    cursor: wait;\n}\n\n#" + exports.AUDIO_BUFFER_CANVAS_ID + " {\n    width: 500px;\n    height: 20px;\n\n    margin-left: auto;\n    margin-right: auto;\n\n    margin-bottom: 1em;\n\n    display: block;\n}\n\n#" + exports.AUDIO_ID + " {\n    display: block;\n    margin-left: auto;\n    margin-right: auto;\n    max-width: 800px;\n    height: 2.5em;\n    width: 80%;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " {\n    display: block;\n    padding: 0;\n    margin: 0;\n    margin-left: auto;\n    margin-right: auto;\n\n    max-width: 500px;\n    min-width: 500px;\n    width: 500px;\n    height: auto;\n\n    display: grid;\n    grid-column-gap: 0px;\n    grid-row-gap: 0px;\n\n    grid-template-columns: auto 3em 7em 3em auto;\n    grid-template-rows: auto 1.5em auto;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " button {\n    border: 0;\n    background-color: transparent;\n    text-align: center;\n    padding: 0;\n    margin: 0;\n    display: block;\n    cursor: pointer;\n    position: relative;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + " {\n    grid-column-start: 3;\n    grid-column-end: 4;\n    grid-row-start: 1;\n    grid-row-end: 2;\n\n    box-sizing: border-box;\n\n    justify-self: center;\n}\n\n:root:not(." + exports.AUDIO_PROGRESS_CLASS + ") #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + ",\n:root[style]:not(." + exports.AUDIO_PROGRESS_CLASS + ") #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + " {\n\n    width: 0;\n    height: 40px;\n\n    border-color: transparent transparent transparent #202020 !important;\n\n    transition: 100ms all ease;\n    will-change: border-width;\n\n    border-style: solid;\n    border-width: 20px 0 20px 40px;\n}\n\n:root:not(." + exports.AUDIO_PROGRESS_CLASS + ") #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + ".pause {\n    border-style: double;\n    border-width: 0px 0 0px 40px;\n}\n\n:root:not(." + exports.AUDIO_PROGRESS_CLASS + ") #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + ":hover,\n:root[style]:not(." + exports.AUDIO_PROGRESS_CLASS + ") #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + ":hover {\n\n    border-color: transparent transparent transparent #404040 !important;\n}\n\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + " {\n    cursor: wait;\n    width: 40px;\n    height: 40px;\n}\n:root[style]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + ":after {\n    content: \"\";\n    border-radius: 50%;\n\n    position: absolute;\n    width: 40px;\n    height: 40px;\n    left: 0px;\n    top: 0px;\n\n    transform: translateZ(0);\n    animation: readium2ElectronAnimation_audioLoad-spin 1.1s infinite linear;\n\n    border-top: 3px solid #999999;\n    border-right: 3px solid #999999;\n    border-bottom: 3px solid #999999;\n    border-left: 3px solid #333333;\n}\n:root[style*=\"readium-night-on\"]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PLAYPAUSE_ID + ":after {\n\n    border-top: 3px solid #202020;\n    border-right: 3px solid #202020;\n    border-bottom: 3px solid #202020;\n    border-left: 3px solid white;\n}\n@keyframes readium2ElectronAnimation_audioLoad-spin {\n    0% {\n        transform: rotate(0deg);\n    }\n    100% {\n        transform: rotate(360deg);\n    }\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_NEXT_ID + ",\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PREVIOUS_ID + ",\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_REWIND_ID + ",\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_FORWARD_ID + " {\n    width: 30px;\n    height: 30px;\n    position: relative;\n    align-self: center;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_NEXT_ID + ":before, #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_NEXT_ID + ":after,\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PREVIOUS_ID + ":before, #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PREVIOUS_ID + ":after,\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_REWIND_ID + ":before, #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_REWIND_ID + ":after,\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_FORWARD_ID + ":before, #" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_FORWARD_ID + ":after {\n    content: '';\n    border-color: transparent;\n    border-style: solid;\n    position: absolute;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PREVIOUS_ID + " {\n    grid-column-start: 1;\n    grid-column-end: 2;\n    grid-row-start: 1;\n    grid-row-end: 2;\n\n    justify-self: left;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PREVIOUS_ID + ":before {\n    border: none;\n    background-color: #555;\n    height: 30%;\n    width: 30%;\n    top: 35%;\n    left: 50%;\n}\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_PREVIOUS_ID + ":after {\n    left: -50%;\n    top: 0;\n    border-width: 15px 15px;\n    border-right-color: #555;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_NEXT_ID + " {\n    grid-column-start: 5;\n    grid-column-end: 6;\n    grid-row-start: 1;\n    grid-row-end: 2;\n\n    justify-self: right;\n}\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_NEXT_ID + ":before {\n    border: none;\n    background-color: #555;\n    height: 30%;\n    width: 30%;\n    top: 35%;\n    left: 20%;\n}\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_NEXT_ID + ":after {\n    left: 50%;\n    top: 0;\n    border-width: 15px 15px;\n    border-left-color: #555;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_REWIND_ID + " {\n    grid-column-start: 2;\n    grid-column-end: 3;\n    grid-row-start: 1;\n    grid-row-end: 2;\n\n    justify-self: right;\n}\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_REWIND_ID + ":before {\n    left: -20%;\n    top: 0;\n    border-width: 15px 15px;\n    border-right-color: #555;\n}\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_REWIND_ID + ":after {\n    left: -50%;\n    top: 0;\n    border-width: 15px 15px;\n    border-right-color: #555;\n}\n\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_FORWARD_ID + " {\n    grid-column-start: 4;\n    grid-column-end: 5;\n    grid-row-start: 1;\n    grid-row-end: 2;\n\n    justify-self: left;\n}\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_FORWARD_ID + ":before {\n    left: 20%;\n    top: 0;\n    border-width: 15px 15px;\n    border-left-color: #555;\n}\n#" + exports.AUDIO_CONTROLS_ID + " #" + exports.AUDIO_FORWARD_ID + ":after {\n    left: 50%;\n    top: 0;\n    border-width: 15px 15px;\n    border-left-color: #555;\n}\n\n\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_FORWARD_ID + ",\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_REWIND_ID + " {\n    display: none;\n}\n\n#" + exports.AUDIO_PERCENT_ID + ", #" + exports.AUDIO_TIME_ID + " {\n    font-size: 0.9em !important;\n    font-family: sans-serif !important;\n    margin-top: -0.5em;\n}\n#" + exports.AUDIO_TIME_ID + " {\n    grid-column-start: 1;\n    grid-column-end: 4;\n    grid-row-start: 3;\n    grid-row-end: 4;\n\n    text-align: left;\n}\n#" + exports.AUDIO_PERCENT_ID + " {\n    grid-column-start: 4;\n    grid-column-end: 6;\n    grid-row-start: 3;\n    grid-row-end: 4;\n\n    text-align: right;\n}\n\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_PERCENT_ID + ",\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_TIME_ID + " {\n    visibility: hidden;\n}\n\n:root[style] #" + exports.AUDIO_SLIDER_ID + ",\n:root #" + exports.AUDIO_SLIDER_ID + " {\npadding: 0;\nmargin: 0;\n\ndisplay: block;\n\ngrid-column-start: 1;\ngrid-column-end: 6;\ngrid-row-start: 2;\ngrid-row-end: 3;\n\ncursor: pointer;\n-webkit-appearance: none;\n\nbackground: transparent !important;\n\nbackground-clip: padding-box;\nborder-radius: 2px;\noverflow: hidden;\n\nposition: relative;\n}\n\n:root[style]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + ",\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + " {\n\ncursor: wait;\n}\n\n:root[style]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + ":before,\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + ":before {\n    content: '';\n    position: absolute;\n    background-color: #999999;\n    left: 0;\n    top: 1em;\n    height: 0.4em;\n    transform: translateZ(0);\n    will-change: left, right;\n    animation: readium2ElectronAnimation_audioLoad 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;\n}\n\n:root[style]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + ":after,\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + ":after {\n    content: '';\n    position: absolute;\n    background-color: #999999;\n    left: 0;\n    top: 1em;\n    height: 0.4em;\n    transform: translateZ(0);\n    will-change: left, right;\n    animation: readium2ElectronAnimation_audioLoad-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;\n    animation-delay: 1.15s;\n}\n\n:root[style*=\"readium-night-on\"]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + ":after {\n    background: #545454;\n}\n\n@keyframes readium2ElectronAnimation_audioLoad {\n0% {\nleft: -35%;\nright: 100%; }\n60% {\nleft: 100%;\nright: -90%; }\n100% {\nleft: 100%;\nright: -90%; } }\n\n@keyframes readium2ElectronAnimation_audioLoad-short {\n0% {\nleft: -200%;\nright: 100%; }\n60% {\nleft: 107%;\nright: -8%; }\n100% {\nleft: 107%;\nright: -8%; } }\n\n:root #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-runnable-track,\n:root[style] #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-runnable-track {\n    cursor: pointer;\n\n    width: 100%;\n    height: 0.5em;\n\n    background: #999999;\n\n    padding: 0;\n    margin: 0;\n\n    border: none;\n    border-radius: 0.2em;\n}\n:root[style*=\"readium-night-on\"] #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-runnable-track {\n    background: #545454;\n}\n\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-runnable-track,\n:root[style]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-runnable-track {\n    background: transparent !important;\n    cursor: wait;\n}\n:root[style*=\"readium-night-on\"]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-runnable-track {\n    background: transparent !important;\n}\n\n:root #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-thumb,\n:root[style] #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-thumb {\n    -webkit-appearance: none;\n\n    cursor: pointer;\n\n    width: 0.5em;\n    height: 1em;\n\n    padding: 0;\n    margin: 0;\n    margin-top: -0.2em;\n\n    border: none;\n    border-radius: 0.2em;\n\n    background: #333333;\n}\n:root[style*=\"readium-night-on\"] #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-thumb {\n    background: white;\n}\n\n:root." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-thumb,\n:root[style]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-thumb {\n    background: transparent !important;\n    cursor: wait;\n}\n:root[style*=\"readium-night-on\"]." + exports.AUDIO_PROGRESS_CLASS + " #" + exports.AUDIO_SLIDER_ID + "::-webkit-slider-thumb {\n    background: transparent !important;\n}\n";
//# sourceMappingURL=styles.js.map