// content.js

function highlightSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    // Create the mark element
    const mark = document.createElement('mark');
    mark.setAttribute('data-highlight', 'true');
    mark.style.backgroundColor = 'yellow'; // Explicit style for local files
    mark.style.color = 'black';

    try {
        // Surround the contents of the range with the mark element
        // Note: This is a simple implementation. Complex selections across block elements 
        // might require more robust libraries, but this fits "minimal" requirements.
        range.surroundContents(mark);

        // Clear selection after highlighting
        selection.removeAllRanges();
    } catch (e) {
        console.error("Highlighting failed (likely crossing block boundaries).", e);
        alert("Highlighting failed. Please try selecting within a single paragraph.");
    }
}

function removeHighlight(element) {
    if (element.tagName === 'MARK' && element.getAttribute('data-highlight') === 'true') {
        const parent = element.parentNode;
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
    }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "highlight") {
        highlightSelection();
        sendResponse({ status: "done" });
    } else if (request.action === "getHTML") {
        sendResponse({ html: document.documentElement.outerHTML });
    }
});

// Optional: Double-click to remove highlight
document.addEventListener('dblclick', (event) => {
    if (event.target.tagName === 'MARK' && event.target.getAttribute('data-highlight') === 'true') {
        removeHighlight(event.target);
    }
});
