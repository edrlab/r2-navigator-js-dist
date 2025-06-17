import { IEpubCfiLocalPathNode } from '../model/IEpubCfiLocalPathNode.js';
import { EpubCfiIntendedTargetType } from './EpubCfiIntendedTargetType.js';
import { EpubCfiResolverErrorType } from './EpubCfiResolverErrorType.js';
import { EpubCfiVirtualTarget } from './EpubCfiVirtualTarget.js';
import { IEpubCfiResolverError } from './IEpubCfiResolverError.js';
export declare class EpubCfiResolvedLocalPath {
    ast: IEpubCfiLocalPathNode | null;
    container: Node;
    documentUrl: URL;
    intendedTargetType: EpubCfiIntendedTargetType;
    isOpfDocument: boolean;
    missingXmlIdAssertions: boolean;
    offset: number;
    repairedWithXmlIdAssertions: boolean;
    resolverErrors: IEpubCfiResolverError[];
    stepsResolved: boolean;
    virtualTarget: EpubCfiVirtualTarget | null;
    constructor(ast: IEpubCfiLocalPathNode | null, documentUrl: URL, container: Node, offset: number, intendedTargetType: EpubCfiIntendedTargetType, virtualTarget: EpubCfiVirtualTarget | null);
    createResolverError(type: EpubCfiResolverErrorType, node: Node, errorData: any): void;
    getDocument(): Document;
    getTargetElement(): Element | null;
    getTargetNode(): Node | null;
}
