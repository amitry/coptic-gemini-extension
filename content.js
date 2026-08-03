const isAllowedDomain = window.location.hostname.includes("unumed.net") || window.location.protocol === "file:";
if (isAllowedDomain && !window.hasCopticExtensionRun) {
  window.hasCopticExtensionRun = true;

  console.log("Coptic Assistant Running on Unumed!");

  // --- Patient Context Cache ---
  let activePatientContext = {
    patientId: null,
    demographics: {},
    vitals: {},
    labs: [],
    medications: [],
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
          medications: [],
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

    // 3. Lab Results
    const labList = res.searchPatientEhrLab?.result;
    if (Array.isArray(labList)) {
      labList.forEach(lab => {
        if (lab.userProcedureName) {
          const exists = activePatientContext.labs.some(l => l.name === lab.userProcedureName);
          if (!exists) {
            activePatientContext.labs.push({
              name: lab.userProcedureName,
              date: lab.createdDate ? new Date(lab.createdDate).toLocaleDateString() : "Recent",
              by: lab.createdByUser?.fullName || "Staff"
            });
          }
        }
      });
    }

    const singleLab = res.ehrEntry?.labReport;
    if (singleLab?.userProcedureName) {
      const lines = singleLab.reportLines || [];
      const formattedLines = lines.map(rl => `${rl.attributeName || rl.name}: ${rl.value} (${rl.referenceRange || 'N/A'})`).join("; ");
      const exists = activePatientContext.labs.find(l => l.name === singleLab.userProcedureName);
      if (exists) {
        exists.details = formattedLines || singleLab.laboratoryFindings || "PDF/Report available";
      } else {
        activePatientContext.labs.push({
          name: singleLab.userProcedureName,
          date: "Recent",
          details: formattedLines || singleLab.laboratoryFindings || "PDF/Report available"
        });
      }
    }

    // 4. Clinical Notes
    const notesList = res.searchPatientEhrNotes?.result;
    if (Array.isArray(notesList)) {
      notesList.forEach(n => {
        if (n.createdByUser?.fullName) {
          const exists = activePatientContext.notes.some(existing => existing.id === n.id);
          if (!exists) {
            activePatientContext.notes.push({
              id: n.id,
              author: n.createdByUser.fullName,
              date: n.createdDate ? new Date(n.createdDate).toLocaleDateString() : "N/A"
            });
          }
        }
      });
    }

    // 5. Medication & Past Orders
    const ordersList = res.patientPastOrders?.result || res.patientOngoingOrders?.result || res.patientPackageOrders?.result;
    if (Array.isArray(ordersList)) {
      ordersList.forEach(ord => {
        if (ord.userProcedureName || ord.name) {
          const name = ord.userProcedureName || ord.name;
          const exists = activePatientContext.medications.some(m => m.name === name);
          if (!exists) {
            activePatientContext.medications.push({
              name: name,
              date: ord.createdDate ? new Date(ord.createdDate).toLocaleDateString() : "Active"
            });
          }
        }
      });
    }
  }

  function buildFormattedPatientContext() {
    const demo = activePatientContext.demographics;
    const vitals = activePatientContext.vitals;
    const labs = activePatientContext.labs;
    const notes = activePatientContext.notes;
    const meds = activePatientContext.medications;

    let parts = [];
    if (demo.mrn) {
      parts.push(`PATIENT PROFILE: MRN: ${demo.mrn} | Sex: ${demo.gender} | DOB: ${demo.birthDate} | Payer: ${demo.payer}`);
    }
    if (Object.keys(vitals).length > 0) {
      const vStr = Object.entries(vitals).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(" | ");
      parts.push(`VITALS: ${vStr}`);
    }
    if (meds.length > 0) {
      const mStr = meds.slice(0, 5).map(m => `${m.name} (${m.date})`).join(", ");
      parts.push(`ACTIVE/RECENT ORDERS: ${mStr}`);
    }
    if (labs.length > 0) {
      const lStr = labs.slice(0, 5).map(l => l.details ? `${l.name} [${l.details}]` : `${l.name} (${l.date})`).join("; ");
      parts.push(`RECENT LABS: ${lStr}`);
    }
    if (notes.length > 0) {
      const nStr = notes.slice(0, 3).map(n => `By ${n.author} on ${n.date}`).join("; ");
      parts.push(`PREVIOUS CLINICAL NOTES: ${nStr}`);
    }

    if (parts.length === 0) return "";
    return `\n\n=== EXTRACTED EHR PATIENT CONTEXT ===\n${parts.join("\n")}\n=======================================\n`;
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
1. Ground all medical recommendations in the Zambia Standard Treatment Guidelines (STG) and National ART/Malaria Protocols.
2. Maintain strict clinical brevity using concise bullet points for doctors and clinical officers.
3. Suggest appropriate ICD-10 diagnostic codes where applicable.
4. Synthesize provided patient context (vitals, labs, medications, history) with clinician notes to produce actionable recommendations.
`;

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

  function injectGeminiButtons() {
    const textareas = document.querySelectorAll("textarea, [contenteditable='true']");
    
    textareas.forEach((area) => {
      if (area.dataset.geminiInjected) return;
      area.dataset.geminiInjected = "true";

      const btn = document.createElement("button");
      btn.innerText = "✨ Gemini Assist";
      btn.className = "gemini-assist-btn";
      btn.type = "button";

      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const userText = area.value || area.innerText;

        if (!userText.trim()) {
          alert("Please enter or paste clinical notes first.");
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

      area.parentNode.insertBefore(btn, area.nextSibling);
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
        <label style="font-weight: bold; font-size: 12px; display: block; margin-bottom: 6px;">Enter / Paste Clinical Observation or Patient Note:</label>
        <textarea id="gemini-modal-input" class="gemini-modal-textarea" placeholder="e.g. 3yo male presenting with fever 38.5C, cough, and reduced oral intake for 2 days..."></textarea>
        
        <div style="margin-bottom: 12px;">
          <button id="gemini-modal-run-btn" class="gemini-assist-btn" style="padding: 8px 16px; font-size: 13px;">✨ Run Clinical Assistant</button>
        </div>

        <div id="gemini-modal-result" class="gemini-modal-body" style="display: none; border-top: 1px solid #eee; padding-top: 12px;"></div>

        <div class="gemini-modal-actions">
          <button id="gemini-copy-btn" style="display: none;">📋 Copy AI Recommendation</button>
          <button id="gemini-close-btn">Close</button>
        </div>
      </div>
    `;

    const inputArea = document.getElementById("gemini-modal-input");
    const runBtn = document.getElementById("gemini-modal-run-btn");
    const resultDiv = document.getElementById("gemini-modal-result");
    const copyBtn = document.getElementById("gemini-copy-btn");
    const closeBtn = document.getElementById("gemini-close-btn");

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
          const combinedPrompt = `Analyze these clinical notes according to Zambian guidelines:\n${userText}${freshContext}`;
          const resultText = await callGemini({ apiKey, googleAuthToken }, combinedPrompt, selectedModel);
          
          resultDiv.innerHTML = resultText.replace(/\n/g, "<br>");
          resultDiv.style.display = "block";
          copyBtn.style.display = "inline-block";

          copyBtn.onclick = () => {
            navigator.clipboard.writeText(resultText).then(() => {
              alert("AI Clinical Summary copied to clipboard!");
            });
          };
        } catch (err) {
          alert(`Error: ${err.message}`);
        } finally {
          runBtn.innerText = "✨ Run Clinical Assistant";
          runBtn.disabled = false;
        }
      });
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

    const badgeHtml = hasEhrContext 
      ? `<div class="gemini-context-badge">✓ Grounded with extracted EHR patient context (Labs/Vitals/Orders)</div>`
      : ``;

    modal.innerHTML = `
      <div class="gemini-modal-content">
        <h3>🏥 Coptic Hospital AI Clinical Assistant</h3>
        ${badgeHtml}
        <div class="gemini-modal-body">${text.replace(/\n/g, "<br>")}</div>
        <div class="gemini-modal-actions">
          <button id="gemini-copy-btn">Insert into Note</button>
          <button id="gemini-close-btn">Close</button>
        </div>
      </div>
    `;

    document.getElementById("gemini-copy-btn").onclick = () => {
      if (targetArea.value !== undefined) {
        targetArea.value += `\n\n--- AI Clinical Summary ---\n${text}`;
      } else {
        targetArea.innerText += `\n\n--- AI Clinical Summary ---\n${text}`;
      }
      modal.style.display = "none";
    };

    document.getElementById("gemini-close-btn").onclick = () => {
      modal.style.display = "none";
    };

    modal.style.display = "block";
  }

  injectGeminiButtons();
  injectFloatingAssistantButton();
  const observer = new MutationObserver(() => {
    injectGeminiButtons();
    injectFloatingAssistantButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}