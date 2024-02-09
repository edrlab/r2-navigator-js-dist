export interface IHTMLDialogElementWithPopup extends HTMLDialogElement {
    popDialog: PopupDialog | undefined;
}
export declare function isPopupDialogOpen(documant: Document): boolean;
export declare function closePopupDialogs(documant: Document): void;
export declare function isElementInsidePopupDialog(el: Element): boolean;
export interface IClickXY {
    clickX: number;
    clickY: number;
}
export declare class PopupDialog {
    readonly documant: Document;
    readonly onDialogClosed: (thiz: PopupDialog, el: HTMLOrSVGElement | null) => void;
    readonly role: string;
    readonly dialog: IHTMLDialogElementWithPopup;
    readonly doNotTrapKeyboardFocusTabIndexCycling: boolean;
    readonly clickCloseXY: IClickXY;
    private readonly _onKeyUp;
    private readonly _onKeyDown;
    constructor(documant: Document, outerHTML: string, onDialogClosed: (thiz: PopupDialog, el: HTMLOrSVGElement | null) => void, optionalCssClass?: string, doNotTrapKeyboardFocusTabIndexCycling?: boolean);
    show(toRefocus: Element | undefined): void;
    cancelRefocus(): void;
    hide(): void;
}
