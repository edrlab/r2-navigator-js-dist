import { Link } from "r2-shared-js/dist/es7-es2016/src/models/publication-link";
import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
import { IReadiumElectronWebview } from "./webview/state";
export declare function isRTL_PackageMeta(): boolean;
export declare function isFixedLayout(link: Link | undefined): boolean;
export declare function obtainReadiumCss(rcss?: IEventPayload_R2_EVENT_READIUMCSS): IEventPayload_R2_EVENT_READIUMCSS;
export declare function adjustReadiumCssJsonMessageForFixedLayout(webview: IReadiumElectronWebview | undefined, pubLink: Link | undefined, rcss: IEventPayload_R2_EVENT_READIUMCSS): IEventPayload_R2_EVENT_READIUMCSS;
export declare function setReadiumCssJsonGetter(func: () => IEventPayload_R2_EVENT_READIUMCSS): void;
