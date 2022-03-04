"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popupFootNote = void 0;
var tslib_1 = require("tslib");
var path = require("path");
var styles_1 = require("../../common/styles");
var popup_dialog_1 = require("../common/popup-dialog");
function popupFootNote(element, focusScrollRaw, href, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
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
        var documant, epubType, isNoteref, url, hrefSelf, urlSelf, res, txt, domparser, aNodeList, i, aNode, href_1, from, too, relFromMainToNotes, relPath, e_1, targetElement, htmltxt, ID_PREFIX_, id_, val, pop;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    documant = element.ownerDocument;
                    if (!documant.documentElement ||
                        documant.documentElement.classList.contains(styles_1.ROOT_CLASS_NO_FOOTNOTES)) {
                        return [2, false];
                    }
                    epubType = element.getAttribute("epub:type");
                    if (!epubType) {
                        epubType = element.getAttributeNS("http://www.idpf.org/2007/ops", "type");
                    }
                    if (!epubType) {
                        return [2, false];
                    }
                    isNoteref = epubType.indexOf("noteref") >= 0;
                    if (!isNoteref) {
                        return [2, false];
                    }
                    url = new URL(href);
                    if (!url.hash) {
                        return [2, false];
                    }
                    hrefSelf = documant.location.href;
                    urlSelf = new URL(hrefSelf);
                    if (urlSelf.protocol !== url.protocol ||
                        urlSelf.origin !== url.origin) {
                        return [2, false];
                    }
                    if (!(urlSelf.pathname !== url.pathname)) return [3, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4, fetch(href)];
                case 2:
                    res = _a.sent();
                    return [4, res.text()];
                case 3:
                    txt = _a.sent();
                    domparser = new DOMParser();
                    documant = domparser.parseFromString(txt, "application/xhtml+xml");
                    aNodeList = documant.querySelectorAll("a[href]");
                    for (i = 0; i < aNodeList.length; i++) {
                        aNode = aNodeList[i];
                        href_1 = aNode.getAttribute("href");
                        if (!href_1
                            || href_1.startsWith("/")
                            || href_1.startsWith("data:")
                            || /^https?:\/\//.test(href_1)) {
                            continue;
                        }
                        from = path.dirname(urlSelf.pathname).replace(/\\/g, "/");
                        too = url.pathname;
                        relFromMainToNotes = path.relative(from, too).replace(/\\/g, "/");
                        relPath = relFromMainToNotes + "/../" + href_1;
                        console.log(from, too, relFromMainToNotes, relPath);
                        aNode.setAttribute("href", relPath);
                    }
                    return [3, 5];
                case 4:
                    e_1 = _a.sent();
                    console.log("EPUB FOOTNOTE FETCH FAIL: " + href, e_1);
                    return [2, false];
                case 5:
                    targetElement = documant.querySelector(url.hash);
                    if (!targetElement) {
                        return [2, false];
                    }
                    htmltxt = targetElement.innerHTML;
                    if (!htmltxt) {
                        return [2, false];
                    }
                    htmltxt = htmltxt.replace(/xmlns=["']http:\/\/www.w3.org\/1999\/xhtml["']/g, " ");
                    htmltxt = htmltxt.replace(/xmlns:epub=["']http:\/\/www.idpf.org\/2007\/ops["']/g, " ");
                    htmltxt = htmltxt.replace(/<script>.+<\/script>/g, " ");
                    ID_PREFIX_ = "r2-footnote-for_";
                    id_ = ID_PREFIX_ + targetElement.id;
                    htmltxt = htmltxt.replace(/id=["']([^"']+)["']/g, "idvoid=\"$1\"");
                    htmltxt = "<div id=\"".concat(id_, "\" class=\"").concat(styles_1.FOOTNOTES_CONTAINER_CLASS, " ").concat(styles_1.CSS_CLASS_NO_FOCUS_OUTLINE, "\" tabindex=\"0\" autofocus=\"autofocus\">").concat(htmltxt, "</div>");
                    val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
                    pop = new popup_dialog_1.PopupDialog(element.ownerDocument, htmltxt, onDialogClosed);
                    pop.show(element);
                    return [2, true];
            }
        });
    });
}
exports.popupFootNote = popupFootNote;
//# sourceMappingURL=popupFootNotes.js.map