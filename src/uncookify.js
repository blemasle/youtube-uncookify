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
    const toYoutube = id => `https://www.youtube-nocookie.com/embed/${id}`;
    const toYoutubeNoCookie = id => `https://www.youtube.com/watch?v=${id}`;
    const matchers = [
        { re :  /.*youtube\.com\/watch\?v=(?<id>[^&#]+)/, transform: toYoutube },
        { re :  /youtu\.be\/(?<id>[^?#]+)/, transform: toYoutube },
        { re :  /.*youtube-nocookie\.com\/embed\/(?<id>[^?]*)/, transform: toYoutubeNoCookie },
    ]

    for(let i = 0; i < matchers.length; i++)
    {
        let match = url.match(matchers[i].re);
        if(!match) continue;

        return matchers[i].transform(match.groups.id);
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
    targetUrlPatterns: [ '*://www.youtube.com/watch?v=*', '*://youtu.be/*' ]
});


browser.contextMenus.onClicked.addListener((info, tab) => {
    if(info.menuItemId !== 'youtube-uncookify') return;
    
    let openInNewTab = true;
    switchYouTubeWebsite(tab, openInNewTab, info.linkUrl);    
});