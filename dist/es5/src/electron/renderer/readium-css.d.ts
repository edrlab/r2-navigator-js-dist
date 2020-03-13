import { Link } from "r2-shared-js/dist/es5/src/models/publication-link";
import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
export declare function isRTL(): boolean;
export declare function isFixedLayout(link: Link | undefined): boolean;
export declare function obtainReadiumCss(rcss?: IEventPayload_R2_EVENT_READIUMCSS): IEventPayload_R2_EVENT_READIUMCSS;
export declare function adjustReadiumCssJsonMessageForFixedLayout(link: Link | undefined, rcss: IEventPayload_R2_EVENT_READIUMCSS): IEventPayload_R2_EVENT_READIUMCSS;
export declare function setReadiumCssJsonGetter(func: () => IEventPayload_R2_EVENT_READIUMCSS): void;
