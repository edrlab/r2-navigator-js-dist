"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popoutImage = void 0;
const styles_1 = require("../../common/styles");
const popup_dialog_1 = require("../common/popup-dialog");
function popoutImage(win, element, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    const imgHref = element.src;
    if (!imgHref) {
        return;
    }
    const onclickhandler = "onclick=\"javascript: " +
        "if (window.event.shiftKey || this.r2ImgScale &amp;&amp; this.r2ImgScale !== 1) " +
        "{ this.r2ImgScale = !window.event.shiftKey ? " +
        "1 : (this.r2ImgScale ? (this.r2ImgScale + 0.5) : 1.5);" +
        "this.style.setProperty('margin-top', '0', 'important'); this.style.setProperty('margin-left', '0', 'important'); this.style.transform='scale('+this.r2ImgScale+')'; } " +
        "else if (window.readiumClosePopupDialogs) { window.readiumClosePopupDialogs(); } " +
        "window.event.preventDefault(); window.event.stopPropagation(); return false; \"";
    const htmltxt = `
<div
    class="${styles_1.POPOUTIMAGE_CONTAINER_CLASS} ${styles_1.CSS_CLASS_NO_FOCUS_OUTLINE}"
    tabindex="0"
    autofocus="autofocus"
    onclick="javascript: window.readiumClosePopupDialogs &amp;&amp; window.readiumClosePopupDialogs()"
    >
    <img
        ${onclickhandler}
        src="${imgHref}"
    />
</div>`;
    const val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
    if (!win.readiumClosePopupDialogs) {
        win.readiumClosePopupDialogs = () => { (0, popup_dialog_1.closePopupDialogs)(win.document); };
    }
    function onDialogClosed(el) {
        if (el) {
            focusScrollRaw(el, true, true, undefined);
        }
        else {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
        }
        setTimeout(() => {
            pop.dialog.remove();
        }, 50);
    }
    const pop = new popup_dialog_1.PopupDialog(element.ownerDocument, htmltxt, onDialogClosed, styles_1.TTS_POPUP_DIALOG_CLASS, false);
    pop.show(element);
}
exports.popoutImage = popoutImage;
//# sourceMappingURL=popoutImages.js.map