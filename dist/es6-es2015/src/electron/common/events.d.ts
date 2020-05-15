import { Locator, LocatorLocations } from "r2-shared-js/dist/es6-es2015/src/models/locator";
import { IAudioPlaybackInfo } from "./audiobook";
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
    audioPlaybackInfo: IAudioPlaybackInfo | undefined;
    paginationInfo: IPaginationInfo | undefined;
    selectionInfo: ISelectionInfo | undefined;
    docInfo: IDocInfo | undefined;
    selectionIsNew: boolean | undefined;
    epubPage: string | undefined;
}
export declare const R2_EVENT_LINK = "R2_EVENT_LINK";
export interface IEventPayload_R2_EVENT_LINK {
    url: string;
}
export declare const R2_EVENT_AUDIO_SOUNDTRACK = "R2_EVENT_AUDIO_SOUNDTRACK";
export interface IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK {
    url: string;
}
export declare const R2_EVENT_MEDIA_OVERLAY_CLICK = "R2_EVENT_MEDIA_OVERLAY_CLICK";
export interface IEventPayload_R2_EVENT_MEDIA_OVERLAY_CLICK {
    textFragmentIDChain: Array<string | null> | undefined;
    userInteract: boolean;
}
export declare const R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT = "R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT";
export interface IEventPayload_R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT {
    id: string | undefined;
    classActive: string | undefined;
    classActivePlayback: string | undefined;
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
export declare const R2_EVENT_AUDIO_DO_PLAY = "R2_EVENT_AUDIO_DO_PLAY";
export declare const R2_EVENT_AUDIO_DO_PAUSE = "R2_EVENT_AUDIO_DO_PAUSE";
export declare const R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE = "R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE";
export declare const R2_EVENT_AUDIO_REWIND = "R2_EVENT_AUDIO_REWIND";
export declare const R2_EVENT_AUDIO_FORWARD = "R2_EVENT_AUDIO_FORWARD";
export declare const R2_EVENT_AUDIO_PLAYBACK_RATE = "R2_EVENT_AUDIO_PLAYBACK_RATE";
export interface IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE {
    speed: number;
}
export declare const R2_EVENT_TTS_PLAYBACK_RATE = "R2_EVENT_TTS_PLAYBACK_RATE";
export interface IEventPayload_R2_EVENT_TTS_PLAYBACK_RATE {
    speed: number;
}
export declare const R2_EVENT_TTS_DO_PLAY = "R2_EVENT_TTS_DO_PLAY";
export interface IEventPayload_R2_EVENT_TTS_DO_PLAY {
    rootElement: string;
    startElement: string | undefined;
    speed: number;
}
export declare const R2_EVENT_TTS_DO_PAUSE = "R2_EVENT_TTS_DO_PAUSE";
export declare const R2_EVENT_TTS_DO_RESUME = "R2_EVENT_TTS_DO_RESUME";
export declare const R2_EVENT_TTS_DO_STOP = "R2_EVENT_TTS_DO_STOP";
export declare const R2_EVENT_TTS_IS_STOPPED = "R2_EVENT_TTS_IS_STOPPED";
export declare const R2_EVENT_TTS_IS_PAUSED = "R2_EVENT_TTS_IS_PAUSED";
export declare const R2_EVENT_TTS_IS_PLAYING = "R2_EVENT_TTS_IS_PLAYING";
export declare const R2_EVENT_TTS_DOC_END = "R2_EVENT_TTS_DOC_END";
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
export declare const R2_EVENT_WEBVIEW_KEYUP = "R2_EVENT_WEBVIEW_KEYUP";
export interface IKeyboardEvent {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    code: string;
    key?: string;
}
export interface IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN extends IKeyboardEvent {
    elementName: string;
    elementAttributes: {
        [name: string]: string;
    };
}
export declare type IEventPayload_R2_EVENT_WEBVIEW_KEYUP = IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN;
export declare const R2_EVENT_CLIPBOARD_COPY = "R2_EVENT_CLIPBOARD_COPY";
export interface IEventPayload_R2_EVENT_CLIPBOARD_COPY {
    txt: string;
    locator: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
}
