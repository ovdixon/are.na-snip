let screenshotUrl = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "arenaSnip",
        title: "Are.na Snip"
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    if (message === "capture") {
        console.log('Capturing')
        chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
            screenshotUrl = dataUrl;
            sendResponse({screenshotUrl: dataUrl});
        });
    }
    return true; 
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Request stored capture')
    if (message === "requestScreenshot") {
        if (screenshotUrl) {
            sendResponse(screenshotUrl);
        } else {
            sendResponse(null); 
        }
    }
});
