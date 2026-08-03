# 🤝 Coptic Gemini Assist - Team Collaboration Guide

A lightweight operational guide for developers, clinical leads, and hospital IT staff collaborating on the **Coptic Gemini Assist** Chrome extension.

---

## 🛠️ Toolstack Overview

| Tool | Primary Purpose | How It Fits Into Workflow |
| :--- | :--- | :--- |
| ⚡ **Google Antigravity (AGY)** | **AI Coding Assistant** | Primary development interface for feature creation, schema parsing, refactoring, and debugging. |
| 🐙 **GitHub** | **Version Control & Review** | Hosting source code, tracking branches, pull requests (PRs), and code reviews. |
| 💬 **Slack** | **Team Communication** | Async team sync, sharing PR links, discussing clinical guidelines, and gathering tester feedback. |
| 📁 **Google Drive** | **Build Distribution** | Sharing pre-packaged release zip files (`coptic-gemini-assist-v1.x.zip`) with non-technical doctors. |

---

## ⚡ 1. Developing with Google Antigravity (AGY)

All developers should use **Antigravity** as their pair programmer to accelerate extension updates:

### Daily Dev Workflow:
1. **Pull Latest Code**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Open Project in Antigravity**: Point Antigravity to your local `coptic-gemini-extension` folder.
3. **Prompt Antigravity for Tasks**:
   * *Adding Extractor Logic*: `"Read diag2.txt and update content.js to extract patient allergy data."`
   * *UI Tweaks*: `"Update styles.css to make the floating assistant badge responsive on tablet screens."`
   * *Zambian STG System Prompt*: `"Update the clinical prompt in content.js to align with updated pediatric malaria guidelines."`
4. **Local Verification**:
   * Open `file:///path/to/coptic-gemini-extension/test.html` in Chrome to verify UI and prompt formatting.
   * Reload extension at `chrome://extensions` and verify on Unumed.

---

## 🐙 2. Git & GitHub Branching Strategy

To keep the `main` branch stable for hospital users, use feature branches:

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/add-allergy-parser
   ```
2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: add patient allergy parsing to content script"
   ```
3. **Push & Open a Pull Request (PR)**:
   ```bash
   git push origin feature/add-allergy-parser
   ```
4. Post your PR link in the **Slack** dev channel for review. Once approved, merge to `main`.

---

## 💬 3. Slack Communication Channels

Recommended Slack channel structure:

* **`#coptic-gemini-dev`**: 
  * Technical discussions, PR reviews, API model updates (`gemini-3.6-flash`), and sharing helpful Antigravity prompts.
* **`#coptic-gemini-clinical`**: 
  * Feedback from doctors, testing requests, STG protocol verification with medical officers.

---

## 📁 4. Google Drive for Doctor Onboarding & Testing

Hospital doctors do not need Git access. Use **Google Drive** to distribute ready-to-use zip builds:

### Creating & Distributing a Build:
1. **Package the Zip**:
   ```bash
   zip -r coptic-gemini-assist-v1.3.zip manifest.json content.js interceptor.js popup.html popup.js styles.css test.html README.md
   ```
2. **Upload to Google Drive**:
   * Save `coptic-gemini-assist-v1.3.zip` to the **Coptic Gemini Extension** shared folder on Google Drive.
3. **Share link with Doctors**:
   * Share the Drive link in `#coptic-gemini-clinical` along with the 3-step installation guide from [`README.md`](README.md).

---

## 📋 Summary Checklist for New Features

- [ ] Developed & verified locally with **Antigravity** and `test.html`.
- [ ] Pushed branch to **GitHub** and opened a PR.
- [ ] Shared PR link in **Slack** (`#coptic-gemini-dev`) for review.
- [ ] Merged to `main` and packaged release zip for **Google Drive**.
