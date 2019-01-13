import { LocatorLocations } from "r2-shared-js/dist/es6-es2015/src/models/locator";
import { IReadiumCSS } from "./readium-css-settings";
export declare const R2_EVENT_LOCATOR_VISIBLE = "R2_EVENT_LOCATOR_VISIBLE";
export interface IEventPayload_R2_EVENT_LOCATOR_VISIBLE {
    visible: boolean;
    location: LocatorLocations;
}
export declare const R2_EVENT_READIUMCSS = "R2_EVENT_READIUMCSS";
export interface IEventPayload_R2_EVENT_READIUMCSS {
    setCSS: IReadiumCSS | undefined;
    isFixedLayout?: boolean;
    urlRoot?: string;
}
export declare const R2_EVENT_DEBUG_VISUALS = "R2_EVENT_DEBUG_VISUALS";
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
export interface IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO {
    totalColumns: number | undefined;
    currentColumn: number | undefined;
    isTwoPageSpread: boolean | undefined;
    spreadIndex: number | undefined;
}
export interface IEventPayload_R2_EVENT_READING_LOCATION extends LocatorLocations {
    paginationInfo: IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO | undefined;
}
export declare const R2_EVENT_LINK = "R2_EVENT_LINK";
export interface IEventPayload_R2_EVENT_LINK {
    url: string;
}
export declare const R2_EVENT_WEBVIEW_READY = "R2_EVENT_WEBVIEW_READY";
export interface IEventPayload_R2_EVENT_WEBVIEW_READY {
    href: string;
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
