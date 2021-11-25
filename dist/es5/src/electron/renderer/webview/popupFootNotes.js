"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popupFootNote = void 0;
var styles_1 = require("../../common/styles");
var popup_dialog_1 = require("../common/popup-dialog");
function popupFootNote(element, focusScrollRaw, href, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    var url = new URL(href);
    if (!url.hash) {
        return false;
    }
    var documant = element.ownerDocument;
    var hrefSelf = documant.location.href;
    var urlSelf = new URL(hrefSelf);
    if (urlSelf.protocol !== url.protocol ||
        urlSelf.origin !== url.origin ||
        urlSelf.pathname !== url.pathname) {
        return false;
    }
    if (!documant.documentElement ||
        documant.documentElement.classList.contains(styles_1.ROOT_CLASS_NO_FOOTNOTES)) {
        return false;
    }
    var epubType = element.getAttribute("epub:type");
    if (!epubType) {
        epubType = element.getAttributeNS("http://www.idpf.org/2007/ops", "type");
    }
    if (!epubType) {
        return false;
    }
    var isNoteref = epubType.indexOf("noteref") >= 0;
    if (!isNoteref) {
        return false;
    }
    var targetElement = documant.querySelector(url.hash);
    if (!targetElement) {
        return false;
    }
    var htmltxt = targetElement.innerHTML;
    if (!htmltxt) {
        return false;
    }
    htmltxt = htmltxt.replace(/xmlns=["']http:\/\/www.w3.org\/1999\/xhtml["']/g, " ");
    htmltxt = htmltxt.replace(/xmlns:epub=["']http:\/\/www.idpf.org\/2007\/ops["']/g, " ");
    htmltxt = htmltxt.replace(/<script>.+<\/script>/g, " ");
    var ID_PREFIX_ = "r2-footnote-for_";
    var id_ = ID_PREFIX_ + targetElement.id;
    htmltxt = htmltxt.replace(/id=["']([^"']+)["']/g, "idvoid=\"$1\"");
    htmltxt = "<div id=\"".concat(id_, "\" class=\"").concat(styles_1.FOOTNOTES_CONTAINER_CLASS, " ").concat(styles_1.CSS_CLASS_NO_FOCUS_OUTLINE, "\" tabindex=\"0\" autofocus=\"autofocus\">").concat(htmltxt, "</div>");
    var val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
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
    var pop = new popup_dialog_1.PopupDialog(documant, htmltxt, onDialogClosed);
    pop.show(element);
    return true;
}
exports.popupFootNote = popupFootNote;
//# sourceMappingURL=popupFootNotes.js.map