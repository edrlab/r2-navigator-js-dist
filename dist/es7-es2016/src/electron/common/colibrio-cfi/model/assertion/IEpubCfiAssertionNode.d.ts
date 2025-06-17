import { IEpubCfiNode } from '../IEpubCfiNode.js';
import { IEpubCfiAssertionParameterNode } from './IEpubCfiAssertionParameterNode.js';
export declare interface IEpubCfiAssertionNode extends IEpubCfiNode {
    parameters: IEpubCfiAssertionParameterNode[];
    values: string[];
}
