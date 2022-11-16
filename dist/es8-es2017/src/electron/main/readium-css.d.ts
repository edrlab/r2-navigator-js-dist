import { Publication } from "r2-shared-js/dist/es8-es2017/src/models/publication";
import { Link } from "r2-shared-js/dist/es8-es2017/src/models/publication-link";
import { Server } from "r2-streamer-js/dist/es8-es2017/src/http/server";
import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
export type TReadiumCssGetterFunction = (publication: Publication, link: Link, sessionInfo: string | undefined) => IEventPayload_R2_EVENT_READIUMCSS;
export declare function setupReadiumCSS(server: Server, folderPath: string, readiumCssGetter: TReadiumCssGetterFunction): void;
