import { Locator, LocatorLocations } from "r2-shared-js/dist/es5/src/models/locator";
import { IDocInfo } from "./document";
import { IHighlight, IHighlightDefinition } from "./highlight";
import { IPaginationInfo } from "./pagination";
import { IReadiumCSS } from "./readium-css-settings";
import { ISelectionInfo } from "./selection";
export declare const R2_EVENT_LOCATOR_VISIBLE = "R2_EVENT_LOCATOR_VISIBLE";
export interface IEventPayload_R2_EVENT_LOCATOR_VISIBLE {
    visible: boolean;
    location: LocatorLocations;
}
export declare const R2_EVENT_READIUMCSS = "R2_EVENT_READIUMCSS";
export interface IEventPayload_R2_EVENT_READIUMCSS {
    setCSS: IReadiumCSS | undefined;
    isFixedLayout?: boolean;
    fixedLayoutWebViewWidth?: number;
    fixedLayoutWebViewHeight?: number;
    urlRoot?: string;
}
export declare const R2_EVENT_DEBUG_VISUALS = "R2_EVENT_DEBUG_VISUALS";
export interface IEventPayload_R2_EVENT_DEBUG_VISUALS {
    debugVisuals: boolean;
    cssSelector?: string;
    cssClass?: string;
    cssStyles?: string;
}
export declare const R2_EVENT_SCROLLTO = "R2_EVENT_SCROLLTO";
export interface IEventPayload_R2_EVENT_SCROLLTO {
    goto: string | undefined;
    hash: string | undefined;
    previous: boolean;
}
export declare const R2_EVENT_PAGE_TURN = "R2_EVENT_PAGE_TURN";
export declare const R2_EVENT_PAGE_TURN_RES = "R2_EVENT_PAGE_TURN_RES";
export interface IEventPayload_R2_EVENT_PAGE_TURN {
    direction: string;
    go: string;
}
export declare const R2_EVENT_READING_LOCATION = "R2_EVENT_READING_LOCATION";
export interface IEventPayload_R2_EVENT_READING_LOCATION extends Locator {
    paginationInfo: IPaginationInfo | undefined;
    selectionInfo: ISelectionInfo | undefined;
    docInfo: IDocInfo | undefined;
    selectionIsNew: boolean | undefined;
}
export declare const R2_EVENT_LINK = "R2_EVENT_LINK";
export interface IEventPayload_R2_EVENT_LINK {
    url: string;
}
export declare const R2_EVENT_SHIFT_VIEW_X = "R2_EVENT_SHIFT_VIEW_X";
export interface IEventPayload_R2_EVENT_SHIFT_VIEW_X {
    offset: number;
    backgroundColor: string | undefined;
}
export declare const R2_EVENT_TTS_CLICK_ENABLE = "R2_EVENT_TTS_CLICK_ENABLE";
export interface IEventPayload_R2_EVENT_TTS_CLICK_ENABLE {
    doEnable: boolean;
}
export declare const R2_EVENT_TTS_DO_PLAY = "R2_EVENT_TTS_DO_PLAY";
export interface IEventPayload_R2_EVENT_TTS_DO_PLAY {
    rootElement: string;
    startElement: string | undefined;
}
export declare const R2_EVENT_TTS_DO_PAUSE = "R2_EVENT_TTS_DO_PAUSE";
export declare const R2_EVENT_TTS_DO_RESUME = "R2_EVENT_TTS_DO_RESUME";
export declare const R2_EVENT_TTS_DO_STOP = "R2_EVENT_TTS_DO_STOP";
export declare const R2_EVENT_TTS_IS_STOPPED = "R2_EVENT_TTS_IS_STOPPED";
export declare const R2_EVENT_TTS_IS_PAUSED = "R2_EVENT_TTS_IS_PAUSED";
export declare const R2_EVENT_TTS_IS_PLAYING = "R2_EVENT_TTS_IS_PLAYING";
export declare const R2_EVENT_TTS_DO_NEXT = "R2_EVENT_TTS_DO_NEXT";
export declare const R2_EVENT_TTS_DO_PREVIOUS = "R2_EVENT_TTS_DO_PREVIOUS";
export declare const R2_EVENT_HIGHLIGHT_CREATE = "R2_EVENT_HIGHLIGHT_CREATE";
export interface IEventPayload_R2_EVENT_HIGHLIGHT_CREATE {
    highlightDefinitions: IHighlightDefinition[] | undefined;
    highlights: Array<IHighlight | null> | undefined;
}
export declare const R2_EVENT_HIGHLIGHT_REMOVE = "R2_EVENT_HIGHLIGHT_REMOVE";
export interface IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE {
    highlightIDs: string[];
}
export declare const R2_EVENT_HIGHLIGHT_REMOVE_ALL = "R2_EVENT_HIGHLIGHT_REMOVE_ALL";
export declare const R2_EVENT_HIGHLIGHT_CLICK = "R2_EVENT_HIGHLIGHT_CLICK";
export interface IEventPayload_R2_EVENT_HIGHLIGHT_CLICK {
    highlight: IHighlight;
}
export declare const R2_EVENT_WEBVIEW_KEYDOWN = "R2_EVENT_WEBVIEW_KEYDOWN";
export interface IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN {
    key: string;
    code: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}
export declare const R2_EVENT_CLIPBOARD_COPY = "R2_EVENT_CLIPBOARD_COPY";
export interface IEventPayload_R2_EVENT_CLIPBOARD_COPY {
    txt: string;
    locator: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
}
