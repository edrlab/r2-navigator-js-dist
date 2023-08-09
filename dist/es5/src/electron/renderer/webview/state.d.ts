import { Publication } from "r2-shared-js/dist/es5/src/models/publication";
import { Link } from "r2-shared-js/dist/es5/src/models/publication-link";
import { IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_READING_LOCATION, IEventPayload_R2_EVENT_READIUMCSS } from "../../common/events";
import { WebViewSlotEnum } from "../../common/styles";
import { IStringMap } from "../common/querystring";
export type TWindow = typeof window;
export interface IReadiumElectronWebviewWindowState {
    urlQueryParams: IStringMap | undefined;
    hashElement: Element | null;
    locationHashOverride: Element | undefined;
    locationHashOverrideInfo: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
    isAudio: boolean;
    ignorekeyDownUpEvents: boolean;
    isFixedLayout: boolean;
    fxlViewportWidth: number;
    fxlViewportHeight: number;
    fxlViewportScale: number;
    fxlZoomPercent: number;
    webViewSlot: WebViewSlotEnum;
    DEBUG_VISUALS: boolean;
    ttsSkippabilityEnabled: boolean;
    ttsSentenceDetectionEnabled: boolean;
    ttsClickEnabled: boolean;
    ttsOverlayEnabled: boolean;
    ttsPlaybackRate: number;
    ttsVoice: SpeechSynthesisVoice | null;
    isClipboardIntercept: boolean;
}
export interface IReadiumElectronWebviewWindow {
    READIUM2: IReadiumElectronWebviewWindowState;
}
export type ReadiumElectronWebviewWindow = TWindow & IReadiumElectronWebviewWindow;
export interface IReadiumElectronWebviewState {
    id: number;
    link: Link | undefined;
    forceRefresh?: boolean;
    readiumCss: IEventPayload_R2_EVENT_READIUMCSS | undefined;
    DOMisReady?: boolean;
}
export interface IReadiumElectronWebview extends Electron.WebviewTag {
    READIUM2: IReadiumElectronWebviewState;
}
export interface IReadiumElectronBrowserWindow {
    publication: Publication;
    publicationURL: string;
    sessionInfo: string | undefined;
    domRootElement: HTMLElement;
    domSlidingViewport: HTMLElement;
    DEBUG_VISUALS: boolean;
    ttsSkippabilityEnabled: boolean;
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
export interface IWithIReadiumElectronBrowserWindow {
    READIUM2: IReadiumElectronBrowserWindow;
}
export type ReadiumElectronBrowserWindow = TWindow & IWithIReadiumElectronBrowserWindow;
