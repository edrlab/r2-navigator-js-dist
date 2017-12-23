import { Publication } from "r2-shared-js/dist/es8-es2017/src/models/publication";
import { Server } from "r2-streamer-js/dist/es8-es2017/src/http/server";
import { IDeviceIDManager } from "./lsd-deviceid-manager";
export declare function installLsdHandler(publicationsServer: Server, deviceIDManager: IDeviceIDManager): void;
export declare function launchStatusDocumentProcessing(publication: Publication, publicationPath: string, deviceIDManager: IDeviceIDManager, onStatusDocumentProcessingComplete: () => void): Promise<void>;
