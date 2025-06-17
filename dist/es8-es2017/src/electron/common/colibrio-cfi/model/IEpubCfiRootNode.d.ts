import { IEpubCfiParserError } from '../parser/IEpubCfiParserError.js';
import { IEpubCfiNode } from './IEpubCfiNode.js';
import { IEpubCfiPathNode } from './IEpubCfiPathNode.js';
export declare interface IEpubCfiRootNode extends IEpubCfiNode {
    errors: IEpubCfiParserError[];
    parentPath: IEpubCfiPathNode | null;
    rangeEndPath: IEpubCfiPathNode | null;
    rangeStartPath: IEpubCfiPathNode | null;
    src: string;
    srcModified: boolean;
}
