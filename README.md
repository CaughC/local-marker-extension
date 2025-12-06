# Local Marker Extension

The "Local Marker" extension allows you to highlight text on web pages and local HTML files, and save the modified HTML with highlights to your local machine.

## Installation

1.  Clone this repository or download the source code.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **"Developer mode"** in the top right corner.
4.  Click **"Load unpacked"**.
5.  Select the directory where you cloned this repository (the folder containing `manifest.json`).

## Important Configuration

> [!IMPORTANT]
> To allow the extension to work on local files (e.g., `file:///C:/Users/You/Documents/test.html`), you must enable file access:

1.  After installing, find "Local Marker" in the extensions list.
2.  Click **"Details"**.
3.  Scroll down to **"Allow access to file URLs"** and toggle it **ON**.

## Usage Guide

### 1. Highlight Text
- Open any web page or local HTML file.
- Select the text you want to highlight.
- **Option A**: Right-click and select **"Highlight Selection"**.
- **Option B**: Click the extension icon in the toolbar and click **"Highlight Selection"**.
- The text will turn **yellow**.

### 2. Remove Highlight
- **Double-click** on any highlighted text to remove the highlight.

### 3. Save Changes
- Click the extension icon to open the popup.
- Click **"Save Page"**.
- A new HTML file (e.g., `page_title.html`) will be downloaded.
- This file contains the full HTML of the page, **including your highlights**.

### 4. Re-edit
- Open the downloaded HTML file.
- You can continue to add more highlights or remove existing ones using the same method.

## Code Overview
- `manifest.json`: Defined permissions (`activeTab`, `downloads`, `file://` access via `<all_urls>`).
- `content.js`: Handles wrapping text in `<mark data-highlight="true">` and double-click removal.
- `background.js`: Adds the right-click context menu item.
- `popup.js`: Handles communication to trigger highlighting and saving (exporting DOM to Blob).
