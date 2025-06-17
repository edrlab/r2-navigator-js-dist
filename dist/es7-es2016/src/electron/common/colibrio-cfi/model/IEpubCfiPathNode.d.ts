import { IEpubCfiLocalPathNode } from './IEpubCfiLocalPathNode.js';
import { IEpubCfiNode } from './IEpubCfiNode.js';
import { EpubCfiOffsetNode } from './offset/EpubCfiOffsetNode.js';
export declare interface IEpubCfiPathNode extends IEpubCfiNode {
    complete: boolean;
    localPaths: IEpubCfiLocalPathNode[];
    offset: EpubCfiOffsetNode | null;
}
