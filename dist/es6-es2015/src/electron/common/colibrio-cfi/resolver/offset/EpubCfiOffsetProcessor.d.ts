import { EpubCfiResolvedPath } from '../EpubCfiResolvedPath.js';
export declare class EpubCfiOffsetProcessor {
    constructor();
    processOffset(path: EpubCfiResolvedPath): void;
    private handleElementCharacterOffset;
    private handleSpatialOffset;
    private handleTemporalOffset;
    private resolveCharacterOffset;
}
