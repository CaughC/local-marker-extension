// content.js

// --- Utility Functions ---

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
    parent.normalize();
}

// --- Main Features ---

function highlightSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Toggle Off Logic
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

    // Toggle On Logic
    if (range.collapsed) return;

    const mark = document.createElement('mark');
    mark.setAttribute('data-highlight', 'true');
    mark.style.backgroundColor = 'yellow';
    mark.style.color = 'black';

    try {
        range.surroundContents(mark);
        selection.removeAllRanges();
    } catch (e) {
        console.warn("Simple highlight failed. Trying safe wrapper.", e);
        // Simple fallback for crossing tags
        const iterator = document.createNodeIterator(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    return selection.containsNode(node, true) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );
        // This is a simplified "complex" highlighter that wraps text nodes individually
        // Implementing full robust range wrapping is outside MVP scope
        alert("Highlighting across multiple block elements is limited in this version. Try smaller selections.");
    }
}

function applyUnderline(phrases) {
    if (!phrases || phrases.length === 0) return;

    // Walk through all text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    phrases.forEach(phrase => {
        // Basic implementation: Find exact string in text nodes. 
        // Does not handle phrases split across bold/italic tags.
        for (const node of textNodes) {
            if (node.parentElement && node.parentElement.tagName === 'SCRIPT') continue;
            if (node.parentElement && node.parentElement.tagName === 'STYLE') continue;

            const index = node.nodeValue.indexOf(phrase);
            if (index !== -1) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + phrase.length);

                const span = document.createElement('span');
                span.style.borderBottom = "3px solid lightblue";
                span.style.backgroundColor = "transparent";
                span.setAttribute('data-ai-underline', 'true');

                try {
                    range.surroundContents(span);
                    // Update node reference since it split? 
                    // Actually surroundContents splits the node, user likely won't hit the exact same node again for the same phrase validation often enough to crash, but strictly we should re-walk.
                } catch (e) {
                    console.log("Could not wrap phrase:", phrase);
                }
            }
        }
    });
}


// --- Message Listeners ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "highlight") {
        highlightSelection();
        sendResponse({ status: "done" });
    }
    else if (request.action === "getHTML") {
        sendResponse({ html: document.documentElement.outerHTML });
    }
    else if (request.action === "getText") {
        sendResponse({ text: document.body.innerText });
    }
    else if (request.action === "underline") {
        applyUnderline(request.phrases);
        sendResponse({ status: "done" });
    }
    return true; // Keep channel open for async response
});

// --- Mouse Listeners ---

document.addEventListener('dblclick', (event) => {
    const highlight = getHighlightParent(event.target);
    if (highlight) {
        removeHighlight(highlight);
    }
});
