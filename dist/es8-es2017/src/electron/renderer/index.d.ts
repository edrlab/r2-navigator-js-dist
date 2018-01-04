import { Publication } from "r2-shared-js/dist/es8-es2017/src/models/publication";
export declare function setReadiumCssJsonGetter(func: () => string): void;
export declare function readiumCssOnOff(): void;
export declare function handleLink(href: string, previous: boolean | undefined, useGoto: boolean): void;
export declare function installNavigatorDOM(publication: Publication, publicationJsonUrl: string, rootHtmlElementID: string, preloadScriptPath: string, pubDocHrefToLoad: string, pubDocSelectorToGoto: string): void;
export declare function navLeftOrRight(left: boolean): void;
