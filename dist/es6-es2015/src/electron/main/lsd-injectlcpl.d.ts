import { Publication } from "r2-streamer-js/dist/es6-es2015/src/models/publication";
export declare function lsdLcpUpdateInject(lcplStr: string, publication: Publication, publicationPath: string): Promise<string>;
export declare function lsdLcpUpdate(lsdJson: any, publication: Publication): Promise<string>;
