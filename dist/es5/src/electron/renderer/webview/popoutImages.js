"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popoutImage = void 0;
var styles_1 = require("../../common/styles");
var popup_dialog_1 = require("../common/popup-dialog");
function popoutImage(win, element, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    var imgHref = element.src;
    if (!imgHref) {
        return;
    }
    var onclickhandler = "onclick=\"javascript: " +
        "if (window.event.shiftKey || this.r2ImgScale &amp;&amp; this.r2ImgScale !== 1) " +
        "{ this.r2ImgScale = !window.event.shiftKey ? " +
        "1 : (this.r2ImgScale ? (this.r2ImgScale + 0.5) : 1.5);" +
        "this.style.setProperty('margin-top', '0', 'important'); this.style.setProperty('margin-left', '0', 'important'); this.style.transform='scale('+this.r2ImgScale+')'; } " +
        "else if (window.readiumClosePopupDialogs) { window.readiumClosePopupDialogs(); } " +
        "window.event.preventDefault(); window.event.stopPropagation(); return false; \"";
    var htmltxt = "\n<div\n    class=\"".concat(styles_1.POPOUTIMAGE_CONTAINER_CLASS, " ").concat(styles_1.CSS_CLASS_NO_FOCUS_OUTLINE, "\"\n    tabindex=\"0\"\n    autofocus=\"autofocus\"\n    onclick=\"javascript: window.readiumClosePopupDialogs &amp;&amp; window.readiumClosePopupDialogs()\"\n    >\n    <img\n        ").concat(onclickhandler, "\n        src=\"").concat(imgHref, "\"\n    />\n</div>");
    var val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
    if (!win.readiumClosePopupDialogs) {
        win.readiumClosePopupDialogs = function () { (0, popup_dialog_1.closePopupDialogs)(win.document); };
    }
    function onDialogClosed(el) {
        if (el) {
            focusScrollRaw(el, true, true, undefined);
        }
        else {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
        }
        setTimeout(function () {
            pop.dialog.remove();
        }, 50);
    }
    var pop = new popup_dialog_1.PopupDialog(element.ownerDocument, htmltxt, onDialogClosed, styles_1.TTS_POPUP_DIALOG_CLASS, false);
    pop.show(element);
}
exports.popoutImage = popoutImage;
//# sourceMappingURL=popoutImages.js.map