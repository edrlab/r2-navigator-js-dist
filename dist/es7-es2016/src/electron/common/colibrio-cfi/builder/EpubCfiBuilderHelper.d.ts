import { IEpubCfiLocalPathNode } from '../model/IEpubCfiLocalPathNode.js';
import { IEpubCfiPathNode } from '../model/IEpubCfiPathNode.js';
import { IEpubCfiRootNode } from '../model/IEpubCfiRootNode.js';
import { IEpubCfiStepNode } from '../model/IEpubCfiStepNode.js';
import { IEpubCfiCharacterOffsetNode } from '../model/offset/IEpubCfiCharacterOffsetNode.js';
export declare class EpubCfiBuilderHelper {
    static appendTerminalDomRange(range: Range, rootNode?: IEpubCfiRootNode): IEpubCfiRootNode;
    static appendTerminalLocalPath(container: Node, offset: number, pathNode?: IEpubCfiPathNode, stopNode?: Node): IEpubCfiPathNode;
    static buildCharacterOffsetToNode(node: Node): IEpubCfiCharacterOffsetNode | null;
    static buildLocalPathToElement(element: Element, indirection: boolean): IEpubCfiLocalPathNode;
    static buildStepsToElement(element: Element, rootNode?: Node): IEpubCfiStepNode[];
    static buildTextStep(node: Node): IEpubCfiStepNode;
}
