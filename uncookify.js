function getTargetUrl(url) {
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
Switch the current tab between the regular and youtube-cookie websites.
*/
function switchBetweenWebsites(url, newTab, currentTab) {
    const targetUrl = getTargetUrl(url);

    if(!targetUrl) {
        return;
    }

    if(newTab) {
        browser.tabs.create({
            url: targetUrl,
            index: currentTab.index + 1
        });
    }
    else {
        browser.tabs.update({ url: targetUrl });
    }
}

browser.pageAction.onClicked.addListener((currentTab, data) => switchBetweenWebsites(currentTab.url, data.button == 1, currentTab));

browser.contextMenus.create({
    id: "youtube-uncookify",
    contexts: ['link'],
    title: 'Open Link in New YouTube no Cookie Tab',
    targetUrlPatterns: [ "https://www.youtube.com/watch?v=*" ]
});


browser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "youtube-uncookify":
            switchBetweenWebsites(info.linkUrl, true, tab);
            break;
    }
});