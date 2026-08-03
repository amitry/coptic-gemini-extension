# 🏥 Coptic Hospital - Gemini Assist

**Clinical Decision Support Assistant & EHR Integration for Coptic Hospital (Lusaka, Zambia)**

Coptic Gemini Assist is a Chrome Extension designed to provide real-time, context-aware AI clinical decision support directly inside the hospital's EHR platform (Unumed).

---

## 🌟 Key Features

1. **Zambian Clinical Guidelines Alignment**:
   * Grounded in the **Zambia Standard Treatment Guidelines (STG)**, National ART/Malaria Protocols, and ICD-10 diagnostic codes.
   * Delivers concise, bulleted clinical recommendations tailored for doctors and clinical officers.

2. **Automated Patient Context Aggregator**:
   * Intercepts and caches active chart data in real-time as clinicians view patient records in Unumed.
   * Automatically incorporates **Vitals**, **Lab Results**, **Active Medications/Orders**, **Demographics**, and **Previous Clinician Notes**.

3. **Patient Data Privacy & De-Identification**:
   * Built-in sanitization redacts sensitive identifiers (Zambian NRC numbers, patient names, phone numbers) before sending prompts to AI models.

4. **Google Workspace EDU Single Sign-On (SSO)**:
   * 1-Click login using hospital `@coptichospital.org` (or EDU domain) credentials via Chrome `identity` API. No manual API keys required.

5. **Read-Only / Tester Friendly UI**:
   * Features both inline **`✨ Gemini Assist`** buttons next to textareas AND a floating **`✨ Coptic Gemini Assistant`** widget accessible on any page.
   * Includes a built-in offline test workbench (`test.html`).

---

## 🗺️ Product Roadmap

View the full development roadmap and release phases in [`ROADMAP.md`](ROADMAP.md):

* **Phase 1 (✅ Completed)**: Structured SOAP Note Generator, Automated EHR Context Aggregator, Interactive ICD-10 Code Chips, 1-Click Google Workspace SSO.
* **Phase 2 (In Progress)**: Hands-free Voice Dictation (`🎙️ Dictate`) & Speech-to-Text.
* **Phase 3 (Upcoming)**: Point-of-Care Interactive Q&A Chat & Zambian STG Dosing Calculator.
* **Phase 4 (Upcoming)**: Drug Interaction Alerting & Abnormal Lab Trend Flagger.

---

## 🚀 Quick Start for Doctors & Testers

### Method 1: Install Unpacked Extension (Developer Mode)
1. Download or clone this repository / extract `coptic-gemini-assist-v1.2.zip`.
2. Open Google Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the extension folder.
5. Open the extension popup, click **`🌐 Sign in with Google Workspace`**, and sign in with your hospital email.

---

## 🛠️ Architecture & Technical Setup

```
coptic-gemini-extension/
├── manifest.json         # Extension Manifest V3 (Permissions, Scripts, OAuth)
├── interceptor.js        # Main World script: intercepts fetch/XHR traffic & GraphQL payloads
├── content.js            # Isolated World script: UI injection, Patient Context Cache, Gemini API caller
├── popup.html / popup.js # Extension settings popup: Google Workspace SSO & diagnostics
├── styles.css            # Extension design system & modal UI styling
├── test.html             # Local offline testing workbench
└── setup_recon.py        # Environment utility script
```

---

## 👥 Collaborative Development Workflow

### 1. Repository Setup
```bash
git clone https://github.com/coptichospital/coptic-gemini-extension.git
cd coptic-gemini-extension
```

### 2. Making Changes & Testing
* **Local Workbench**: Open `file:///path/to/coptic-gemini-extension/test.html` in Chrome to test prompt formatting and patient context assembly offline.
* **Extension Reloading**: After editing `content.js` or `interceptor.js`, reload the extension at `chrome://extensions` and refresh the page.

---

## 🏛️ Enterprise Deployment Options

For hospital-wide deployment without requiring individual Developer Mode steps:

1. **Chrome Web Store (Unlisted / Domain Restricted)**:
   * Upload to Chrome Web Store as **Unlisted** and restrict installation to the `@coptichospital.org` domain.
   * Doctors install with a single click from a web link.

2. **Google Workspace Force Install**:
   * Coptic IT admins can force-install the extension across all hospital Chrome browsers via the **Google Workspace Admin Console**:
     `Devices -> Chrome -> Apps & extensions -> Force install`

---

## 📜 License
Internal Clinical Decision Support Tool — Coptic Hospital, Lusaka, Zambia.
