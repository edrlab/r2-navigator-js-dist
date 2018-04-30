import { Publication } from "r2-shared-js/dist/es8-es2017/src/models/publication";
import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
import { INameVersion } from "./webview/epubReadingSystem";
export declare const DOM_EVENT_HIDE_VIEWPORT = "r2:hide-content-viewport";
export declare const DOM_EVENT_SHOW_VIEWPORT = "r2:show-content-viewport";
export declare function setEpubReadingSystemJsonGetter(func: () => INameVersion): void;
export declare function setReadiumCssJsonGetter(func: () => IEventPayload_R2_EVENT_READIUMCSS): void;
export declare function setReadingLocationSaver(func: (docHref: string, cssSelector: string) => void): void;
export declare function readiumCssOnOff(): void;
export declare function handleLink(href: string, previous: boolean | undefined, useGoto: boolean): void;
export declare function installNavigatorDOM(publication: Publication, publicationJsonUrl: string, rootHtmlElementID: string, preloadScriptPath: string, pubDocHrefToLoad: string | undefined, pubDocSelectorToGoto: string | undefined): void;
export declare function navLeftOrRight(left: boolean): void;
