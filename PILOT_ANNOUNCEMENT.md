# 🏥 Coptic Gemini Assistant — Early Clinical Pilot Guide

Welcome to the early pilot program for **Coptic Gemini Assistant** (v3.0)! 

This Chrome extension is designed specifically for clinicians at **Coptic Hospital (Lusaka, Zambia)** to provide real-time, context-aware AI decision support and hands-free note dictation directly inside the **Unumed EHR** platform.

---

## 💡 What is Coptic Gemini Assistant?

Coptic Gemini Assistant is a browser sidekick that works seamlessly alongside Unumed. It automatically reads patient chart data (vitals, lab results, active medications) and synthesizes your clinical observations into structured **SOAP Notes**, **ICD-10 Diagnostic Codes**, and **Zambian STG Dosing Recommendations** in seconds.

All recommendations are strictly grounded in the **Zambia Standard Treatment Guidelines (STG)**, National ART/Malaria Protocols, and local pediatric/adult dosing frameworks.

---

## 🌟 Key Capabilities & Where It Helps

| Clinical Challenge | How Coptic Gemini Assistant Helps |
| :--- | :--- |
| **Time-consuming manual charting** | **Structured SOAP Generator**: Converts brief dictations or jotted notes into clean Subjective, Objective, Assessment, and Plan notes with 1-click insertion into Unumed. |
| **Manual weight-based dosage math** | **Zambian STG Dosing Calculator**: Automatically computes weight-tiered dosages for Coartem, Paracetamol, Amoxicillin, and Pediatric ART based on patient weight. |
| **Searching for ICD-10 billing codes** | **Interactive ICD-10 Code Chips**: Proposes relevant ICD-10 codes (e.g., `B50.9`) with 1-click copy buttons for diagnostic entry. |
| **Slow typing during busy rounds** | **`🎙️ Dictate` Voice-to-Text Button**: Speak your notes hands-free directly into Unumed text boxes. |
| **Unfamiliar or complex guidelines** | **Point-of-Care Q&A Chat**: Ask follow-up questions (e.g. *"What is 2nd-line malaria treatment if Coartem fails?"*) in an interactive chat drawer. |
| **Patient Data Security** | **Built-in De-Identification**: Automatically redacts Zambian NRC numbers, patient names, and phone numbers before AI processing. |

---

## 📋 Real-World Clinical Examples

### Example 1: Pediatric Acute Fever & Malaria Round
* **Scenario**: 3-year-old child presenting with fever (38.8°C), vomiting, and lethargy. Weight is 21 kg. RDT positive for *P. falciparum*.
* **How Assistant Helps**:
  1. Click **`✨ Gemini Assist`** inside Unumed.
  2. The Assistant reads the weight (`21kg`) and RDT result automatically.
  3. **STG Dosing Calculator** outputs: *Artemether-Lumefantrine (Coartem): 2 tablets Twice Daily x 3 days*.
  4. **ICD-10 Chip**: `B50.9 - Plasmodium falciparum malaria`.
  5. Click **"Insert SOAP Note into EHR"** to populate the chart note instantly.

### Example 2: Hands-Free Voice Dictation on Ward Rounds
* **Scenario**: On busy ward rounds with limited time to type.
* **How Assistant Helps**:
  1. Click the **`🎙️ Dictate`** button next to any progress note box.
  2. Speak your observations: *"Patient reporting headache and cough, chest clear on auscultation."*
  3. Click **`✨ Gemini Assist`** to format your speech into a structured SOAP note!

---

## 🚀 Quick Setup & Installation Guide

For complete, step-by-step installation instructions, view our official [**Installation & Setup Guide (`README.md`)**](README.md).

### Step 1: Install the Extension (1 Minute)
1. Download and unzip **[`coptic-gemini-assist-v3.0.zip`](coptic-gemini-assist-v3.0.zip)** onto your computer.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in top right corner).
4. Click **Load unpacked** and select the unzipped `coptic-gemini-extension` folder.

### Step 2: Authenticate (Google Workspace EDU)
1. Click the extension icon in the top right of Chrome to open the popup.
2. Click **`🌐 Sign in with Google Workspace`** (or click **`🔑 Get Free Key from Google AI Studio`** to save your hospital Google key).
3. Select your `@coptichospital.org` account.

### Step 3: Test Without Changing Live EHR Records
* Open the built-in offline simulator:
  👉 [**Open Local Test Workbench (`test.html`)**](test.html)
* Practice dictating notes, generating SOAP notes, and testing the dosing calculator safely!

---

## 💬 Pilot Feedback & Support

Your feedback as an early pilot clinician is essential to refining this tool for the entire hospital team!

* **Slack Pilot Channel**: `#coptic-gemini-assist-pilot`
* **Direct Feedback / Feature Requests**: Contact the IT & Clinical AI Project Lead.
* **Diagnostic Log**: If you encounter any issues, open the extension popup and click **`📋 Copy Diagnostic Log`** to send us diagnostic telemetry.

Thank you for helping shape the future of digital health at Coptic Hospital! 🏥✨
