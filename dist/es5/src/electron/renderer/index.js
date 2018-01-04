"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debounce = require("debounce");
var URI = require("urijs");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var electron_1 = require("electron");
var electron_2 = require("electron");
var events_1 = require("../common/events");
var sessions_1 = require("../common/sessions");
var _computeReadiumCssJsonMessage = function () {
    return "";
};
function setReadiumCssJsonGetter(func) {
    _computeReadiumCssJsonMessage = func;
}
exports.setReadiumCssJsonGetter = setReadiumCssJsonGetter;
var _saveReadingLocation = function (_docHref, _cssSelector) {
    return;
};
function setReadingLocationSaver(func) {
    _saveReadingLocation = func;
}
exports.setReadingLocationSaver = setReadingLocationSaver;
function readiumCssOnOff() {
    if (!_computeReadiumCssJsonMessage) {
        return;
    }
    var readiumCssJsonMessage = _computeReadiumCssJsonMessage();
    _webview1.send(events_1.R2_EVENT_READIUMCSS, readiumCssJsonMessage);
    _webview2.send(events_1.R2_EVENT_READIUMCSS, readiumCssJsonMessage);
}
exports.readiumCssOnOff = readiumCssOnOff;
var _webview1;
var _webview2;
var _viewHideInterval;
var _publication;
var _publicationJsonUrl;
function handleLink(href, previous, useGoto) {
    if (!_publicationJsonUrl) {
        return;
    }
    var prefix = _publicationJsonUrl.replace("manifest.json", "");
    if (href.startsWith(prefix)) {
        loadLink(href, previous, useGoto);
    }
    else {
        electron_1.shell.openExternal(href);
    }
}
exports.handleLink = handleLink;
function installNavigatorDOM(publication, publicationJsonUrl, rootHtmlElementID, preloadScriptPath, pubDocHrefToLoad, pubDocSelectorToGoto) {
    _publication = publication;
    _publicationJsonUrl = publicationJsonUrl;
    var rootHtmlElement = document.getElementById(rootHtmlElementID);
    if (!rootHtmlElement) {
        console.log("!rootHtmlElement ???");
        return;
    }
    var slidingViewport = document.createElement("div");
    slidingViewport.setAttribute("id", "r2_navigator_sliding_viewport");
    slidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; width: 200%; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    _webview1 = createWebView(preloadScriptPath);
    _webview1.readiumwebviewid = 1;
    _webview1.setAttribute("id", "webview1");
    _webview2 = createWebView(preloadScriptPath);
    _webview2.readiumwebviewid = 2;
    _webview2.setAttribute("id", "webview2");
    slidingViewport.appendChild(_webview1);
    slidingViewport.appendChild(_webview2);
    rootHtmlElement.appendChild(slidingViewport);
    var isRTL = _publication.Metadata &&
        _publication.Metadata.Direction &&
        _publication.Metadata.Direction.toLowerCase() === "rtl";
    if (isRTL) {
        _webview1.classList.add("posRight");
        _webview1.style.left = "50%";
    }
    else {
        _webview2.classList.add("posRight");
        _webview1.style.left = "50%";
    }
    var linkToLoad;
    var linkToLoadGoto;
    if (pubDocHrefToLoad) {
        if (_publication.Spine && _publication.Spine.length) {
            linkToLoad = _publication.Spine.find(function (spineLink) {
                return spineLink.Href === pubDocHrefToLoad;
            });
            if (linkToLoad && pubDocSelectorToGoto) {
                linkToLoadGoto = pubDocSelectorToGoto;
            }
        }
        if (!linkToLoad &&
            _publication.Resources && _publication.Resources.length) {
            linkToLoad = _publication.Resources.find(function (resLink) {
                return resLink.Href === pubDocHrefToLoad;
            });
            if (linkToLoad && pubDocSelectorToGoto) {
                linkToLoadGoto = pubDocSelectorToGoto;
            }
        }
    }
    if (!linkToLoad) {
        if (_publication.Spine && _publication.Spine.length) {
            var firstLinear = _publication.Spine[0];
            if (firstLinear) {
                linkToLoad = firstLinear;
            }
        }
    }
    setTimeout(function () {
        if (linkToLoad) {
            var hrefToLoad = _publicationJsonUrl + "/../" + linkToLoad.Href +
                (linkToLoadGoto ? ("?readiumgoto=" + UrlUtils_1.encodeURIComponent_RFC3986(linkToLoadGoto)) : "");
            handleLink(hrefToLoad, undefined, true);
        }
    }, 100);
}
exports.installNavigatorDOM = installNavigatorDOM;
function navLeftOrRight(left) {
    if (!_publication) {
        return;
    }
    var activeWebView = getActiveWebView();
    var isRTL = _publication.Metadata &&
        _publication.Metadata.Direction &&
        _publication.Metadata.Direction.toLowerCase() === "rtl";
    var goPREVIOUS = left ? !isRTL : isRTL;
    var messageJson = {
        direction: isRTL ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    var messageStr = JSON.stringify(messageJson);
    activeWebView.send(events_1.R2_EVENT_PAGE_TURN, messageStr);
}
exports.navLeftOrRight = navLeftOrRight;
var getActiveWebView = function () {
    var activeWebView;
    var slidingViewport = document.getElementById("r2_navigator_sliding_viewport");
    if (!slidingViewport) {
        return document.body;
    }
    if (slidingViewport.classList.contains("shiftedLeft")) {
        if (_webview1.classList.contains("posRight")) {
            activeWebView = _webview1;
        }
        else {
            activeWebView = _webview2;
        }
    }
    else {
        if (_webview2.classList.contains("posRight")) {
            activeWebView = _webview1;
        }
        else {
            activeWebView = _webview2;
        }
    }
    return activeWebView;
};
function loadLink(hrefFull, previous, useGoto) {
    if (!_publication || !_publicationJsonUrl) {
        return;
    }
    var rcssJsonstr = _computeReadiumCssJsonMessage ? _computeReadiumCssJsonMessage() : "{}";
    var rcssJsonstrBase64 = window.btoa(rcssJsonstr);
    var linkUri = new URI(hrefFull);
    linkUri.search(function (data) {
        if (typeof previous === "undefined") {
            data.readiumprevious = undefined;
        }
        else {
            data.readiumprevious = previous ? "true" : "false";
        }
        if (!useGoto) {
            data.readiumgoto = undefined;
        }
        data.readiumcss = rcssJsonstrBase64;
    });
    if (useGoto) {
        linkUri.hash("").normalizeHash();
    }
    var pubUri = new URI(_publicationJsonUrl);
    var pathPrefix = pubUri.path().replace("manifest.json", "");
    var linkPath = decodeURIComponent(linkUri.normalizePath().path().replace(pathPrefix, ""));
    var pubLink = _publication.Spine.find(function (spineLink) {
        return spineLink.Href === linkPath;
    });
    if (!pubLink) {
        pubLink = _publication.Resources.find(function (spineLink) {
            return spineLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        console.log("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return;
    }
    var activeWebView = getActiveWebView();
    var wv1AlreadyLoaded = _webview1.READIUM2_LINK === pubLink;
    var wv2AlreadyLoaded = _webview2.READIUM2_LINK === pubLink;
    if (wv1AlreadyLoaded || wv2AlreadyLoaded) {
        var msgJson = {
            goto: useGoto ? linkUri.search("readiumgoto") : undefined,
            hash: useGoto ? undefined : linkUri.fragment(),
            previous: previous,
        };
        var msgStr = JSON.stringify(msgJson);
        console.log("ALREADY LOADED: " + pubLink.Href);
        console.log(msgStr);
        var webviewToReuse = wv1AlreadyLoaded ? _webview1 : _webview2;
        if (webviewToReuse !== activeWebView) {
            console.log("INTO VIEW ...");
            var slidingView = document.getElementById("r2_navigator_sliding_viewport");
            if (slidingView) {
                var animate = true;
                if (msgJson.goto || msgJson.hash) {
                    console.log("DISABLE ANIM");
                    animate = false;
                }
                else if (previous) {
                    if (!slidingView.classList.contains("shiftedLeft")) {
                        console.log("DISABLE ANIM");
                        animate = false;
                    }
                }
                if (animate) {
                    if (!slidingView.classList.contains("animated")) {
                        slidingView.classList.add("animated");
                        slidingView.style.transition = "left 500ms ease-in-out";
                    }
                }
                else {
                    if (slidingView.classList.contains("animated")) {
                        slidingView.classList.remove("animated");
                        slidingView.style.transition = "none";
                    }
                }
                if (slidingView.classList.contains("shiftedLeft")) {
                    slidingView.classList.remove("shiftedLeft");
                    slidingView.style.left = "0";
                }
                else {
                    slidingView.classList.add("shiftedLeft");
                    slidingView.style.left = "-100%";
                }
            }
        }
        webviewToReuse.send(events_1.R2_EVENT_SCROLLTO, msgStr);
        return;
    }
    var hidePanel = document.getElementById("r2_navigator_reader_chrome_HIDE");
    if (hidePanel) {
        hidePanel.style.display = "block";
        _viewHideInterval = setInterval(function () {
            unhideWebView(true);
        }, 5000);
    }
    var uriStr = linkUri.toString();
    console.log("####### >>> ---");
    console.log(activeWebView.readiumwebviewid);
    console.log(pubLink.Href);
    console.log(linkUri.hash());
    console.log(linkUri.search(true)["readiumgoto"]);
    console.log(linkUri.search(true)["readiumprevious"]);
    console.log("####### >>> ---");
    activeWebView.READIUM2_LINK = pubLink;
    activeWebView.setAttribute("src", uriStr);
    var enableOffScreenRenderPreload = false;
    if (enableOffScreenRenderPreload) {
        setTimeout(function () {
            if (!_publication || !pubLink) {
                return;
            }
            var otherWebview = activeWebView === _webview2 ? _webview1 : _webview2;
            var index = _publication.Spine.indexOf(pubLink);
            if (index >= 0 &&
                previous && (index - 1) >= 0 ||
                !previous && (index + 1) < _publication.Spine.length) {
                var nextPubLink = _publication.Spine[previous ? (index - 1) : (index + 1)];
                if (otherWebview.READIUM2_LINK !== nextPubLink) {
                    var linkUriNext = new URI(_publicationJsonUrl + "/../" + nextPubLink.Href);
                    linkUriNext.normalizePath();
                    linkUriNext.search(function (data) {
                        data.readiumcss = rcssJsonstrBase64;
                    });
                    var uriStrNext = linkUriNext.toString();
                    console.log("####### ======");
                    console.log(otherWebview.readiumwebviewid);
                    console.log(nextPubLink.Href);
                    console.log(linkUriNext.hash());
                    console.log(linkUriNext.search(true)["readiumgoto"]);
                    console.log(linkUriNext.search(true)["readiumprevious"]);
                    console.log("####### ======");
                    otherWebview.READIUM2_LINK = nextPubLink;
                    otherWebview.setAttribute("src", uriStrNext);
                }
            }
        }, 300);
    }
}
function createWebView(preloadScriptPath) {
    var wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    if (_publicationJsonUrl) {
        wv.setAttribute("httpreferrer", _publicationJsonUrl);
    }
    wv.setAttribute("style", "display: flex; margin: 0; padding: 0; box-sizing: border-box; " +
        "position: absolute; left: 0; width: 50%; bottom: 0; top: 0;");
    wv.setAttribute("preload", preloadScriptPath);
    wv.setAttribute("disableguestresize", "");
    setTimeout(function () {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", function () {
        wv.clearHistory();
    });
    wv.addEventListener("ipc-message", function (event) {
        var webview = event.currentTarget;
        var activeWebView = getActiveWebView();
        if (webview !== activeWebView) {
            return;
        }
        if (event.channel === events_1.R2_EVENT_LINK) {
            handleLink(event.args[0], undefined, false);
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_READY) {
            unhideWebView(false);
        }
        else if (event.channel === events_1.R2_EVENT_READING_LOCATION) {
            var cssSelector = event.args[0];
            if (webview.READIUM2_LINK && _saveReadingLocation) {
                _saveReadingLocation(webview.READIUM2_LINK.Href, cssSelector);
            }
        }
        else if (event.channel === events_1.R2_EVENT_PAGE_TURN_RES) {
            if (!_publication) {
                return;
            }
            var messageString = event.args[0];
            var messageJson = JSON.parse(messageString);
            var goPREVIOUS = messageJson.go === "PREVIOUS";
            if (!webview.READIUM2_LINK) {
                console.log("WEBVIEW READIUM2_LINK ??!!");
                return;
            }
            var nextOrPreviousSpineItem = void 0;
            for (var i = 0; i < _publication.Spine.length; i++) {
                if (_publication.Spine[i] === webview.READIUM2_LINK) {
                    if (goPREVIOUS && (i - 1) >= 0) {
                        nextOrPreviousSpineItem = _publication.Spine[i - 1];
                    }
                    else if (!goPREVIOUS && (i + 1) < _publication.Spine.length) {
                        nextOrPreviousSpineItem = _publication.Spine[i + 1];
                    }
                    break;
                }
            }
            if (!nextOrPreviousSpineItem) {
                return;
            }
            if (_publicationJsonUrl) {
                var linkHref = _publicationJsonUrl + "/../" + nextOrPreviousSpineItem.Href;
                handleLink(linkHref, goPREVIOUS, false);
            }
        }
        else {
            console.log("webview1 ipc-message");
            console.log(event.channel);
        }
    });
    return wv;
}
var adjustResize = function (webview) {
    var width = webview.clientWidth;
    var height = webview.clientHeight;
    var wc = webview.getWebContents();
    if (wc && width && height) {
        wc.setSize({
            normal: {
                height: height,
                width: width,
            },
        });
    }
};
var onResizeDebounced = debounce(function () {
    adjustResize(_webview1);
    adjustResize(_webview2);
    setTimeout(function () {
        unhideWebView(false);
    }, 1000);
}, 200);
window.addEventListener("resize", function () {
    var hidePanel = document.getElementById("r2_navigator_reader_chrome_HIDE");
    if (hidePanel && hidePanel.style.display !== "block") {
        hidePanel.style.display = "block";
        _viewHideInterval = setInterval(function () {
            unhideWebView(true);
        }, 5000);
    }
    onResizeDebounced();
});
electron_2.ipcRenderer.on(events_1.R2_EVENT_LINK, function (_event, href) {
    console.log("R2_EVENT_LINK");
    console.log(href);
    handleLink(href, undefined, false);
});
var unhideWebView = function (forced) {
    if (_viewHideInterval) {
        clearInterval(_viewHideInterval);
        _viewHideInterval = undefined;
    }
    var hidePanel = document.getElementById("r2_navigator_reader_chrome_HIDE");
    if (!hidePanel || hidePanel.style.display === "none") {
        return;
    }
    if (forced) {
        console.log("unhideWebView FORCED");
    }
    if (hidePanel) {
        hidePanel.style.display = "none";
    }
};
//# sourceMappingURL=index.js.map