import { Locator } from "r2-shared-js/dist/es6-es2015/src/models/locator";
import { Publication } from "r2-shared-js/dist/es6-es2015/src/models/publication";
export declare function readiumCssOnOff(): void;
export declare function installNavigatorDOM(publication: Publication, publicationURL: string, rootHtmlElementID: string, preloadScriptPath: string, location: Locator | undefined): void;
