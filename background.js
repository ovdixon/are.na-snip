let screenshotUrl = null;



chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "arenaSnip",
        title: "Snip to Are.na"
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "arenaSnip") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["scripts/content-script.js"]
        });
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
        console.log('Cropped img: ', req.img)
        screenshotUrl = req.img
    }
    return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "requestScreenshot") {
        if (screenshotUrl) {
            sendResponse(screenshotUrl);
        } else {
            sendResponse(null);
        }
    }
});
