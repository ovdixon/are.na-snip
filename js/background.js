let window;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "arenaSnip",
        title: "Snip",
        contexts: ['all']
    });
    chrome.contextMenus.create({
        id: "arenaShot",
        title: "Whole Page",
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
        case 'arenaShot':
            chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 100 }, async function (dataUrl) {
                await chrome.action.openPopup({ windowId: window });
                await chrome.runtime.sendMessage({message: 'crop', img: dataUrl}, (response) => {
                    console.log(response);
                });
            });
            break;
        default:
            console.log('Invalid context menu item')
            break;
    }
});

chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
    const { id: windowId } = await chrome.windows.getCurrent();
    await chrome.action.openPopup({ windowId })
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

