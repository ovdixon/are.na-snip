let screenshotUrl = null;
let window;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "arenaSnip",
        title: "Snip",
        contexts: ['all']
    });
    chrome.contextMenus.create({
        id: "arenaShot",
        title: "Screenshot",
        contexts: ['all']
    });
    chrome.contextMenus.create({
        id: "arenaAdd",
        title: "Add",
        contexts: ['image', 'link', 'page', 'selection'],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    window = tab.windowId
    chrome.sidePanel.open({ windowId: window });
    switch (info.menuItemId) {
        case 'arenaSnip':
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["js/snip.js"]
            });
            break;
        case 'arenaAdd':
            chrome.runtime.sendMessage({message: 'add', target: info}, (response) => {
                console.log(response);
            });
            break;
        case 'arenaShot':
            chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 100 }, function (dataUrl) {
                chrome.runtime.sendMessage({message: 'crop', img: dataUrl}, (response) => {
                    console.log(response);
                });
            });
            break;
        default:
            console.log('Invalid context menu item')
            break;
    }
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
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

