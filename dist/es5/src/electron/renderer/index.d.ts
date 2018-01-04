import { Publication } from "r2-shared-js/dist/es5/src/models/publication";
export declare function setReadiumCssJsonGetter(func: () => string): void;
export declare function setReadingLocationSaver(func: (docHref: string, cssSelector: string) => void): void;
export declare function readiumCssOnOff(): void;
export declare function handleLink(href: string, previous: boolean | undefined, useGoto: boolean): void;
export declare function installNavigatorDOM(publication: Publication, publicationJsonUrl: string, rootHtmlElementID: string, preloadScriptPath: string, pubDocHrefToLoad: string | undefined, pubDocSelectorToGoto: string | undefined): void;
export declare function navLeftOrRight(left: boolean): void;
