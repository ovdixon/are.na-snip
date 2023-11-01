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