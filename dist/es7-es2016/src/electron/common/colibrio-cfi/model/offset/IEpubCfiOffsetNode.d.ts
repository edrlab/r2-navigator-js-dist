import { IEpubCfiAssertionNode } from '../assertion/IEpubCfiAssertionNode.js';
import { IEpubCfiNode } from '../IEpubCfiNode.js';
import { EpubCfiOffsetType } from './EpubCfiOffsetType.js';
export declare interface IEpubCfiOffsetNode extends IEpubCfiNode {
    assertion: IEpubCfiAssertionNode | null;
    type: EpubCfiOffsetType;
}
