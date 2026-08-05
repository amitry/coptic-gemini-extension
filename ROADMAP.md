# 🗺️ Coptic Gemini Assist - Product Roadmap

A comprehensive product roadmap for the **Coptic Gemini Assist** clinical decision support platform at Coptic Hospital (Lusaka, Zambia).

---

## 🚀 Phase 1: Core Clinical Efficiency & Coding (✅ Completed)

- [x] **Structured SOAP Note Generator**: Automatically synthesizes unstructured clinical observations and patient context into standard **Subjective (S)**, **Objective (O)**, **Assessment (A)**, and **Plan (P)** notes.
- [x] **Automated EHR Context Aggregator**: Background capture of patient Vitals, Lab Reports, Active Orders, and Clinician History from Unumed GraphQL endpoints.
- [x] **Interactive ICD-10 Diagnostic Code Chips**: Proposes 1 to 4 relevant ICD-10 diagnostic codes with 1-click clipboard copying.
- [x] **1-Click Google Workspace EDU SSO**: Seamless single sign-on using `@coptichospital.org` (or EDU domain) credentials via Chrome `identity` API.
- [x] **Floating Action Widget (`✨ Coptic Gemini Assistant`)**: Accessible on any Unumed page, supporting read-only clinician accounts and tablet views.
- [x] **Patient Privacy & De-Identification**: Automatic redaction of Zambian NRC numbers, patient names, and phone numbers.

---

## 🎙️ Phase 2: Voice Dictation & Hands-Free Charting (✅ Completed)

- [x] **`🎙️ Dictate` Voice-to-Text Button**: Real-time hands-free speech-to-text dictation using Web Speech API injected next to Unumed form fields and assistant modal.
- [x] **Live Audio Indicator & Control**: Dynamic pulsing red indicator (`🔴 Listening... (Click to Stop)`) with real-time text transcription into active note fields.
- [x] **Hands-Free Charting Workflow**: Seamless integration allowing clinicians to speak observations hands-free and immediately click `✨ Gemini Assist` for SOAP formatting.

---

## 💬 Phase 3: Point-of-Care Interactive Q&A & Clinical Calculator (✅ Completed)

- [x] **Interactive Clinical Q&A Sidekick Chat**: Live conversational drawer allowing doctors to ask follow-up questions about the active chart (e.g., *"What if RDT is negative? What is 2nd line ART?"*).
- [x] **Zambian STG Weight-Based Dosing Calculator**: Instant automated dosage calculations for Artemether-Lumefantrine (Coartem), Paracetamol, Amoxicillin, and Pediatric ART based on patient weight.

---

## 🏆 Production Minimum Viable Product (MVP) Status (✅ READY)

The core architecture, privacy controls, testing pipelines, and clinician features are **100% feature-complete** for Production MVP graduation:

| Category | Component / Capability | Status |
| :--- | :--- | :--- |
| **Core AI Engine** | Multi-field Smart Form Auto-Filler (`smartFillEHRForm`) & Cross-page Queue | ✅ Production Ready |
| **Data Aggregator** | 5-Category EHR Collector (Labs, Imaging, Meds, Docs, Notes) | ✅ Production Ready |
| **Guidelines Engine**| Zambian STG & ART Weight-Based Dosing Calculator + Q&A Chat | ✅ Production Ready |
| **Privacy & Security** | Zambian NRC / Phone Redaction, HIPAA Compliance, Zero-Tracking | ✅ Production Ready |
| **Testing & CI/CD** | 3-Layer Suite (AST Linter, Playwright E2E, GitHub Actions CI) | ✅ Production Ready |
| **Doctor Feedback** | Serverless Gateway (`scratch/feedback_webhook.gs`) with Dual Slack/GitHub Sync | ✅ Production Ready |

### 📋 Final 4-Step Production Deployment Checklist:
1. **Chrome Web Store Group Publisher Publishing**: Publish extension under Coptic IT Group Publisher account for silent auto-updates.
2. **Google Cloud Quota Tier**: Confirm Workspace OAuth / Gemini API key is linked to Coptic Hospital's quota tier.
3. **Laminated Station Cheat Sheets**: Print 2-3 copies of [`WORKFLOW_GUIDE.md`](WORKFLOW_GUIDE.md) at OPD & Ward workstations.
4. **Deploy Webhook Gateway**: Deploy the 2-minute Apps Script URL ([`SLACK_GITHUB_INTEGRATION.md`](SLACK_GITHUB_INTEGRATION.md)) to connect the hospital Slack channel.

---

## 🛡️ Phase 5: Future Post-MVP Roadmap (Q4 2026+)

- [ ] **Drug-Drug Interaction Alerting**: Warning engine cross-referencing newly typed prescriptions against past EHR orders.
- [ ] **Abnormal Lab Trend Flagger**: Highlights declining lab metrics (e.g. dropping Hemoglobin, rising Creatinine) across patient visits.
- [ ] **Anonymized Hospital Insights**: Aggregated diagnostic metrics for Coptic Hospital clinical administration.
