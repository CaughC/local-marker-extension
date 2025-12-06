// background.js

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "highlight-selection",
        title: "Highlight Selection",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "highlight-selection") {
        // Send message to content script
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: "highlight" });
        }
    }
});

chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "toggle-highlight" && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "highlight" });
    }
});
