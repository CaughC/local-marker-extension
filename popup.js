// popup.js

const STATUS_DIV = document.getElementById('status');
const API_KEY_INPUT = document.getElementById('apiKeyInput');
const MODEL_NAME_INPUT = document.getElementById('modelNameInput');
const AI_PROMPT_INPUT = document.getElementById('aiPromptInput');
const SECTION_KEY = document.getElementById('apiKeySection');
const SECTION_ACTION = document.getElementById('aiActionSection');

// Load saved settings
chrome.storage.local.get(['geminiApiKey', 'geminiModel'], (result) => {
    if (result.geminiApiKey) {
        showAISection(true);
    } else {
        showAISection(false);
    }

    if (result.geminiModel) {
        MODEL_NAME_INPUT.value = result.geminiModel;
    } else {
        // Default fallback if nothing saved
        MODEL_NAME_INPUT.value = "gemini-1.5-flash-latest";
    }
});

function showAISection(hasKey) {
    if (hasKey) {
        SECTION_KEY.classList.add('hidden');
        SECTION_ACTION.classList.remove('hidden');
    } else {
        SECTION_KEY.classList.remove('hidden');
        SECTION_ACTION.classList.add('hidden');
    }
}

document.getElementById('saveKeyBtn').addEventListener('click', () => {
    const key = API_KEY_INPUT.value.trim();
    const model = MODEL_NAME_INPUT.value.trim() || "gemini-1.5-flash-latest";

    if (key) {
        chrome.storage.local.set({ geminiApiKey: key, geminiModel: model }, () => {
            STATUS_DIV.textContent = "Settings saved!";
            showAISection(true);
            setTimeout(() => STATUS_DIV.textContent = "", 2000);
        });
    } else {
        STATUS_DIV.textContent = "API Key is required.";
    }
});

document.getElementById('changeKeyBtn').addEventListener('click', () => {
    showAISection(false);
    // Don't clear inputs, just show them so user can edit
    chrome.storage.local.get(['geminiApiKey', 'geminiModel'], (result) => {
        if (result.geminiApiKey) API_KEY_INPUT.value = result.geminiApiKey;
        if (result.geminiModel) MODEL_NAME_INPUT.value = result.geminiModel;
    });
    API_KEY_INPUT.focus();
});

document.getElementById('aiRunBtn').addEventListener('click', async () => {
    const prompt = AI_PROMPT_INPUT.value.trim();
    if (!prompt) {
        STATUS_DIV.textContent = "Please enter an instruction.";
        return;
    }

    STATUS_DIV.textContent = "Reading page content...";

    // 1. Get page content
    const tab = await getCurrentTab();
    if (!tab.id) return;

    chrome.tabs.sendMessage(tab.id, { action: "getText" }, async (response) => {
        if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError.message);
            STATUS_DIV.textContent = "Please refresh the page and try again.";
            return;
        }

        if (!response || !response.text) {
            STATUS_DIV.textContent = "Could not read page text.";
            return;
        }

        const pageText = response.text.substring(0, 10000); // Limit context size
        STATUS_DIV.textContent = "Asking Gemini...";

        // 2. Call Gemini
        chrome.storage.local.get(['geminiApiKey', 'geminiModel'], async (res) => {
            const apiKey = res.geminiApiKey;
            // Use saved model or fallback
            const modelName = res.geminiModel || "gemini-1.5-flash-latest";

            console.log(`Using Model: ${modelName}`); // Debug log

            try {
                const phrases = await callGemini(apiKey, modelName, pageText, prompt);

                if (phrases && phrases.length > 0) {
                    STATUS_DIV.textContent = `Found ${phrases.length} items. Underlining...`;

                    // 3. Send phrases back to content script
                    chrome.tabs.sendMessage(tab.id, {
                        action: "underline",
                        phrases: phrases
                    });
                } else {
                    STATUS_DIV.textContent = "Gemini found nothing to underline.";
                }
            } catch (err) {
                console.error(err);
                STATUS_DIV.textContent = "Error: " + err.message;
            }
        });
    });
});

async function callGemini(apiKey, modelName, text, userPrompt) {
    // Use user-provided model name in the URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    console.log(`Request URL: ${url}`); // Debug log

    const systemPrompt = `
    You are a helper that identifies important text in a document based on a user's instruction.
    Return ONLY a raw JSON array of strings that exactly match the text in the document.
    Do not change the text. If the text is not exact, it cannot be highlighted.
    Limit to the top 10-15 most important phrases related to the instruction.
    Example output: ["exact phrase one", "exact phrase two"]
  `;

    const payload = {
        contents: [{
            parts: [{
                text: `Document:\n${text}\n\nUser Instruction: ${userPrompt}\n\n${systemPrompt}`
            }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Model '${modelName}' not found (404). Check model name.`);
        }
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) return [];

    const jsonMatch = rawText.match(/\[.*\]/s);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return [];
}

async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

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
                    let filename = "marked_page.html";
                    if (tab.title) {
                        filename = tab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".html";
                    }
                    chrome.downloads.download({ url: url, filename: filename, saveAs: true });
                }
            });
        }
    });
});
