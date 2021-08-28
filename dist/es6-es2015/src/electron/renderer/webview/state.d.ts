import { Publication } from "r2-shared-js/dist/es6-es2015/src/models/publication";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import { IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_READING_LOCATION, IEventPayload_R2_EVENT_READIUMCSS } from "../../common/events";
import { WebViewSlotEnum } from "../../common/styles";
import { IStringMap } from "../common/querystring";
export interface IReadiumElectronWebviewWindowState {
    urlQueryParams: IStringMap | undefined;
    hashElement: Element | null;
    locationHashOverride: Element | undefined;
    locationHashOverrideInfo: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
    isAudio: boolean;
    isFixedLayout: boolean;
    fxlViewportWidth: number;
    fxlViewportHeight: number;
    fxlViewportScale: number;
    fxlZoomPercent: number;
    webViewSlot: WebViewSlotEnum;
    DEBUG_VISUALS: boolean;
    ttsSentenceDetectionEnabled: boolean;
    ttsClickEnabled: boolean;
    ttsOverlayEnabled: boolean;
    ttsPlaybackRate: number;
    ttsVoice: SpeechSynthesisVoice | null;
    isClipboardIntercept: boolean;
}
export interface IReadiumElectronWebviewWindow extends Window {
    READIUM2: IReadiumElectronWebviewWindowState;
}
export interface IReadiumElectronWebviewState {
    id: number;
    link: Link | undefined;
    forceRefresh?: boolean;
    readiumCss: IEventPayload_R2_EVENT_READIUMCSS | undefined;
}
export interface IReadiumElectronWebview extends Electron.WebviewTag {
    READIUM2: IReadiumElectronWebviewState;
}
export interface IReadiumElectronBrowserWindowState {
    publication: Publication;
    publicationURL: string;
    sessionInfo: string | undefined;
    domRootElement: HTMLElement;
    domSlidingViewport: HTMLElement;
    DEBUG_VISUALS: boolean;
    ttsSentenceDetectionEnabled: boolean;
    ttsClickEnabled: boolean;
    ttsOverlayEnabled: boolean;
    ttsPlaybackRate: number;
    ttsVoice: SpeechSynthesisVoice | null;
    fixedLayoutZoomPercent: number;
    clipboardInterceptor: ((data: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => void) | undefined;
    preloadScriptPath: string;
    getFirstWebView: () => IReadiumElectronWebview | undefined;
    destroyFirstWebView: () => void;
    createFirstWebView: () => void;
    getSecondWebView: (create: boolean) => IReadiumElectronWebview | undefined;
    destroySecondWebView: () => void;
    createSecondWebView: () => void;
    getFirstOrSecondWebView: () => IReadiumElectronWebview | undefined;
    getActiveWebViews: () => IReadiumElectronWebview[];
    enableScreenReaderAccessibilityWebViewHardRefresh: boolean;
    isScreenReaderMounted: boolean;
}
export interface IWithReadiumElectronBrowserWindowState {
    READIUM2: IReadiumElectronBrowserWindowState;
}
export declare type TWindow = typeof window;
export declare type IReadiumElectronBrowserWindow = TWindow & IWithReadiumElectronBrowserWindowState;
