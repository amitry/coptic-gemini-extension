# Privacy Policy — Coptic Hospital Gemini Assistant

**Last Updated**: August 5, 2026

**Coptic Gemini Assistant** is an internal clinical decision support Chrome Extension developed for healthcare professionals at **Coptic Hospital (Lusaka, Zambia)** operating within the Unumed Electronic Health Record (EHR) system.

We are committed to protecting patient privacy, maintaining strict confidentiality, and upholding international healthcare data standards (including HIPAA principles and regional health data regulations).

---

## 1. Information Processing & Patient Data Sanitization

### De-Identification at Point-of-Care
The extension features built-in automated de-identification logic. Prior to transmitting any clinical observations to the Google Gemini API for analysis:
* **Zambian NRC Numbers** (National Registration Cards) are automatically redacted (`[REDACTED NRC]`).
* **Patient Names** are automatically redacted (`[PATIENT NAME]`).
* **Phone Numbers** are automatically redacted (`[PHONE NUMBER]`).

### Zero Third-Party Data Selling or Tracking
* We **do not sell**, rent, or monetize patient or clinician data.
* We **do not use** tracking scripts, third-party analytics, or commercial advertising frameworks.

---

## 2. Use of Extension Permissions

The extension requests only the minimum permissions necessary to function within the Unumed EHR:

| Permission | Purpose & Justification |
| :--- | :--- |
| **`storage`** | Used exclusively to save local user preferences (selected Gemini model, API key, and session diagnostic logs) within the user's browser. |
| **`identity`** | Used exclusively for 1-click Google Workspace Single Sign-On (`@coptichospital.org` or EDU credentials). |
| **`*://*.unumed.net/*`** *(Host Permission)* | Strictly restricted to Coptic Hospital's EHR domain (`*.unumed.net`) to read patient vitals/labs and inject decision support buttons into clinical note forms. |

---

## 3. Data Transmission & Security

* **HTTPS Encryption**: All requests to Google Gemini API endpoints are encrypted via standard TLS/HTTPS.
* **No External Storage**: Patient vitals and lab metrics are cached temporarily in local browser memory while the chart tab is open. They are never stored on external databases or third-party servers.

---

## 4. Contact & Compliance Inquiries

For questions regarding this Privacy Policy or extension data security, please contact the Coptic Hospital IT & Clinical AI Engineering Team:

* **Organization**: Coptic Hospital, Lusaka, Zambia
* **Repository**: [https://github.com/amitry/coptic-gemini-extension](https://github.com/amitry/coptic-gemini-extension)
