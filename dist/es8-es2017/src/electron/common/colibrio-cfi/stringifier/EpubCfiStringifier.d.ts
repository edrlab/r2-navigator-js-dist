import { IEpubCfiRootNode } from '../model/IEpubCfiRootNode.js';
export declare class EpubCfiStringifier {
    static stringifyRootNode(rootNode: IEpubCfiRootNode): string;
    private static processAssertion;
    private static processLocalPath;
    private static processOffset;
    private static processOffsetCharacter;
    private static processOffsetSpatial;
    private static processOffsetTemporal;
    private static processPath;
    private static processStep;
}
