// content.js

function isHighlightElement(node) {
    return node.nodeType === Node.ELEMENT_NODE &&
        node.tagName === 'MARK' &&
        node.getAttribute('data-highlight') === 'true';
}

function getHighlightParent(node) {
    let current = node;
    while (current && current !== document.body) {
        if (isHighlightElement(current)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

function removeHighlight(element) {
    const parent = element.parentNode;
    while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    // Merge adjacent text nodes to prevent fragmentation
    parent.normalize();
}

function highlightSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Check if we are inside a highlight (Toggle Off)
    // Check startContainer and endContainer
    const startHighlight = getHighlightParent(selection.anchorNode);
    const endHighlight = getHighlightParent(selection.focusNode);

    if (startHighlight) {
        removeHighlight(startHighlight);
        selection.removeAllRanges();
        return;
    }
    if (endHighlight && endHighlight !== startHighlight) {
        removeHighlight(endHighlight);
        selection.removeAllRanges();
        return;
    }

    // If no existing highlight found, apply new highlight (Toggle On)
    if (range.collapsed) return;

    const mark = document.createElement('mark');
    mark.setAttribute('data-highlight', 'true');
    mark.style.backgroundColor = 'yellow';
    mark.style.color = 'black';

    try {
        range.surroundContents(mark);
        selection.removeAllRanges();
    } catch (e) {
        console.error("Highlighting failed.", e);
        // Fallback: If surroundContents fails (complex intersection), 
        // we would typically use a range walker, but keeping it minimal for now.
        alert("Highlighting failed. Try selecting a smaller range or within a single block.");
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
    const highlight = getHighlightParent(event.target);
    if (highlight) {
        removeHighlight(highlight);
    }
});
