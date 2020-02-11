import { Publication } from "r2-shared-js/dist/es7-es2016/src/models/publication";
import { Link } from "r2-shared-js/dist/es7-es2016/src/models/publication-link";
import { Server } from "r2-streamer-js/dist/es7-es2016/src/http/server";
import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
export declare type TReadiumCssGetterFunction = (publication: Publication, link: Link, sessionInfo: string | undefined) => IEventPayload_R2_EVENT_READIUMCSS;
export declare function setupReadiumCSS(server: Server, folderPath: string, readiumCssGetter: TReadiumCssGetterFunction): void;
