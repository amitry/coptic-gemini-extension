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

## 💬 Phase 3: Point-of-Care Interactive Q&A & Clinical Calculator

- [ ] **Interactive Clinical Q&A Sidekick Chat**: Sidekick drawer allowing doctors to ask follow-up questions about the active patient chart (e.g., *"What is the pediatric ART dosing for a 21kg child?"*).
- [ ] **Zambian STG Dosing & Protocol Calculator**: Instant weight-based drug dosage calculator aligned with the Zambia Standard Treatment Guidelines.

---

## 🛡️ Phase 4: Patient Safety & Hospital Analytics

- [ ] **Drug-Drug Interaction Alerting**: Warning engine cross-referencing newly typed prescriptions against past EHR orders.
- [ ] **Abnormal Lab Trend Flagger**: Highlights declining lab metrics (e.g. dropping Hemoglobin, rising Creatinine) across patient visits.
- [ ] **Anonymized Hospital Insights**: Aggregated diagnostic metrics for Coptic Hospital clinical administration.
