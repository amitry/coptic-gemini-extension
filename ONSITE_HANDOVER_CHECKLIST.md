# 🇿🇲 Coptic Hospital — Onsite Transition & Long-Term Sustainability Checklist

**Date**: August 5, 2026  
**Location**: Coptic Hospital, Lusaka, Zambia  

This checklist outlines the essential technical, operational, and clinical handover steps to ensure the long-term success and seamless adoption of **Coptic Gemini Assistant** after departure.

---

## 📌 1. Designate Local Project Champions

Assign two key local staff members to own the project onsite:
* **Medical / Clinical Champion** (e.g., Senior Medical Officer / Lead Doctor):
  * Responsible for encouraging doctor usage during ward rounds, gathering clinical feedback, and requesting guideline updates (e.g., new Zambian STG protocols).
* **IT / Technical Champion** (Head of Coptic Hospital IT):
  * Responsible for managing extension updates, monitoring Google API quotas, and overseeing Chrome Web Store releases.

---

## 📌 2. Finalize Team Access & Account Transfers

- [ ] **Chrome Web Store Group Publisher**:
  * Verify that Coptic IT leads (`@coptichospital.org`) are added to the Group Publisher account in the [Chrome Web Store Dev Console](https://chrome.google.com/webstore/devconsole/).
- [ ] **GitHub Repository Write Access**:
  * Ensure local IT staff are listed as collaborators on [`github.com/amitry/coptic-gemini-extension`](https://github.com/amitry/coptic-gemini-extension).
- [ ] **Google Cloud Console Access**:
  * Transfer/share admin permissions for the Google Cloud project managing the Workspace OAuth 2.0 Client ID and Gemini API keys.

---

## 📌 3. Deploy v3.6 to Pilot Workstations

- [ ] **Install on Key Consultation Computers**:
  * Load **`coptic-gemini-assist-v3.6.zip`** or the Web Store link on computers in OPD (Outpatient Department), Pediatric Ward, and Consultation Rooms.
- [ ] **Bookmark Test Workbench**:
  * Bookmark [`test.html`](test.html) on pilot computers so doctors can quickly demo or test features offline anytime.

---

## 📌 4. Establish Low-Friction Clinician Feedback Channels

- [ ] **Test the In-App Feedback Button**:
  * Verify that clicking **`💬 Send Feedback`** inside the AI modal or popup logs an issue directly to GitHub or pre-fills an email with telemetry.
- [ ] **Set Up WhatsApp / Telegram Support Group**:
  * Create a WhatsApp group: *"Coptic Hospital — AI Assistant Doctor Support"*.
  * Post the join link/QR code at doctor charting stations for quick voice notes or screenshots.

---

## 📌 5. Distribute Orientation & Workflow Materials

Share and print the following project documentation for clinical staff:
* 🩺 **Clinician Workflow Guide**: [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) *(3-Step workflow for ward rounds & clinic)*.
* 📢 **Pilot Announcement Package**: [`PILOT_ANNOUNCEMENT.md`](PILOT_ANNOUNCEMENT.md) *(Overview of capabilities & install links)*.
* 💻 **IT Developer & Collaboration Guide**: [`CONTRIBUTING.md`](CONTRIBUTING.md) *(For local IT maintenance & CI/CD testing)*.
* 🔒 **Privacy Policy**: [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) *(HIPAA compliance & data sanitization guarantees)*.

---

## 🚀 Post-Departure Support Plan
* **Monthly Check-in**: Schedule a recurring 30-minute virtual check-in with the Clinical & IT Champions to review feedback logged in GitHub Issues.
* **Automated CI/CD**: Any new code committed to `main` will automatically be tested via GitHub Actions CI (`.github/workflows/ci.yml`).
