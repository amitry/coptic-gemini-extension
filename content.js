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
          <button id="gemini-copy-btn" style="display: none;">📋 Copy SOAP Note</button>
          <button id="gemini-close-btn">Close</button>
        </div>
      </div>
    `;

    const inputArea = document.getElementById("gemini-modal-input");
    const runBtn = document.getElementById("gemini-modal-run-btn");
    const modalDictateBtn = document.getElementById("gemini-modal-dictate-btn");
    const resultDiv = document.getElementById("gemini-modal-result");
    const copyBtn = document.getElementById("gemini-copy-btn");
    const closeBtn = document.getElementById("gemini-close-btn");
    const chatSection = document.getElementById("gemini-chat-section");
    const chatHistory = document.getElementById("gemini-chat-history");
    const chatInput = document.getElementById("gemini-chat-input");
    const chatSendBtn = document.getElementById("gemini-chat-send-btn");

    setupVoiceDictation(inputArea, modalDictateBtn);

    let activeChatPromptContext = "";

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
          
          const formattedHtml = formatClinicalResponseHTML(resultText);
          resultDiv.innerHTML = formattedHtml;
          resultDiv.style.display = "block";
          chatSection.style.display = "block";
          copyBtn.style.display = "inline-block";
          copyBtn.innerText = "📋 Copy SOAP Note";

          copyBtn.onclick = () => {
            const plainSOAP = resultText.replace(/### ICD10_CODES[\s\S]*?(?=###|$)/i, "").trim();
            navigator.clipboard.writeText(plainSOAP).then(() => {
              alert("SOAP Note copied to clipboard!");
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
          <button id="gemini-copy-btn">Insert SOAP Note into EHR</button>
          <button id="gemini-close-btn">Close</button>
        </div>
      </div>
    `;

    document.getElementById("gemini-copy-btn").onclick = () => {
      const plainSOAP = text.replace(/### ICD10_CODES[\s\S]*?(?=###|$)/i, "").trim();
      if (targetArea.value !== undefined) {
        targetArea.value += `\n\n--- AI Clinical Summary (Zambian STG) ---\n${plainSOAP}`;
      } else {
        targetArea.innerText += `\n\n--- AI Clinical Summary (Zambian STG) ---\n${plainSOAP}`;
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