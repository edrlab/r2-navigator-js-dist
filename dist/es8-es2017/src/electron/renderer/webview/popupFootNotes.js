"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popupFootNote = void 0;
const path = require("path");
const styles_1 = require("../../common/styles");
const popup_dialog_1 = require("../common/popup-dialog");
async function popupFootNote(element, focusScrollRaw, href, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    let documant = element.ownerDocument;
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
    const url = new URL(href, href.startsWith("#") ? documant.location.href : undefined);
    if (!url.hash) {
        return false;
    }
    const hrefSelf = documant.location.href;
    const urlSelf = new URL(hrefSelf);
    if (urlSelf.protocol !== url.protocol ||
        urlSelf.origin !== url.origin) {
        return false;
    }
    if (urlSelf.pathname !== url.pathname) {
        try {
            const res = await fetch(href);
            const txt = await res.text();
            const domparser = new DOMParser();
            documant = domparser.parseFromString(txt, "application/xhtml+xml");
            const aNodeList = documant.querySelectorAll("a[href]");
            for (let i = 0; i < aNodeList.length; i++) {
                const aNode = aNodeList[i];
                const href = aNode.getAttribute("href");
                if (!href
                    || href.startsWith("/")
                    || href.startsWith("data:")
                    || /^https?:\/\//.test(href)) {
                    continue;
                }
                const from = path.dirname(urlSelf.pathname).replace(/\\/g, "/");
                const too = url.pathname;
                const relFromMainToNotes = path.relative(from, too).replace(/\\/g, "/");
                const relPath = relFromMainToNotes + "/../" + href;
                console.log(from, too, relFromMainToNotes, relPath);
                aNode.setAttribute("href", relPath);
            }
        }
        catch (e) {
            console.log("EPUB FOOTNOTE FETCH FAIL: " + href, e);
            return false;
        }
    }
    const targetElement = documant.querySelector(url.hash);
    if (!targetElement) {
        return false;
    }
    let htmltxt = targetElement.innerHTML;
    if (!htmltxt) {
        return false;
    }
    htmltxt = htmltxt.replace(/xmlns=["']http:\/\/www.w3.org\/1999\/xhtml["']/g, " ");
    htmltxt = htmltxt.replace(/xmlns:epub=["']http:\/\/www.idpf.org\/2007\/ops["']/g, " ");
    htmltxt = htmltxt.replace(/<script>.+<\/script>/g, " ");
    const ID_PREFIX_ = "r2-footnote-for_";
    const id_ = ID_PREFIX_ + targetElement.id;
    htmltxt = htmltxt.replace(/id=["']([^"']+)["']/g, "idvoid=\"$1\"");
    htmltxt = `<div id="${id_}" class="${styles_1.FOOTNOTES_CONTAINER_CLASS} ${styles_1.CSS_CLASS_NO_FOCUS_OUTLINE}" tabindex="0" autofocus="autofocus">${htmltxt}</div>`;
    const val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
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
    const pop = new popup_dialog_1.PopupDialog(element.ownerDocument, htmltxt, onDialogClosed);
    pop.show(element);
    return true;
}
exports.popupFootNote = popupFootNote;
//# sourceMappingURL=popupFootNotes.js.map