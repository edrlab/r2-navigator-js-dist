"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const styles_1 = require("../../common/styles");
const popup_dialog_1 = require("../common/popup-dialog");
function popupFootNote(element, focusScrollRaw, href) {
    const documant = element.ownerDocument;
    if (!documant.documentElement ||
        documant.documentElement.classList.contains(styles_1.ROOT_CLASS_NO_FOOTNOTES)) {
        return false;
    }
    let epubType = element.getAttribute("epub:type");
    if (!epubType) {
        epubType = element.getAttributeNS("http://www.idpf.org/2007/ops", "type");
    }
    if (!epubType) {
        return false;
    }
    const isNoteref = epubType.indexOf("noteref") >= 0;
    if (!isNoteref) {
        return false;
    }
    const url = new URL(href);
    if (!url.hash) {
        return false;
    }
    const targetElement = documant.querySelector(url.hash);
    if (!targetElement) {
        return false;
    }
    const ID_PREFIX = "r2-footnote-popup-dialog-for_";
    const id = ID_PREFIX + targetElement.id;
    let outerHTML = targetElement.outerHTML;
    if (!outerHTML) {
        return false;
    }
    outerHTML = outerHTML.replace(/xmlns=["']http:\/\/www.w3.org\/1999\/xhtml["']/g, " ");
    outerHTML = outerHTML.replace(/xmlns:epub=["']http:\/\/www.idpf.org\/2007\/ops["']/g, " ");
    outerHTML = outerHTML.replace(/epub:type=["'][^"']+["']/g, " ");
    outerHTML = outerHTML.replace(/<script>.+<\/script>/g, " ");
    const ID_PREFIX_ = "r2-footnote-content-of_";
    const id_ = ID_PREFIX_ + targetElement.id;
    outerHTML = outerHTML.replace(/id=["'][^"']+["']/, `id="${id_}"`);
    outerHTML = `<div class="${styles_1.FOOTNOTES_CONTAINER_CLASS} ${styles_1.CSS_CLASS_NO_FOCUS_OUTLINE}"
        tabindex="0" autofocus="autofocus">${outerHTML}</div>`;
    function onDialogClosed(el) {
        if (el) {
            focusScrollRaw(el, true);
        }
        setTimeout(() => {
            pop.dialog.remove();
        }, 50);
    }
    const pop = new popup_dialog_1.PopupDialog(documant, outerHTML, id, onDialogClosed);
    pop.show(element);
    return true;
}
exports.popupFootNote = popupFootNote;
//# sourceMappingURL=popupFootNotes.js.map