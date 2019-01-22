"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var styles_1 = require("../../common/styles");
var popup_dialog_1 = require("../common/popup-dialog");
function popupFootNote(element, focusScrollRaw, href) {
    var documant = element.ownerDocument;
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
    var url = new URL(href);
    if (!url.hash) {
        return false;
    }
    var targetElement = documant.querySelector(url.hash);
    if (!targetElement) {
        return false;
    }
    var ID_PREFIX = "r2-footnote-popup-dialog-for_";
    var id = ID_PREFIX + targetElement.id;
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
    htmltxt = "<div id=\"" + id_ + "\" class=\"" + styles_1.FOOTNOTES_CONTAINER_CLASS + " " + styles_1.CSS_CLASS_NO_FOCUS_OUTLINE + "\" tabindex=\"0\" autofocus=\"autofocus\">" + htmltxt + "</div>";
    function onDialogClosed(el) {
        if (el) {
            focusScrollRaw(el, true);
        }
        setTimeout(function () {
            pop.dialog.remove();
        }, 50);
    }
    var pop = new popup_dialog_1.PopupDialog(documant, htmltxt, id, onDialogClosed);
    pop.show(element);
    return true;
}
exports.popupFootNote = popupFootNote;
//# sourceMappingURL=popupFootNotes.js.map