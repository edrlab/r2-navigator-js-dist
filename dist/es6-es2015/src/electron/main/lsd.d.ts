import { Server } from "r2-streamer-js/dist/es6-es2015/src/http/server";
import { Publication } from "r2-streamer-js/dist/es6-es2015/src/models/publication";
import { IDeviceIDManager } from "./lsd-deviceid-manager";
export declare function installLsdHandler(publicationsServer: Server, deviceIDManager: IDeviceIDManager): void;
export declare function launchStatusDocumentProcessing(publication: Publication, publicationPath: string, deviceIDManager: IDeviceIDManager, onStatusDocumentProcessingComplete: () => void): Promise<void>;
