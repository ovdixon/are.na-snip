function pageClick(info) {
    console.log("clicked")
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "arenaSnip",
        title: "Are.na Snip";
        
    });
});