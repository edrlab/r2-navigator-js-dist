import { Publication } from "r2-shared-js/dist/es7-es2016/src/models/publication";
import { Link } from "r2-shared-js/dist/es7-es2016/src/models/publication-link";
import { IEventPayload_R2_EVENT_READING_LOCATION } from "../../common/events";
import { IStringMap } from "../common/querystring";
export interface IReadiumElectronWebviewWindowState {
    urlQueryParams: IStringMap | undefined;
    hashElement: Element | null;
    locationHashOverride: Element | undefined;
    locationHashOverrideInfo: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
    isFixedLayout: boolean;
    fxlViewportWidth: number;
    fxlViewportHeight: number;
    fxlViewportScale: number;
    DEBUG_VISUALS: boolean;
    ttsClickEnabled: boolean;
}
export interface IReadiumElectronWebviewWindow extends Window {
    READIUM2: IReadiumElectronWebviewWindowState;
}
export interface IReadiumElectronWebviewState {
    id: number;
    link: Link | undefined;
}
export interface IReadiumElectronWebview extends Electron.WebviewTag {
    READIUM2: IReadiumElectronWebviewState;
}
export interface IReadiumElectronBrowserWindowState {
    publication: Publication;
    publicationURL: string;
    domRootElement: HTMLElement;
    domSlidingViewport: HTMLElement;
    DEBUG_VISUALS: boolean;
    ttsClickEnabled: boolean;
    getActiveWebView: () => IReadiumElectronWebview | undefined;
}
export interface IWithReadiumElectronBrowserWindowState {
    READIUM2: IReadiumElectronBrowserWindowState;
}
export declare type TWindow = typeof window;
export declare type IReadiumElectronBrowserWindow = TWindow & IWithReadiumElectronBrowserWindowState;
