# 💻 Coptic Hospital IT — Development & Collaboration Guide

Welcome to the **Coptic Gemini Assistant** development team! This guide covers everything Coptic Hospital IT staff and software developers need to set up their local environment, understand the extension architecture, collaborate safely, and manage releases.

---

## 🛠️ 1. Developer Environment & Local Setup

### Prerequisites
* Google Chrome browser (v110+)
* Git installed locally
* Text editor (VS Code, Cursor, WebStorm, or similar)

### Step-by-Step Local Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/amitry/coptic-gemini-extension.git
   cd coptic-gemini-extension
   ```
2. **Load Unpacked Extension in Chrome**:
   * Open Chrome and navigate to `chrome://extensions/`.
   * Enable **Developer mode** (toggle in the top-right corner).
   * Click **Load unpacked** in the top-left corner.
   * Select the `coptic-gemini-extension` project folder.

3. **Test Without Live Unumed EHR (Offline Simulator)**:
   * Open [`test.html`](test.html) directly in Chrome (`file:///.../test.html`).
   * This simulates full Unumed GraphQL payloads (demographics, vitals, labs, orders) and lets you test UI changes, voice dictation, and smart form filling locally!

---

## 🏗️ 2. Repository Architecture Overview

```
coptic-gemini-extension/
├── manifest.json         # Manifest V3 extension configuration & permissions
├── content.js            # Isolated-world script: DOM injection, SOAP generator,
│                         # STG calculator, Q&A chat drawer, Smart Fill engine
├── interceptor.js        # Main-world script: Intercepts Unumed XHR/GraphQL payloads
│                         # (EhrEntryDoc, searchPatientEhrLab) & posts messages
├── popup.html / .js      # Extension popup UI (Google SSO login, API key config, model picker)
├── styles.css            # Scoped design system, modal styles, floating FAB & animations
├── test.html             # Unumed EHR test simulator workbench for local testing
├── ROADMAP.md            # Feature roadmap & phase completions
├── PILOT_ANNOUNCEMENT.md # Orientation communications & clinical pilot instructions
├── WORKFLOW_GUIDE.md     # 3-step clinician workflow guide
├── PRIVACY_POLICY.md     # Official privacy policy & data sanitization rules
└── CONTRIBUTING.md       # (This file) Coptic IT Collaboration Guide
```

---

## 🔐 3. Security, Privacy & HIPAA Compliance Rules

When writing code or adding new features, **you MUST follow these strict rules**:

1. **Mandatory Patient De-Identification**:
   * All clinical text MUST be sanitized through `deidentifyText()` before sending prompts to the Gemini API.
   * Never log raw patient names, Zambian NRC numbers, or phone numbers to external endpoints or console logs.
2. **Host Permission Scoping**:
   * Keep `host_permissions` strictly restricted to `["*://*.unumed.net/*"]`. Do not add generic wildcard permissions like `<all_urls>` unless explicitly justified.
3. **No External Storage**:
   * Patient chart metrics must remain in local browser memory while the tab is active. Do not send patient data to third-party databases.

---

## 🔀 4. Git Branching & Pull Request Workflow

To maintain code quality and prevent breaking live clinical workflows:

### Branching Convention
* `feature/feature-name`: New features (e.g., `feature/lab-trend-flagger`)
* `fix/bug-description`: Bug fixes (e.g., `fix/smartfill-modal-zindex`)
* `docs/documentation-update`: Documentation changes

### Submission Process
1. Create a new branch off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(dosing): add pediatric paracetamol STG dosage calculation"
   ```
3. Push your branch to GitHub and open a **Pull Request (PR)** against `main`.
4. Request review from another IT team member before merging into `main`.

---

## 👥 5. Team Access & Account Administration

### A. GitHub Team Collaboration
* All Coptic IT developers should be granted **Write** or **Maintainer** access under the GitHub repository settings (*Settings > Collaborators*).
* Enable Branch Protection on `main` requiring at least 1 approval before merging.

### B. Chrome Web Store Group Publisher Setup
To allow multiple IT team members to upload and publish extension updates without sharing individual account credentials:
1. Log in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Navigate to **Account > Group Publisher**.
3. Create a Group Publisher (e.g., `Coptic Hospital IT Team`).
4. Invite Coptic IT developers by their Google Workspace emails (`@coptichospital.org`).

### C. Google Cloud Console Access
* Grant IT admins access to the Google Cloud Console project managing the Google Workspace OAuth 2.0 Client ID and Gemini API Key quotas.

---

## 🧪 6. Testing & Release Checklist

Before releasing a new version (`zip` package) to doctors or the Chrome Web Store:

- [ ] Test on local EHR simulator (`test.html`) — verify SOAP generation, voice dictation, and Smart Fill.
- [ ] Test on live Unumed staging/production (`*.unumed.net`).
- [ ] Run `python3 -c "code = open('content.js').read(); print('Brace diff:', code.count('{') - code.count('}'))"` to verify syntax integrity.
- [ ] Bump version number in `manifest.json` (e.g., `3.4` -> `3.5`).
- [ ] Build release zip:
  ```bash
  zip -r coptic-gemini-assist-v3.5.zip manifest.json content.js interceptor.js popup.html popup.js styles.css test.html README.md ROADMAP.md PILOT_ANNOUNCEMENT.md WORKFLOW_GUIDE.md PRIVACY_POLICY.md CONTRIBUTING.md icons/ store_assets/
  ```
- [ ] Update release links in `README.md` and `PILOT_ANNOUNCEMENT.md`.
