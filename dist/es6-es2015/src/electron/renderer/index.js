"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debounce = require("debounce");
const URI = require("urijs");
const UrlUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/http/UrlUtils");
const electron_1 = require("electron");
const electron_2 = require("electron");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const url_params_1 = require("./common/url-params");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function isFixedLayout(link) {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }
    const isFXL = _publication &&
        _publication.Metadata &&
        _publication.Metadata.Rendition &&
        _publication.Metadata.Rendition.Layout === "fixed";
    return isFXL;
}
function __computeReadiumCssJsonMessage(link) {
    if (isFixedLayout(link)) {
        const jsonMsg = { injectCSS: "rollback", setCSS: "rollback", isFixedLayout: true };
        return JSON.stringify(jsonMsg, null, 0);
    }
    if (!_computeReadiumCssJsonMessage) {
        return "{}";
    }
    const readiumCssJsonMessage = _computeReadiumCssJsonMessage();
    return readiumCssJsonMessage;
}
let _computeReadiumCssJsonMessage = () => {
    return "{}";
};
function setReadiumCssJsonGetter(func) {
    _computeReadiumCssJsonMessage = func;
}
exports.setReadiumCssJsonGetter = setReadiumCssJsonGetter;
let _saveReadingLocation = (_docHref, _cssSelector) => {
    return;
};
function setReadingLocationSaver(func) {
    _saveReadingLocation = func;
}
exports.setReadingLocationSaver = setReadingLocationSaver;
function readiumCssOnOff() {
    const readiumCssJsonMessage1 = __computeReadiumCssJsonMessage(_webview1.READIUM2.link);
    _webview1.send(events_1.R2_EVENT_READIUMCSS, readiumCssJsonMessage1);
    const readiumCssJsonMessage2 = __computeReadiumCssJsonMessage(_webview2.READIUM2.link);
    _webview2.send(events_1.R2_EVENT_READIUMCSS, readiumCssJsonMessage2);
}
exports.readiumCssOnOff = readiumCssOnOff;
let _webview1;
let _webview2;
let _viewHideInterval;
let _publication;
let _publicationJsonUrl;
function handleLink(href, previous, useGoto) {
    if (!_publicationJsonUrl) {
        return;
    }
    const prefix = _publicationJsonUrl.replace("manifest.json", "");
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
    if (IS_DEV) {
        window.READIUM2_PUB = _publication;
        window.READIUM2_PUBURL = _publicationJsonUrl;
    }
    const rootHtmlElement = document.getElementById(rootHtmlElementID);
    if (!rootHtmlElement) {
        console.log("!rootHtmlElement ???");
        return;
    }
    const slidingViewport = document.createElement("div");
    slidingViewport.setAttribute("id", "r2_navigator_sliding_viewport");
    slidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; width: 200%; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    _webview1 = createWebView(preloadScriptPath);
    _webview1.READIUM2 = {
        id: 1,
        link: undefined,
    };
    _webview1.setAttribute("id", "webview1");
    _webview2 = createWebView(preloadScriptPath);
    _webview2.READIUM2 = {
        id: 2,
        link: undefined,
    };
    _webview2.setAttribute("id", "webview2");
    slidingViewport.appendChild(_webview1);
    slidingViewport.appendChild(_webview2);
    rootHtmlElement.appendChild(slidingViewport);
    const isRTL = _publication.Metadata &&
        _publication.Metadata.Direction &&
        _publication.Metadata.Direction.toLowerCase() === "rtl";
    if (isRTL) {
        _webview1.classList.add("posRight");
        _webview1.style.left = "50%";
    }
    else {
        _webview2.classList.add("posRight");
        _webview2.style.left = "50%";
    }
    let linkToLoad;
    let linkToLoadGoto;
    if (pubDocHrefToLoad) {
        if (_publication.Spine && _publication.Spine.length) {
            linkToLoad = _publication.Spine.find((spineLink) => {
                return spineLink.Href === pubDocHrefToLoad;
            });
            if (linkToLoad && pubDocSelectorToGoto) {
                linkToLoadGoto = pubDocSelectorToGoto;
            }
        }
        if (!linkToLoad &&
            _publication.Resources && _publication.Resources.length) {
            linkToLoad = _publication.Resources.find((resLink) => {
                return resLink.Href === pubDocHrefToLoad;
            });
            if (linkToLoad && pubDocSelectorToGoto) {
                linkToLoadGoto = pubDocSelectorToGoto;
            }
        }
    }
    if (!linkToLoad) {
        if (_publication.Spine && _publication.Spine.length) {
            const firstLinear = _publication.Spine[0];
            if (firstLinear) {
                linkToLoad = firstLinear;
            }
        }
    }
    setTimeout(() => {
        if (linkToLoad) {
            const hrefToLoad = _publicationJsonUrl + "/../" + linkToLoad.Href +
                (linkToLoadGoto ? ("?" + url_params_1.URL_PARAM_GOTO + "=" + UrlUtils_1.encodeURIComponent_RFC3986(linkToLoadGoto)) : "");
            handleLink(hrefToLoad, undefined, true);
        }
    }, 100);
}
exports.installNavigatorDOM = installNavigatorDOM;
function navLeftOrRight(left) {
    if (!_publication) {
        return;
    }
    const activeWebView = getActiveWebView();
    const isRTL = _publication.Metadata &&
        _publication.Metadata.Direction &&
        _publication.Metadata.Direction.toLowerCase() === "rtl";
    const goPREVIOUS = left ? !isRTL : isRTL;
    const messageJson = {
        direction: isRTL ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    const messageStr = JSON.stringify(messageJson);
    activeWebView.send(events_1.R2_EVENT_PAGE_TURN, messageStr);
}
exports.navLeftOrRight = navLeftOrRight;
const getActiveWebView = () => {
    let activeWebView;
    const slidingViewport = document.getElementById("r2_navigator_sliding_viewport");
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
    const linkUri = new URI(hrefFull);
    linkUri.search((data) => {
        if (typeof previous === "undefined") {
            data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
        }
        else {
            data[url_params_1.URL_PARAM_PREVIOUS] = previous ? "true" : "false";
        }
        if (!useGoto) {
            data[url_params_1.URL_PARAM_GOTO] = undefined;
        }
    });
    if (useGoto) {
        linkUri.hash("").normalizeHash();
    }
    const pubUri = new URI(_publicationJsonUrl);
    const pathPrefix = pubUri.path().replace("manifest.json", "");
    const linkPath = decodeURIComponent(linkUri.normalizePath().path().replace(pathPrefix, ""));
    let pubLink = _publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    });
    if (!pubLink) {
        pubLink = _publication.Resources.find((spineLink) => {
            return spineLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        console.log("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return;
    }
    const rcssJsonstr = __computeReadiumCssJsonMessage(pubLink);
    const rcssJsonstrBase64 = window.btoa(rcssJsonstr);
    linkUri.search((data) => {
        data.readiumcss = rcssJsonstrBase64;
    });
    const activeWebView = getActiveWebView();
    const wv1AlreadyLoaded = _webview1.READIUM2.link === pubLink;
    const wv2AlreadyLoaded = _webview2.READIUM2.link === pubLink;
    if (wv1AlreadyLoaded || wv2AlreadyLoaded) {
        const msgJson = {
            goto: useGoto ? linkUri.search(url_params_1.URL_PARAM_GOTO) : undefined,
            hash: useGoto ? undefined : linkUri.fragment(),
            previous,
        };
        const msgStr = JSON.stringify(msgJson);
        console.log("ALREADY LOADED: " + pubLink.Href);
        console.log(msgStr);
        const webviewToReuse = wv1AlreadyLoaded ? _webview1 : _webview2;
        if (webviewToReuse !== activeWebView) {
            console.log("INTO VIEW ...");
            const slidingView = document.getElementById("r2_navigator_sliding_viewport");
            if (slidingView) {
                let animate = true;
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
    if (!isFixedLayout(pubLink)) {
        const hidePanel = document.getElementById("r2_navigator_reader_chrome_HIDE");
        if (hidePanel) {
            hidePanel.style.display = "block";
            _viewHideInterval = setInterval(() => {
                unhideWebView(true);
            }, 5000);
        }
    }
    const uriStr = linkUri.toString();
    console.log("####### >>> ---");
    console.log(activeWebView.READIUM2.id);
    console.log(pubLink.Href);
    console.log(linkUri.hash());
    console.log(linkUri.search(true)[url_params_1.URL_PARAM_GOTO]);
    console.log(linkUri.search(true)[url_params_1.URL_PARAM_PREVIOUS]);
    console.log("####### >>> ---");
    activeWebView.READIUM2.link = pubLink;
    activeWebView.setAttribute("src", uriStr);
}
function createWebView(preloadScriptPath) {
    const wv = document.createElement("webview");
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
    setTimeout(() => {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", () => {
        wv.clearHistory();
    });
    wv.addEventListener("ipc-message", (event) => {
        const webview = event.currentTarget;
        const activeWebView = getActiveWebView();
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
            const cssSelector = event.args[0];
            if (webview.READIUM2.link && _saveReadingLocation) {
                _saveReadingLocation(webview.READIUM2.link.Href, cssSelector);
            }
        }
        else if (event.channel === events_1.R2_EVENT_PAGE_TURN_RES) {
            if (!_publication) {
                return;
            }
            const messageString = event.args[0];
            const messageJson = JSON.parse(messageString);
            const goPREVIOUS = messageJson.go === "PREVIOUS";
            if (!webview.READIUM2.link) {
                console.log("WEBVIEW READIUM2_LINK ??!!");
                return;
            }
            let nextOrPreviousSpineItem;
            for (let i = 0; i < _publication.Spine.length; i++) {
                if (_publication.Spine[i] === webview.READIUM2.link) {
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
                const linkHref = _publicationJsonUrl + "/../" + nextOrPreviousSpineItem.Href;
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
const adjustResize = (webview) => {
    const width = webview.clientWidth;
    const height = webview.clientHeight;
    const wc = webview.getWebContents();
    if (wc && width && height) {
        wc.setSize({
            normal: {
                height,
                width,
            },
        });
    }
};
const onResizeDebounced = debounce(() => {
    adjustResize(_webview1);
    adjustResize(_webview2);
    setTimeout(() => {
        unhideWebView(false);
    }, 1000);
}, 200);
window.addEventListener("resize", () => {
    if (!isFixedLayout(_webview1.READIUM2.link)) {
        const hidePanel = document.getElementById("r2_navigator_reader_chrome_HIDE");
        if (hidePanel && hidePanel.style.display !== "block") {
            hidePanel.style.display = "block";
            _viewHideInterval = setInterval(() => {
                unhideWebView(true);
            }, 5000);
        }
    }
    onResizeDebounced();
});
electron_2.ipcRenderer.on(events_1.R2_EVENT_LINK, (_event, href) => {
    console.log("R2_EVENT_LINK");
    console.log(href);
    handleLink(href, undefined, false);
});
const unhideWebView = (forced) => {
    if (_viewHideInterval) {
        clearInterval(_viewHideInterval);
        _viewHideInterval = undefined;
    }
    const hidePanel = document.getElementById("r2_navigator_reader_chrome_HIDE");
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