export interface IHTMLDialogElementWithPopup extends HTMLDialogElement {
    popDialog: PopupDialog | undefined;
}
export declare function isPopupDialogOpen(documant: Document): boolean;
export declare function closePopupDialogs(documant: Document): void;
export declare function isElementInsidePopupDialog(el: Element): boolean;
export declare class PopupDialog {
    readonly documant: Document;
    readonly onDialogClosed: (el: HTMLOrSVGElement | null) => void;
    readonly role: string;
    readonly dialog: IHTMLDialogElementWithPopup;
    private readonly _onKeyUp;
    private readonly _onKeyDown;
    constructor(documant: Document, outerHTML: string, id: string, onDialogClosed: (el: HTMLOrSVGElement | null) => void);
    show(toRefocus: Element | undefined): void;
    cancelRefocus(): void;
    hide(): void;
}
