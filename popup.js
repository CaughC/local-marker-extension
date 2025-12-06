// popup.js

document.getElementById('highlightBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "highlight" });
            window.close();
        }
    });
});

document.getElementById('saveBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: "getHTML" }, (response) => {
                if (response && response.html) {
                    const blob = new Blob([response.html], { type: "text/html" });
                    const url = URL.createObjectURL(blob);

                    // Suggest filename based on original title or URL
                    let filename = "marked_page.html";
                    if (tab.title) {
                        filename = tab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".html";
                    }

                    chrome.downloads.download({
                        url: url,
                        filename: filename,
                        saveAs: true
                    });
                } else {
                    console.error("Failed to get HTML from content script.");
                }
            });
        }
    });
});
