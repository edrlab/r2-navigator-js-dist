import { IEpubCfiRootNode } from '../model/IEpubCfiRootNode.js';
export declare class EpubCfiBuilder {
    private _rootNode;
    constructor(rootNode?: IEpubCfiRootNode);
    appendLocalPathTo(element: Element): void;
    appendTerminalDomPosition(container: Node, offset: number): void;
    appendTerminalDomRange(range: Range): void;
    appendTerminalIndirection(): void;
    clone(): EpubCfiBuilder;
    collapseToEnd(): void;
    collapseToStart(): void;
    getEpubCfiRootNode(): IEpubCfiRootNode;
    prependLocalPathTo(element: Element): void;
    toString(): string;
    private collapse;
}
