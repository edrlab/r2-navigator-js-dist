import { IEpubCfiRootNode } from '../model/IEpubCfiRootNode.js';
export declare class EpubCfiValidator {
    static addExplicitCharacterOffsets(rootNode: IEpubCfiRootNode): boolean;
    static checkEmptyParentPathAndRangeEnd(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
    static expandEmptyIndirectionLocalPaths(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
    static removeEmptyIndirectionBeforeOffsets(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
    static removeIncompatibleRangeOffsets(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
    static removeInitialIndirectionFromParentPath(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
    static removeInvalidRangeAfterParentPathOffset(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
    static removeStepsAfterTextSteps(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
    static runAllValidations(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean;
}
