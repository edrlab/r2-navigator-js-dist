import { Link } from "r2-shared-js/dist/es7-es2016/src/models/publication-link";
import { IEventPayload_R2_EVENT_READING_LOCATION } from "../../common/events";
import { IStringMap } from "../common/querystring";
export interface IReadium2State {
    urlQueryParams: IStringMap | undefined;
    hashElement: Element | null;
    locationHashOverride: Element | undefined;
    locationHashOverrideInfo: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
    readyPassDone: boolean;
    readyEventSent: boolean;
    isFixedLayout: boolean;
    fxlViewportWidth: number;
    fxlViewportHeight: number;
}
export interface IWebViewState {
    id: number;
    link: Link | undefined;
}
export interface IElectronWebviewTag extends Electron.WebviewTag {
    READIUM2: IWebViewState;
}
export interface IElectronWebviewTagWindow extends Window {
    READIUM2: IReadium2State;
}
