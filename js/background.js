let window;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "arenaSnip",
        title: "Are.na Snip",
        contexts: ['all']
    });

});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    window = tab.windowId
    switch (info.menuItemId) {
        case 'arenaSnip':
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["js/snip.js"]
            });
            break;
        default:
            console.log('Invalid context menu item')
            break;
    }
});

chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
    const { id: windowId } = await chrome.windows.getCurrent();
    const lastFocusedWindow = await chrome.windows.getLastFocused();
    if (lastFocusedWindow.id)
        await chrome.windows.update(lastFocusedWindow.id, {
            focused: true,
        });
    chrome.action.openPopup();
    if (req.message === "capture") {
        chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 100 }, function (dataUrl) {
            sendResponse({ imgSrc: dataUrl });
        });
    }
    return true;
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.message === "crop") {
        screenshotUrl = req.img
    }
    return true;
});

