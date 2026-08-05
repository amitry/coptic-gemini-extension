const isAllowedDomain = window.location.hostname.includes("unumed.net") || window.location.protocol === "file:";
if (isAllowedDomain && !window.hasCopticExtensionRun) {
  window.hasCopticExtensionRun = true;

  console.log("Coptic Assistant Running on Unumed!");

  // --- Comprehensive 5-Category Patient Context Cache ---
  let activePatientContext = {
    patientId: null,
    demographics: {},
    vitals: {},
    labs: [],
    imaging: [],
    medications: [],
    documents: [],
    notes: []
  };

  function updatePatientContextFromPayload(eventData) {
    const res = eventData.responseBody?.data;
    if (!res) return;

    // 1. Demographics & Session Info
    const patientSession = res.ehrEntry?.clinicalNote?.patientSession || res.patientEhrCard?.patientSession;
    if (patientSession?.patient) {
      const p = patientSession.patient;
      if (activePatientContext.patientId !== p.id) {
        // Reset context for new patient
        activePatientContext = {
          patientId: p.id,
          demographics: {},
          vitals: {},
          labs: [],
          imaging: [],
          medications: [],
          documents: [],
          notes: []
        };
      }
      activePatientContext.demographics = {
        mrn: p.medicalRecordNumber || "N/A",
        gender: p.genderString || "N/A",
        birthDate: p.birthDate ? new Date(p.birthDate).toLocaleDateString() : "N/A",
        payer: patientSession._payer || "N/A"
      };
    }

    // 2. Vitals & Anthropometrics
    const anthro = res.ehrEntry?.clinicalNote?.anthropometric;
    if (anthro) {
      if (anthro.weight) activePatientContext.vitals.weight = `${anthro.weight} kg`;
      if (anthro.height) activePatientContext.vitals.height = `${anthro.height} cm`;
      if (anthro.bmi) activePatientContext.vitals.bmi = `${anthro.bmi}`;
    }

    // 3. Laboratory Reports
    const labList = res.searchPatientEhrLab?.result || res.patientEhrLabList?.result;
    if (Array.isArray(labList)) {
      labList.forEach(lab => {
        const name = lab.userProcedureName || lab.procedureName || lab.name;
        if (name) {
          const exists = activePatientContext.labs.some(l => l.name === name);
          if (!exists) {
            activePatientContext.labs.push({
              name: name,
              date: lab.createdDate ? new Date(lab.createdDate).toLocaleDateString() : "Recent",
              by: lab.createdByUser?.fullName || "Staff",
              details: lab.resultText || lab.findings || lab.value || ""
            });
          }
        }
      });
    }

    const singleLab = res.ehrEntry?.labReport || res.patientEhrLabReport;
    if (singleLab?.userProcedureName || singleLab?.name) {
      const name = singleLab.userProcedureName || singleLab.name;
      const lines = singleLab.reportLines || [];
      const formattedLines = lines.map(rl => `${rl.attributeName || rl.name}: ${rl.value} (${rl.referenceRange || 'N/A'})`).join("; ");
      const exists = activePatientContext.labs.find(l => l.name === name);
      if (exists) {
        exists.details = formattedLines || singleLab.laboratoryFindings || "PDF/Report available";
      } else {
        activePatientContext.labs.push({
          name: name,
          date: "Recent",
          details: formattedLines || singleLab.laboratoryFindings || "PDF/Report available"
        });
      }
    }

    // 4. Imaging Reports (X-Ray, Ultrasound, CT, MRI, ECG)
    const imagingList = res.searchPatientEhrImaging?.result || res.patientEhrImagingList?.result || res.ehrEntry?.imagingReport;
    if (Array.isArray(imagingList)) {
      imagingList.forEach(img => {
        const title = img.userProcedureName || img.procedureName || img.title || img.name;
        if (title) {
          const exists = activePatientContext.imaging.some(i => i.title === title);
          if (!exists) {
            activePatientContext.imaging.push({
              title: title,
              date: img.createdDate ? new Date(img.createdDate).toLocaleDateString() : "Recent",
              findings: img.findings || img.impression || img.reportText || "Report attached"
            });
          }
        }
      });
    } else if (imagingList && typeof imagingList === "object") {
      const title = imagingList.userProcedureName || imagingList.name || "Imaging Report";
      const exists = activePatientContext.imaging.some(i => i.title === title);
      if (!exists) {
        activePatientContext.imaging.push({
          title: title,
          date: "Recent",
          findings: imagingList.findings || imagingList.impression || "Report attached"
        });
      }
    }

    // 5. Medication Lists & Active Orders
    const ordersList = res.patientPastOrders?.result || res.patientOngoingOrders?.result || res.patientPackageOrders?.result || res.patientPrescriptions?.result;
    if (Array.isArray(ordersList)) {
      ordersList.forEach(ord => {
        const name = ord.userProcedureName || ord.name || ord.medicationName;
        if (name) {
          const exists = activePatientContext.medications.some(m => m.name === name);
          if (!exists) {
            activePatientContext.medications.push({
              name: name,
              dosage: ord.dosage || ord.instructions || "",
              date: ord.createdDate ? new Date(ord.createdDate).toLocaleDateString() : "Active"
            });
          }
        }
      });
    }

    // 6. External Documents & Attachments
    const docList = res.searchPatientEhrDocument?.result || res.patientExternalDocuments?.result || res.patientAttachments?.result;
    if (Array.isArray(docList)) {
      docList.forEach(doc => {
        const title = doc.fileName || doc.documentTitle || doc.name;
        if (title) {
          const exists = activePatientContext.documents.some(d => d.title === title);
          if (!exists) {
            activePatientContext.documents.push({
              title: title,
              type: doc.documentType || "External PDF/File",
              date: doc.createdDate ? new Date(doc.createdDate).toLocaleDateString() : "Recent"
            });
          }
        }
      });
    }

    // 7. Clinical Notes & Triage
    const notesList = res.searchPatientEhrNotes?.result || res.patientNotes?.result;
    if (Array.isArray(notesList)) {
      notesList.forEach(n => {
        if (n.createdByUser?.fullName || n.noteText || n.content) {
          const exists = activePatientContext.notes.some(existing => existing.id === n.id);
          if (!exists) {
            activePatientContext.notes.push({
              id: n.id || Math.random().toString(),
              author: n.createdByUser?.fullName || "Clinician",
              date: n.createdDate ? new Date(n.createdDate).toLocaleDateString() : "N/A",
              text: n.noteText || n.content || ""
            });
          }
        }
      });
    }
  }

  // Scrape rendered DOM elements as fallback
  function scrapeDOMPatientContext() {
    try {
      // Scrape DOM tables for Lab Results
      const labRows = document.querySelectorAll('.lab-row, table.lab-table tbody tr, .lab-result-item');
      labRows.forEach(row => {
        const text = row.innerText.trim();
        if (text && text.length > 5 && !activePatientContext.labs.some(l => l.name.includes(text.substring(0, 15)))) {
          activePatientContext.labs.push({ name: text.replace(/\s+/g, ' '), date: "DOM Rendered" });
        }
      });

      // Scrape DOM for Imaging
      const imgElements = document.querySelectorAll('.imaging-report, .radiology-card, [data-type="imaging"]');
      imgElements.forEach(el => {
        const text = el.innerText.trim();
        if (text && !activePatientContext.imaging.some(i => i.title.includes(text.substring(0, 15)))) {
          activePatientContext.imaging.push({ title: text.replace(/\s+/g, ' '), findings: "From Unumed Screen" });
        }
      });
    } catch (e) {
      console.warn("DOM context scrape warning:", e);
    }
  }

  function buildFormattedPatientContext() {
    scrapeDOMPatientContext();

    const demo = activePatientContext.demographics;
    const vitals = activePatientContext.vitals;
    const labs = activePatientContext.labs;
    const imaging = activePatientContext.imaging;
    const notes = activePatientContext.notes;
    const meds = activePatientContext.medications;
    const docs = activePatientContext.documents;

    let parts = [];
    if (demo.mrn) {
      parts.push(`1. PATIENT PROFILE: MRN: ${demo.mrn} | Sex: ${demo.gender} | DOB: ${demo.birthDate} | Payer: ${demo.payer}`);
    }
    if (Object.keys(vitals).length > 0) {
      const vStr = Object.entries(vitals).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(" | ");
      parts.push(`2. VITALS & ANTHROPOMETRICS: ${vStr}`);
    }
    if (meds.length > 0) {
      const mStr = meds.slice(0, 8).map(m => `${m.name}${m.dosage ? ' (' + m.dosage + ')' : ''} [${m.date}]`).join(", ");
      parts.push(`3. MEDICATION LIST & ORDERS: ${mStr}`);
    }
    if (labs.length > 0) {
      const lStr = labs.slice(0, 8).map(l => l.details ? `${l.name} [${l.details}]` : `${l.name} (${l.date})`).join("; ");
      parts.push(`4. LABORATORY REPORTS: ${lStr}`);
    }
    if (imaging.length > 0) {
      const iStr = imaging.slice(0, 5).map(i => `${i.title} (${i.date}) - Findings: ${i.findings}`).join("; ");
      parts.push(`5. IMAGING & RADIOLOGY REPORTS: ${iStr}`);
    }
    if (docs.length > 0) {
      const dStr = docs.slice(0, 5).map(d => `${d.title} (${d.type}, ${d.date})`).join("; ");
      parts.push(`6. EXTERNAL DOCUMENTS & ATTACHMENTS: ${dStr}`);
    }
    if (notes.length > 0) {
      const nStr = notes.slice(0, 5).map(n => `[${n.date} by ${n.author}]: ${n.text ? n.text.substring(0, 100) : 'Note filed'}`).join("; ");
      parts.push(`7. CLINICAL NOTES & TRIAGE: ${nStr}`);
    }

    if (parts.length === 0) return "";
    return `\n\n=== EXTRACTED EHR PATIENT CONTEXT (5 CATEGORIES) ===\n${parts.join("\n")}\n======================================================\n`;
  }

  // 1. Listen for network events from interceptor.js
  window.addEventListener("message", (event) => {
    if (event.data?.type === "UNUMED_RECON_DATA") {
      updatePatientContextFromPayload(event.data);

      chrome.storage.local.get(['unumedReconLog'], (result) => {
        const currentLog = result.unumedReconLog || [];
        
        const opKey = event.data.graphqlOperation ? `[GQL:${event.data.graphqlOperation}]` : `[${event.data.method}]`;
        const uniqueKey = `${opKey} ${event.data.endpoint}`;

        const existingIndex = currentLog.findIndex(item => {
          const itemKey = item.graphqlOperation ? `[GQL:${item.graphqlOperation}] ${item.endpoint}` : `[${item.method}] ${item.endpoint}`;
          return itemKey === uniqueKey;
        });

        if (existingIndex >= 0) {
          currentLog[existingIndex] = event.data;
        } else {
          currentLog.push(event.data);
        }

        chrome.storage.local.set({ unumedReconLog: currentLog });
        console.log("📍 Discovered/Updated Unumed Payload:", uniqueKey);
      });
    }
  });

  // 2. System Prompt & Gemini API integration
  const ZAMBIA_CLINICAL_SYSTEM_PROMPT = `
You are an expert clinical decision support assistant at Coptic Hospital in Lusaka, Zambia.
Synthesize clinician notes and extracted patient EHR context into a structured SOAP Note and ICD-10 Coding recommendation.

Always follow this EXACT output format:

### ICD10_CODES
Provide 1 to 4 relevant ICD-10 codes based on findings. Format each code on its own line:
[CODE] - [Description]

### SUBJECTIVE (S)
Bullet points summarizing chief complaints, symptoms, duration, and patient history.

### OBJECTIVE (O)
Synthesized bullet points of vitals (weight, temp, BP, pulse, BMI), lab report metrics, and imaging.

### ASSESSMENT (A)
Differential diagnoses and clinical reasoning grounded strictly in the Zambia Standard Treatment Guidelines (STG) and National ART/Malaria Protocols.

### PLAN (P)
Actionable bullet points for diagnostic investigations, first-line Zambian STG medication regimens (with dosage/route), and follow-up.
`;

  function formatClinicalResponseHTML(rawText) {
    let html = rawText;

    // Extract & render ICD-10 Section
    let icd10SectionHtml = "";
    const icd10Match = rawText.match(/### ICD10_CODES([\s\S]*?)(?=###|$)/i);
    if (icd10Match && icd10Match[1]) {
      const lines = icd10Match[1].trim().split("\n").filter(l => l.trim().length > 0);
      const chipsHtml = lines.map(line => {
        const cleanLine = line.replace(/^[*\-\s]+/, "").trim();
        const parts = cleanLine.split(" - ");
        const code = parts[0] ? parts[0].trim() : cleanLine;
        const desc = parts[1] ? parts[1].trim() : "";
        return `<button type="button" class="gemini-icd10-chip" data-code="${code}" onclick="navigator.clipboard.writeText('${code}'); this.innerText='✓ Copied ${code}'; setTimeout(() => this.innerText='📋 ${code}${desc ? ' - ' + desc : ''}', 1500);">📋 ${code}${desc ? ' - ' + desc : ''}</button>`;
      }).join("");

      if (chipsHtml) {
        icd10SectionHtml = `
          <div class="gemini-icd10-section">
            <div class="gemini-icd10-title">🏷️ Suggested ICD-10 Diagnostic Codes (Click chip to copy code):</div>
            <div class="gemini-icd10-chips">${chipsHtml}</div>
          </div>
        `;
      }
    }

    // Remove raw ICD10 block from body text
    let cleanText = rawText.replace(/### ICD10_CODES[\s\S]*?(?=###|$)/i, "").trim();

    // Format SOAP Section Headers
    cleanText = cleanText.replace(/### (SUBJECTIVE \(S\)|SUBJECTIVE)/gi, '<div class="gemini-soap-card"><div class="gemini-soap-header">📋 Subjective (S)</div>');
    cleanText = cleanText.replace(/### (OBJECTIVE \(O\)|OBJECTIVE)/gi, '</div><div class="gemini-soap-card"><div class="gemini-soap-header">🩺 Objective (O)</div>');
    cleanText = cleanText.replace(/### (ASSESSMENT \(A\)|ASSESSMENT)/gi, '</div><div class="gemini-soap-card"><div class="gemini-soap-header">🧠 Assessment (A) - Zambian STG</div>');
    cleanText = cleanText.replace(/### (PLAN \(P\)|PLAN)/gi, '</div><div class="gemini-soap-card"><div class="gemini-soap-header">💊 Plan (P) - Treatment Protocol</div>');

    if (cleanText.includes('gemini-soap-card')) {
      cleanText += '</div>';
    }

    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    cleanText = cleanText.replace(/\n/g, '<br>');

    // Automatically check for patient weight in context or note
    let calcHtml = "";
    if (activePatientContext?.vitals?.weight) {
      calcHtml = computeZambianSTGDosages(activePatientContext.vitals.weight);
    } else {
      const weightMatch = rawText.match(/\b(?:weight|wt|wtd)[\s:]*(\d+(?:\.\d+)?)\s*kg\b/i);
      if (weightMatch && weightMatch[1]) {
        calcHtml = computeZambianSTGDosages(parseFloat(weightMatch[1]));
      }
    }

    return `${calcHtml}${icd10SectionHtml}${cleanText}`;
  }

  // Phase 3: Zambian STG Weight-Based Dosing Calculator
  function computeZambianSTGDosages(weightKg) {
    if (!weightKg || isNaN(weightKg) || weightKg <= 0) return "";

    let coartemDose = "";
    if (weightKg < 15) coartemDose = "1 tablet Twice Daily x 3 days";
    else if (weightKg < 25) coartemDose = "2 tablets Twice Daily x 3 days";
    else if (weightKg < 35) coartemDose = "3 tablets Twice Daily x 3 days";
    else coartemDose = "4 tablets Twice Daily x 3 days";

    const paracetamolLow = Math.round(weightKg * 10);
    const paracetamolHigh = Math.round(weightKg * 15);

    const amoxLow = Math.round((weightKg * 20) / 3);
    const amoxHigh = Math.round((weightKg * 40) / 3);

    return `
      <div class="gemini-calc-box">
        <div class="gemini-calc-header">🧮 Zambian STG Dosing Calculator (Patient Weight: ${weightKg} kg)</div>
        <div class="gemini-calc-row">
          <span><b>Artemether-Lumefantrine (Coartem)</b>:</span>
          <span><b>${coartemDose}</b></span>
        </div>
        <div class="gemini-calc-row">
          <span><b>Paracetamol Syrup/Tab (10-15 mg/kg QID)</b>:</span>
          <span><b>${paracetamolLow}mg - ${paracetamolHigh}mg QID</b> (max 4x/day)</span>
        </div>
        <div class="gemini-calc-row">
          <span><b>Amoxicillin (20-40 mg/kg/day TID)</b>:</span>
          <span><b>${amoxLow}mg - ${amoxHigh}mg TID</b> x 5-7 days</span>
        </div>
      </div>
    `;
  }

  function deidentifyText(text) {
    let clean = text;
    clean = clean.replace(/\b\d{6}\/\d{2}\/\d{1}\b/g, "[REDACTED NRC]");
    clean = clean.replace(/(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, "[PATIENT NAME]");
    clean = clean.replace(/\b(?:\+?260|0)[79]\d{8}\b/g, "[PHONE NUMBER]");
    return clean;
  }

  async function callGemini(authConfig, promptText, modelName = "gemini-3.6-flash") {
    const sanitizedPrompt = deidentifyText(promptText);
    const targetModel = modelName || "gemini-3.6-flash";
    
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`;
    const headers = { "Content-Type": "application/json" };

    if (authConfig?.googleAuthToken) {
      headers["Authorization"] = `Bearer ${authConfig.googleAuthToken}`;
    } else if (authConfig?.apiKey) {
      url += `?key=${authConfig.apiKey}`;
    } else {
      throw new Error("Authentication missing! Please sign in with Google Workspace or save an API key in the popup.");
    }

    const payload = {
      contents: [{ parts: [{ text: sanitizedPrompt }] }],
      systemInstruction: { parts: [{ text: ZAMBIA_CLINICAL_SYSTEM_PROMPT }] }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detailedMessage = errorData.error?.message || response.statusText;
      throw new Error(`API Error ${response.status}: ${detailedMessage}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  }

  // --- Robust Copy & Multi-Field Auto-Fill Utilities ---

  function copyToClipboardRobust(text, btnElement = null) {
    if (!text) return;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopySuccess(btnElement);
      }).catch(err => {
        fallbackCopyText(text, btnElement);
      });
    } else {
      fallbackCopyText(text, btnElement);
    }
  }

  function fallbackCopyText(text, btnElement) {
    const hiddenTextArea = document.createElement("textarea");
    hiddenTextArea.value = text;
    hiddenTextArea.style.position = "fixed";
    hiddenTextArea.style.left = "-9999px";
    hiddenTextArea.style.top = "-9999px";
    document.body.appendChild(hiddenTextArea);
    hiddenTextArea.focus();
    hiddenTextArea.select();
    try {
      document.execCommand("copy");
      showCopySuccess(btnElement);
    } catch(err) {
      alert("Copy failed. Please manually select and copy the text.");
    } finally {
      document.body.removeChild(hiddenTextArea);
    }
  }

  function showCopySuccess(btnElement) {
    if (btnElement) {
      const origText = btnElement.innerText;
      btnElement.innerText = "✓ Copied to Clipboard!";
      setTimeout(() => { btnElement.innerText = origText; }, 2000);
    } else {
      alert("Copied to clipboard!");
    }
  }

  // Multi-Field Smart Form Auto-Filler (Current Page + Cross-Page Auto-Fill Queue)
  function smartFillEHRForm(soapText, targetArea) {
    const subjective = extractSectionText(soapText, "SUBJECTIVE");
    const objective = extractSectionText(soapText, "OBJECTIVE");
    const assessment = extractSectionText(soapText, "ASSESSMENT");
    const plan = extractSectionText(soapText, "PLAN");
    const icd10 = extractICD10Text(soapText);

    const queueRecord = {
      subjective, objective, assessment, plan, icd10,
      enabled: true,
      timestamp: Date.now()
    };

    chrome.storage.local.set({ activeSmartFillQueue: queueRecord }, () => {
      const filledCount = performPageAutoFill(queueRecord, targetArea);
      if (filledCount > 0) {
        showSmartFillToast(`🎯 Smart Filled ${filledCount} field(s) on this page! Auto-fill active across tabs & sections.`);
      } else {
        showSmartFillToast(`🎯 Cross-Page Auto-Fill Active! Navigate to any tab or section in Unumed to fill fields automatically.`);
      }
    });
  }

  function performPageAutoFill(queue, targetArea) {
    if (!queue || !queue.enabled) return 0;
    const fields = Array.from(document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]'));
    let filledCount = 0;

    fields.forEach(field => {
      if (field.id === "gemini-modal-input" || field.id === "gemini-chat-input" || field.dataset.geminiFilled) return;
      const labelText = getFieldLabelContext(field).toLowerCase();
      const currentVal = field.value !== undefined ? field.value : field.innerText;
      if (currentVal && currentVal.trim().length > 0) return;

      let sectionFilled = "";
      if (queue.subjective && (labelText.includes("subjective") || labelText.includes("hpi") || labelText.includes("history") || labelText.includes("complaint"))) {
        fillFieldValue(field, queue.subjective);
        sectionFilled = "Subjective / HPI";
        filledCount++;
      } else if (queue.objective && (labelText.includes("objective") || labelText.includes("exam") || labelText.includes("vitals") || labelText.includes("findings"))) {
        fillFieldValue(field, queue.objective);
        sectionFilled = "Objective / Exam";
        filledCount++;
      } else if (queue.assessment && (labelText.includes("assessment") || labelText.includes("diagnosis") || labelText.includes("impression") || labelText.includes("problem"))) {
        fillFieldValue(field, queue.assessment);
        sectionFilled = "Assessment / Diagnosis";
        filledCount++;
      } else if (queue.plan && (labelText.includes("plan") || labelText.includes("treatment") || labelText.includes("rx") || labelText.includes("medication") || labelText.includes("order"))) {
        fillFieldValue(field, queue.plan);
        sectionFilled = "Plan / Orders";
        filledCount++;
      } else if (queue.icd10 && (labelText.includes("icd") || labelText.includes("code") || labelText.includes("diagnostic"))) {
        fillFieldValue(field, queue.icd10);
        sectionFilled = "ICD-10 Code";
        filledCount++;
      }

      if (sectionFilled) {
        field.dataset.geminiFilled = "true";
      }
    });

    if (filledCount === 0 && targetArea && queue.subjective && !targetArea.dataset.geminiFilled) {
      fillFieldValue(targetArea, queue.subjective);
      targetArea.dataset.geminiFilled = "true";
      filledCount++;
    }

    return filledCount;
  }

  function checkAndAutoFillCurrentPageFields() {
    chrome.storage.local.get(['activeSmartFillQueue'], (res) => {
      const queue = res.activeSmartFillQueue;
      if (queue && queue.enabled && (Date.now() - queue.timestamp < 3600000)) {
        const filled = performPageAutoFill(queue, null);
        if (filled > 0) {
          showSmartFillToast(`🎯 Auto-filled ${filled} field(s) on this section!`);
        }
      }
    });
  }

  function showSmartFillToast(msg) {
    let toast = document.getElementById("gemini-toast-msg");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "gemini-toast-msg";
      toast.className = "gemini-toast";
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.style.display = "flex";
    setTimeout(() => {
      if (toast) toast.style.display = "none";
    }, 4000);
  }

  function extractSectionText(rawText, sectionName) {
    const regex = new RegExp(`### ${sectionName}[\\s\\S]*?(?=###|$)`, "i");
    const match = rawText.match(regex);
    if (!match) return "";
    return match[0].replace(/### [^\n]+\n/i, "").replace(/\*\*/g, "").trim();
  }

  function extractICD10Text(rawText) {
    const match = rawText.match(/### ICD10_CODES([\s\S]*?)(?=###|$)/i);
    if (!match || !match[1]) return "";
    return match[1].trim().split("\n").map(l => l.replace(/^[*\-\s]+/, "").trim()).join(", ");
  }

  function getFieldLabelContext(field) {
    let context = (field.placeholder || "") + " " + (field.name || "") + " " + (field.id || "") + " " + (field.getAttribute("aria-label") || "");
    if (field.labels && field.labels.length > 0) {
      context += " " + field.labels[0].innerText;
    }
    if (field.parentElement) {
      context += " " + field.parentElement.innerText;
    }
    return context;
  }

  function fillFieldValue(field, text) {
    if (field.value !== undefined) {
      field.value = text;
    } else {
      field.innerText = text;
    }
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Persistent Analysis Storage & Floating FAB Badge
  function savePersistentAnalysis(resultText, rawInputText) {
    const record = {
      text: resultText,
      inputText: rawInputText,
      timestamp: Date.now()
    };
    chrome.storage.local.set({ lastAnalysisRecord: record }, () => {
      updateFABSavedState(true);
    });
  }

  function updateFABSavedState(hasSaved) {
    const fab = document.getElementById("gemini-fab-btn");
    if (!fab) return;
    if (hasSaved) {
      fab.classList.add("has-saved");
      fab.innerHTML = `✨ Coptic Gemini Assistant <span style="background:#fef08a; color:#854d0e; padding:2px 6px; border-radius:10px; font-size:10px; margin-left:4px;">📜 Saved Analysis Available</span>`;
    } else {
      fab.classList.remove("has-saved");
      fab.innerHTML = `✨ Coptic Gemini Assistant`;
    }
  }

  // Phase 2: Web Speech API Voice Dictation Engine
  function setupVoiceDictation(targetElement, dictateBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dictateBtn.style.display = "none";
      console.warn("Web Speech API not supported in this browser.");
      return;
    }

    let recognition = null;
    let isListening = false;

    dictateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (isListening && recognition) {
        recognition.stop();
        return;
      }

      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        let finalTranscript = "";
        const initialVal = targetElement.value !== undefined ? targetElement.value : targetElement.innerText;
        if (initialVal.trim()) {
          finalTranscript = initialVal.trim() + " ";
        }

        recognition.onstart = () => {
          isListening = true;
          dictateBtn.classList.add("recording");
          dictateBtn.innerHTML = `🔴 Listening... (Click to Stop)`;
        };

        recognition.onresult = (event) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript + interimTranscript;
          if (targetElement.value !== undefined) {
            targetElement.value = currentText;
          } else {
            targetElement.innerText = currentText;
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          if (event.error !== "no-speech") {
            alert(`Voice Dictation Error: ${event.error}`);
          }
          stopDictation();
        };

        recognition.onend = () => {
          stopDictation();
        };

        function stopDictation() {
          isListening = false;
          dictateBtn.classList.remove("recording");
          dictateBtn.innerHTML = `🎙️ Dictate`;
        }

        recognition.start();
      } catch(err) {
        console.error("Failed to start speech recognition:", err);
        alert(`Mic access error: ${err.message}`);
      }
    });
  }

  function injectGeminiButtons() {
    const textareas = document.querySelectorAll("textarea, [contenteditable='true']");
    
    textareas.forEach((area) => {
      if (area.dataset.geminiInjected) return;
      area.dataset.geminiInjected = "true";

      const container = document.createElement("div");
      container.style.display = "inline-flex";
      container.style.alignItems = "center";
      container.style.gap = "6px";

      const btn = document.createElement("button");
      btn.innerText = "✨ Gemini Assist";
      btn.className = "gemini-assist-btn";
      btn.type = "button";

      const dictateBtn = document.createElement("button");
      dictateBtn.innerHTML = "🎙️ Dictate";
      dictateBtn.className = "gemini-dictate-btn";
      dictateBtn.type = "button";

      setupVoiceDictation(area, dictateBtn);

      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const userText = area.value || area.innerText;

        if (!userText.trim()) {
          alert("Please enter, paste, or dictate clinical notes first.");
          return;
        }

        chrome.storage.sync.get(['geminiApiKey', 'googleAuthToken', 'selectedModel'], async (result) => {
          const apiKey = result.geminiApiKey;
          const googleAuthToken = result.googleAuthToken;
          const selectedModel = result.selectedModel || "gemini-3.6-flash";

          if (!apiKey && !googleAuthToken) {
            alert("Please sign in with your Google Workspace account or save an API key in the extension popup first!");
            return;
          }

          btn.innerText = "⏳ Analyzing...";
          btn.disabled = true;

          try {
            const ehrContext = buildFormattedPatientContext();
            const combinedPrompt = `Analyze these clinical notes according to Zambian guidelines:\n${userText}${ehrContext}`;
            
            const resultText = await callGemini({ apiKey, googleAuthToken }, combinedPrompt, selectedModel);
            showResultModal(resultText, area, Boolean(ehrContext));
          } catch (err) {
            alert(`Error: ${err.message}`);
          } finally {
            btn.innerText = "✨ Gemini Assist";
            btn.disabled = false;
          }
        });
      });

      container.appendChild(btn);
      container.appendChild(dictateBtn);

      area.parentNode.insertBefore(container, area.nextSibling);
    });
  }

  function injectFloatingAssistantButton() {
    if (document.getElementById("gemini-fab-btn")) return;

    const fab = document.createElement("button");
    fab.id = "gemini-fab-btn";
    fab.className = "gemini-fab";
    fab.type = "button";
    fab.innerHTML = `✨ Coptic Gemini Assistant`;

    fab.addEventListener("click", () => {
      openStandaloneAssistantModal();
    });

    document.body.appendChild(fab);
  }

  function openStandaloneAssistantModal() {
    let modal = document.getElementById("gemini-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "gemini-modal";
      modal.className = "gemini-modal-ui";
      document.body.appendChild(modal);
    }

    const ehrContext = buildFormattedPatientContext();
    const hasEhrContext = Boolean(ehrContext);

    const badgeHtml = hasEhrContext 
      ? `<div class="gemini-context-badge">✓ Active EHR Patient Context Attached (Demographics/Vitals/Labs)</div>`
      : `<div class="gemini-context-badge" style="background:#fffbe0; border-color:#ffe58f; color:#873800;">⚠️ No EHR chart context detected yet. Open a patient chart in Unumed to automatically load context.</div>`;

    modal.innerHTML = `
      <div class="gemini-modal-content">
        <h3>🏥 Coptic Hospital AI Clinical Assistant</h3>
        ${badgeHtml}
        <label style="font-weight: bold; font-size: 12px; display: block; margin-bottom: 6px;">Enter, Paste, or Dictate Clinical Observation:</label>
        <textarea id="gemini-modal-input" class="gemini-modal-textarea" placeholder="e.g. 3yo male presenting with fever 38.5C, cough, and reduced oral intake for 2 days..."></textarea>
        
        <div style="margin-bottom: 12px; display: flex; gap: 8px;">
          <button id="gemini-modal-run-btn" class="gemini-assist-btn" style="padding: 8px 16px; font-size: 13px;">✨ Run Clinical Assistant</button>
          <button id="gemini-modal-dictate-btn" class="gemini-dictate-btn" style="padding: 8px 16px; font-size: 13px; margin: 0;">🎙️ Dictate Note</button>
        </div>

        <div id="gemini-modal-result" class="gemini-modal-body" style="display: none; border-top: 1px solid #eee; padding-top: 12px;"></div>

        <!-- Phase 3: Point-of-Care Interactive Q&A Chat -->
        <div id="gemini-chat-section" class="gemini-chat-container" style="display: none;">
          <div class="gemini-chat-title">💬 Point-of-Care Clinical Q&A Chat (Ask Zambian STG follow-up questions)</div>
          <div id="gemini-chat-history" class="gemini-chat-history"></div>
          <div class="gemini-chat-input-bar">
            <input type="text" id="gemini-chat-input" placeholder="Ask follow-up question (e.g. What if RDT is negative? Pediatric ART dosing?)..." />
            <button id="gemini-chat-send-btn" class="gemini-assist-btn" style="margin: 0; padding: 6px 14px;">Send</button>
          </div>
        </div>

        <div class="gemini-modal-actions">
          <button id="gemini-feedback-btn" style="background:#f59e0b; color:white; border:none; margin-right: auto; padding: 6px 12px; font-weight: 600;">💬 Send Feedback</button>
          <button id="gemini-smartfill-btn" class="gemini-smartfill-btn" style="display: none;">🎯 Smart Fill EHR Forms</button>
          <button id="gemini-copy-btn" style="display: none;">📋 Copy SOAP Note</button>
          <button id="gemini-close-btn">Close</button>
        </div>
      </div>
    `;

    const inputArea = document.getElementById("gemini-modal-input");
    const runBtn = document.getElementById("gemini-modal-run-btn");
    const modalDictateBtn = document.getElementById("gemini-modal-dictate-btn");
    const feedbackBtn = document.getElementById("gemini-feedback-btn");
    const smartFillBtn = document.getElementById("gemini-smartfill-btn");
    const copyBtn = document.getElementById("gemini-copy-btn");
    const closeBtn = document.getElementById("gemini-close-btn");
    const chatSection = document.getElementById("gemini-chat-section");
    const chatHistory = document.getElementById("gemini-chat-history");
    const chatInput = document.getElementById("gemini-chat-input");
    const chatSendBtn = document.getElementById("gemini-chat-send-btn");

  function submitFrictionlessDoctorFeedback(comment, btnElement = null) {
    if (!comment || !comment.trim()) return;

    if (btnElement) btnElement.innerText = "⏳ Submitting...";

    const feedbackRecord = {
      id: "fb_" + Date.now(),
      text: comment.trim(),
      version: "3.7",
      url: window.location.href,
      date: new Date().toLocaleString()
    };

    chrome.storage.local.get(['doctorFeedbackLogs', 'githubFeedbackToken'], (res) => {
      const logs = res.doctorFeedbackLogs || [];
      logs.push(feedbackRecord);

      chrome.storage.local.set({ doctorFeedbackLogs: logs }, () => {
        // If GitHub Token is set by IT admin, silently post issue in background
        if (res.githubFeedbackToken) {
          fetch("https://api.github.com/repos/amitry/coptic-gemini-extension/issues", {
            method: "POST",
            headers: {
              "Authorization": `token ${res.githubFeedbackToken}`,
              "Content-Type": "application/json",
              "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
              title: `[Doctor Feedback] ${comment.trim().substring(0, 50)}...`,
              body: `### 🩺 Clinician Report\n${comment}\n\n---\n* **Version**: \`v3.7\`\n* **URL**: \`${window.location.href}\`\n* **Date**: \`${new Date().toLocaleString()}\``,
              labels: ["doctor-feedback", "triage"]
            })
          }).catch(err => console.warn("Background GitHub log silent error:", err));
        }

        alert("✓ Thank you! Your feedback has been sent directly to Coptic Hospital IT.");
        if (btnElement) btnElement.innerText = "✓ Feedback Sent!";
      });
    });
  }

    if (feedbackBtn) {
      feedbackBtn.onclick = () => {
        const comment = prompt("💬 Doctor Feedback / Bug Report:\nType your observation or request below (Sent directly to Coptic IT):");
        if (comment) {
          submitFrictionlessDoctorFeedback(comment, feedbackBtn);
        }
      };
    }

    setupVoiceDictation(inputArea, modalDictateBtn);

    let activeChatPromptContext = "";
    let activeResultText = "";

    // Load saved analysis if available
    chrome.storage.local.get(['lastAnalysisRecord'], (res) => {
      if (res.lastAnalysisRecord && res.lastAnalysisRecord.text) {
        updateFABSavedState(true);
        if (!inputArea.value.trim() && res.lastAnalysisRecord.inputText) {
          inputArea.value = res.lastAnalysisRecord.inputText;
        }
        activeResultText = res.lastAnalysisRecord.text;
        resultDiv.innerHTML = formatClinicalResponseHTML(activeResultText);
        resultDiv.style.display = "block";
        chatSection.style.display = "block";
        copyBtn.style.display = "inline-block";
        smartFillBtn.style.display = "inline-block";
      }
    });

    runBtn.onclick = async () => {
      const userText = inputArea.value.trim();
      if (!userText) {
        alert("Please type or paste clinical notes first.");
        return;
      }

      chrome.storage.sync.get(['geminiApiKey', 'googleAuthToken', 'selectedModel'], async (res) => {
        const apiKey = res.geminiApiKey;
        const googleAuthToken = res.googleAuthToken;
        const selectedModel = res.selectedModel || "gemini-3.6-flash";

        if (!apiKey && !googleAuthToken) {
          alert("Please sign in with your Google Workspace account or save an API key in the extension popup first!");
          return;
        }

        runBtn.innerText = "⏳ Analyzing...";
        runBtn.disabled = true;

        try {
          const freshContext = buildFormattedPatientContext();
          activeChatPromptContext = `Clinician Note: ${userText}\n${freshContext}`;
          const combinedPrompt = `Analyze these clinical notes according to Zambian guidelines:\n${userText}${freshContext}`;
          const resultText = await callGemini({ apiKey, googleAuthToken }, combinedPrompt, selectedModel);
          
          activeResultText = resultText;
          savePersistentAnalysis(resultText, userText);

          const formattedHtml = formatClinicalResponseHTML(resultText);
          resultDiv.innerHTML = formattedHtml;
          resultDiv.style.display = "block";
          chatSection.style.display = "block";
          copyBtn.style.display = "inline-block";
          smartFillBtn.style.display = "inline-block";

        } catch (err) {
          alert(`Error: ${err.message}`);
        } finally {
          runBtn.innerText = "✨ Run Clinical Assistant";
          runBtn.disabled = false;
        }
      });
    };

    copyBtn.onclick = () => {
      const plainSOAP = activeResultText.replace(/### ICD10_CODES[\s\S]*?(?=###|$)/i, "").trim();
      copyToClipboardRobust(plainSOAP, copyBtn);
    };

    smartFillBtn.onclick = () => {
      smartFillEHRForm(activeResultText, null);
    };

    // Phase 3: Interactive Q&A Chat Handler
    async function sendChatMessage() {
      const question = chatInput.value.trim();
      if (!question) return;

      chatInput.value = "";
      
      const userBubble = document.createElement("div");
      userBubble.className = "gemini-chat-bubble gemini-chat-user";
      userBubble.innerText = question;
      chatHistory.appendChild(userBubble);
      chatHistory.scrollTop = chatHistory.scrollHeight;

      const aiBubble = document.createElement("div");
      aiBubble.className = "gemini-chat-bubble gemini-chat-ai";
      aiBubble.innerText = "⏳ Thinking...";
      chatHistory.appendChild(aiBubble);
      chatHistory.scrollTop = chatHistory.scrollHeight;

      chrome.storage.sync.get(['geminiApiKey', 'googleAuthToken', 'selectedModel'], async (res) => {
        const apiKey = res.geminiApiKey;
        const googleAuthToken = res.googleAuthToken;
        const selectedModel = res.selectedModel || "gemini-3.6-flash";

        try {
          const qPrompt = `Context:\n${activeChatPromptContext}\n\nClinician Follow-up Question: ${question}\n\nProvide a concise, direct clinical answer based on the Zambia Standard Treatment Guidelines (STG).`;
          const ansText = await callGemini({ apiKey, googleAuthToken }, qPrompt, selectedModel);
          aiBubble.innerHTML = ansText.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        } catch (err) {
          aiBubble.innerText = `Error: ${err.message}`;
        }
        chatHistory.scrollTop = chatHistory.scrollHeight;
      });
    }

    chatSendBtn.onclick = sendChatMessage;
    chatInput.onkeydown = (e) => {
      if (e.key === "Enter") sendChatMessage();
    };

    closeBtn.onclick = () => {
      modal.style.display = "none";
    };

    modal.style.display = "block";
  }

  function showResultModal(text, targetArea, hasEhrContext) {
    let modal = document.getElementById("gemini-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "gemini-modal";
      modal.className = "gemini-modal-ui";
      document.body.appendChild(modal);
    }

    savePersistentAnalysis(text, targetArea ? (targetArea.value || targetArea.innerText) : "");

    const badgeHtml = hasEhrContext 
      ? `<div class="gemini-context-badge">✓ Grounded with extracted EHR patient context (Labs/Vitals/Orders)</div>`
      : ``;

    const formattedHtml = formatClinicalResponseHTML(text);

    modal.innerHTML = `
      <div class="gemini-modal-content">
        <h3>🏥 Coptic Hospital AI Clinical Assistant</h3>
        ${badgeHtml}
        <div class="gemini-modal-body">${formattedHtml}</div>
        <div class="gemini-modal-actions">
          <button id="gemini-feedback-btn-res" style="background:#f59e0b; color:white; border:none; margin-right: auto; padding: 6px 12px; font-weight: 600;">💬 Send Feedback</button>
          <button id="gemini-smartfill-btn" class="gemini-smartfill-btn">🎯 Smart Fill EHR Forms</button>
          <button id="gemini-copy-btn">📋 Copy SOAP Note</button>
          <button id="gemini-close-btn">Close</button>
        </div>
      </div>
    `;

    const feedbackBtnRes = document.getElementById("gemini-feedback-btn-res");
    const copyBtn = document.getElementById("gemini-copy-btn");
    const smartFillBtn = document.getElementById("gemini-smartfill-btn");
    const closeBtn = document.getElementById("gemini-close-btn");

    if (feedbackBtnRes) {
      feedbackBtnRes.onclick = () => {
        const comment = prompt("💬 Doctor Feedback / Bug Report:\nType your observation or request below (Sent directly to Coptic IT):");
        if (comment) {
          submitFrictionlessDoctorFeedback(comment, feedbackBtnRes);
        }
      };
    }

    copyBtn.onclick = () => {
      const plainSOAP = text.replace(/### ICD10_CODES[\s\S]*?(?=###|$)/i, "").trim();
      copyToClipboardRobust(plainSOAP, copyBtn);
    };

    smartFillBtn.onclick = () => {
      smartFillEHRForm(text, targetArea);
    };

    closeBtn.onclick = () => {
      modal.style.display = "none";
    };

    modal.style.display = "block";
  }

  injectGeminiButtons();
  injectFloatingAssistantButton();
  checkAndAutoFillCurrentPageFields();

  const observer = new MutationObserver(() => {
    injectGeminiButtons();
    injectFloatingAssistantButton();
    checkAndAutoFillCurrentPageFields();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}