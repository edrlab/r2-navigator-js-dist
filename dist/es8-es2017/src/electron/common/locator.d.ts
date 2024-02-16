import { IRangeInfo } from "./selection";
export interface Locator {
    href: string;
    title?: string;
    text?: LocatorText;
    locations: LocatorLocations;
}
export interface LocatorText {
    before?: string;
    highlight?: string;
    after?: string;
    beforeRaw?: string;
    highlightRaw?: string;
    afterRaw?: string;
}
export interface LocatorLocations {
    cfi?: string;
    cssSelector?: string;
    position?: number;
    progression?: number;
    rangeInfo?: IRangeInfo;
}
