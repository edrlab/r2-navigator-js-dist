export declare const ROOT_CLASS_REDUCE_MOTION = "r2-reduce-motion";
export declare const ROOT_CLASS_NO_FOOTNOTES = "r2-no-popup-foonotes";
export declare const POPUP_DIALOG_CLASS = "r2-popup-dialog";
export declare const FOOTNOTES_CONTAINER_CLASS = "r2-footnote-container";
export declare const FOOTNOTES_CLOSE_BUTTON_CLASS = "r2-footnote-close";
export declare const FOOTNOTE_FORCE_SHOW = "r2-footnote-force-show";
export declare const footnotesCssStyles: string;
export declare const TTS_ID_PREVIOUS = "r2-tts-previous";
export declare const TTS_ID_NEXT = "r2-tts-next";
export declare const TTS_ID_SLIDER = "r2-tts-slider";
export declare const TTS_ID_ACTIVE_WORD = "r2-tts-active-word";
export declare const TTS_ID_CONTAINER = "r2-tts-txt";
export declare const TTS_ID_INFO = "r2-tts-info";
export declare const TTS_NAV_BUTTON_CLASS = "r2-tts-button";
export declare const TTS_ID_SPEAKING_DOC_ELEMENT = "r2-tts-speaking-el";
export declare const TTS_CLASS_INJECTED_SPAN = "r2-tts-speaking-txt";
export declare const TTS_CLASS_INJECTED_SUBSPAN = "r2-tts-speaking-word";
export declare const TTS_ID_INJECTED_PARENT = "r2-tts-speaking-txt-parent";
export declare const ttsCssStyles: string;
export declare const ROOT_CLASS_INVISIBLE_MASK = "r2-visibility-mask";
export declare const visibilityMaskCssStyles: string;
export declare const ROOT_CLASS_KEYBOARD_INTERACT = "r2-keyboard-interact";
export declare const CSS_CLASS_NO_FOCUS_OUTLINE = "r2-no-focus-outline";
export declare const focusCssStyles: string;
export declare const targetCssStyles = "\n@keyframes readium2ElectronAnimation_TARGET {\n    0% {\n    }\n    100% {\n        outline: inherit;\n    }\n}\n*:target {\n    outline-color: green !important;\n    outline-style: solid !important;\n    outline-width: 2px !important;\n    outline-offset: 2px !important;\n\n    animation-name: readium2ElectronAnimation_TARGET;\n    animation-duration: 3s;\n    animation-delay: 1s;\n    animation-fill-mode: forwards;\n    animation-timing-function: linear;\n}\n*.r2-no-target-outline:target {\n    outline: inherit !important;\n}\n";
export declare const selectionCssStyles = "\n::selection {\nbackground-color: rgb(155, 179, 240) !important;\ncolor: black !important;\n}\n\n:root[style*=\"readium-night-on\"] ::selection {\nbackground-color: rgb(100, 122, 177) !important;\ncolor: white !important;\n}\n/*\n.readium2-hash {\n    color: black !important;\n    background-color: rgb(185, 207, 255) !important;\n}\n:root[style*=\"readium-night-on\"] .readium2-hash {\n    color: white !important;\n    background-color: rgb(67, 64, 125) !important;\n}\n*/\n";
export declare const scrollBarCssStyles = "\n::-webkit-scrollbar-button {\nheight: 0px !important;\nwidth: 0px !important;\n}\n\n::-webkit-scrollbar-corner {\nbackground: transparent !important;\n}\n\n/*::-webkit-scrollbar-track-piece {\nbackground-color: red;\n} */\n\n::-webkit-scrollbar {\nwidth:  14px;\nheight: 14px;\n}\n\n::-webkit-scrollbar-thumb {\nbackground: #727272;\nbackground-clip: padding-box !important;\nborder: 3px solid transparent !important;\nborder-radius: 30px;\n}\n\n::-webkit-scrollbar-thumb:hover {\nbackground: #4d4d4d;\n}\n\n::-webkit-scrollbar-track {\nbox-shadow: inset 0 0 3px rgba(40, 40, 40, 0.2);\nbackground: #dddddd;\nbox-sizing: content-box;\n}\n\n::-webkit-scrollbar-track:horizontal {\nborder-top: 1px solid silver;\n}\n::-webkit-scrollbar-track:vertical {\nborder-left: 1px solid silver;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-thumb {\nbackground: #a4a4a4;\nborder: 3px solid #545454;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-thumb:hover {\nbackground: #dedede;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-track {\nbackground: #545454;\n}\n\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-track:horizontal {\nborder-top: 1px solid black;\n}\n:root[style*=\"readium-night-on\"] ::-webkit-scrollbar-track:vertical {\nborder-left: 1px solid black;\n}";
export declare const readPosCssStylesAttr1 = "data-readium2-read-pos1";
export declare const readPosCssStylesAttr2 = "data-readium2-read-pos2";
export declare const readPosCssStylesAttr3 = "data-readium2-read-pos3";
export declare const readPosCssStylesAttr4 = "data-readium2-read-pos4";
export declare const readPosCssStyles: string;
