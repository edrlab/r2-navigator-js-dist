import { Publication } from "r2-shared-js/dist/es7-es2016/src/models/publication";
import { Link } from "r2-shared-js/dist/es7-es2016/src/models/publication-link";
import { IEventPayload_R2_EVENT_READING_LOCATION } from "../../common/events";
import { IStringMap } from "../common/querystring";
export interface IElectronWebviewTagWindowState {
    urlQueryParams: IStringMap | undefined;
    hashElement: Element | null;
    locationHashOverride: Element | undefined;
    locationHashOverrideInfo: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
    isFixedLayout: boolean;
    fxlViewportWidth: number;
    fxlViewportHeight: number;
    DEBUG_VISUALS: boolean;
    ttsClickEnabled: boolean;
}
export interface IElectronWebviewTagWindow extends Window {
    READIUM2: IElectronWebviewTagWindowState;
}
export interface IElectronWebviewTagState {
    id: number;
    link: Link | undefined;
}
export interface IElectronWebviewTag extends Electron.WebviewTag {
    READIUM2: IElectronWebviewTagState;
}
export interface IElectronBrowserWindowState {
    publication: Publication;
    publicationURL: string;
    DEBUG_VISUALS: boolean;
    ttsClickEnabled: boolean;
}
export interface IElectronBrowserWindow extends Window {
    READIUM2: IElectronBrowserWindowState;
}
