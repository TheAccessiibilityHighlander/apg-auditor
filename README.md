# APG Auditor

A Chrome extension for professional accessibility auditing using the ARIA Authoring Practices Guide and axe-core.

## Setup

1. Open `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select this folder
3. Click the APG Auditor icon in the toolbar — the side panel opens
4. Go to **Settings** (gear icon) and paste your Claude API key

## Usage

### Scanning
- Navigate to any page and click **Scan Page**
- The tool traverses the DOM and runs axe-core to detect components and violations
- Click any component to expand its details, see axe violations, and look up its APG pattern

### APG Pattern Lookup
- Inside a component's detail, click **APG Pattern ↗**
- Claude (claude-sonnet-4-20250514) maps the component to the correct APG pattern and returns:
  - Required keyboard interactions
  - Required ARIA roles, attributes, and states
  - Top 3 common failures for that pattern

### Logging Findings
- Click **Log Finding** on any component, or use **Add Finding** in the Findings tab
- Fill in the element description, WCAG criterion (searchable), level, severity, frequency, and notes
- Findings persist across sessions via Chrome storage

### Export
- Go to the **Export** tab
- Add your name/org in the Auditor field
- Export as **CSV** (spreadsheet-friendly) or **JSON** (structured data)

## Project Structure

```
apg-auditor/
├── manifest.json       MV3 manifest
├── background.js       Service worker — message routing, Claude API calls
├── content.js          DOM traversal, axe-core injection, scan orchestration
├── sidepanel/
│   ├── panel.html      Side panel shell
│   ├── panel.js        All UI logic and state
│   └── panel.css       Dark professional UI
├── icons/              Extension icons
└── README.md
```

## API Key Security

The Claude API key is stored in `chrome.storage.local` — it is local to your browser and never leaves your machine except for direct calls to `api.anthropic.com`.
