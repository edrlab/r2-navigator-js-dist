export interface IHTMLDialogElementWithPopup extends HTMLElement {
    popDialog: PopupDialog | undefined;
    close: () => void;
    showModal: () => void;
}
export declare function isPopupDialogOpen(documant: Document): boolean;
export declare function closePopupDialogs(documant: Document): void;
export declare function isElementInsidePopupDialog(el: Element): boolean;
export declare class PopupDialog {
    readonly documant: Document;
    readonly onDialogClosed: (el: HTMLOrSVGElement | null) => void;
    readonly role: string;
    readonly dialog: IHTMLDialogElementWithPopup;
    readonly doNotTrapKeyboardFocusTabIndexCycling: boolean;
    private readonly _onKeyUp;
    private readonly _onKeyDown;
    constructor(documant: Document, outerHTML: string, onDialogClosed: (el: HTMLOrSVGElement | null) => void, optionalCssClass?: string, doNotTrapKeyboardFocusTabIndexCycling?: boolean);
    show(toRefocus: Element | undefined): void;
    cancelRefocus(): void;
    hide(): void;
}
