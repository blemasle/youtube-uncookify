let browser = chrome && chrome.runtime ?
    chrome :
    browser;

// Chromium equivalent of Firefox page_action.show_matches. Requires declarativeContent permission
if(chrome && chrome.declarativeContent) {
    chrome.runtime.onInstalled.addListener(function() {
        chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
            chrome.declarativeContent.onPageChanged.addRules([
                {
                    conditions: [
                        new chrome.declarativeContent.PageStateMatcher({
                            pageUrl: { urlMatches: '(https://www\.youtube\.com/watch|https://www\.youtube-nocookie\.com/embed/)' }
                        })
                    ],
                    actions: [ new chrome.declarativeContent.ShowPageAction() ]
                },
            ])
        });
    })
}

/*
Switch a YouTube url between watch and youtube-nocookie.
*/
function switchYouTubeUrl(url) {
    const reWatch = /.*youtube.com\/watch\?v=.*/;
    const reNocookie = /.*youtube-nocookie.com\/embed\/(?<id>[^?]*)/;

    if (url.match(reWatch)) {
        let id = new URL(url).searchParams.get('v');
        return `https://www.youtube-nocookie.com/embed/${id}`;
    }

    let noCookieMatch = url.match(reNocookie);
    if (noCookieMatch) {
        return `https://www.youtube.com/watch?v=${noCookieMatch[1]}`;
    }

    return null;
}

/*
Navigate between YouTube regular and nocookie website in either the current tab or a new tab.
*/
function switchYouTubeWebsite(currentTab, openInNewTab, url = currentTab.url) {
    const targetUrl = switchYouTubeUrl(url);

    if(!targetUrl) return;

    if(openInNewTab) {
        browser.tabs.create({
            url: targetUrl,
            openerTabId: currentTab.id,
            index: currentTab.index + 1
        });
    }
    else {
        browser.tabs.update({ url: targetUrl });
    }
}

browser.pageAction.onClicked.addListener((currentTab, data) => {
    let openInNewTab = data?.button == 1; // data in undefined on chromium based browsers.
    switchYouTubeWebsite(currentTab, openInNewTab)
});

browser.contextMenus.create({
    id: 'youtube-uncookify',
    contexts: [ 'link' ],
    title: 'Open Link in New YouTube no Cookie Tab',
    targetUrlPatterns: [ 'https://www.youtube.com/watch?v=*' ]
});


browser.contextMenus.onClicked.addListener((info, tab) => {
    if(info.menuItemId !== 'youtube-uncookify') return;
    
    let openInNewTab = true;
    switchYouTubeWebsite(tab, openInNewTab, info.linkUrl);    
});