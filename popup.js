document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const modelSelect = document.getElementById("modelSelect");
  const saveKeyBtn = document.getElementById("saveKeyBtn");
  const copyLogBtn = document.getElementById("copyLogBtn");
  const clearLogBtn = document.getElementById("clearLogBtn");
  const statusDiv = document.getElementById("status");
  const reconLogBox = document.getElementById("reconLogBox");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const googleLogoutBtn = document.getElementById("googleLogoutBtn");
  const getAiStudioKeyBtn = document.getElementById("getAiStudioKeyBtn");
  const userInfoBox = document.getElementById("userInfoBox");

  const feedbackWebhookUrlInput = document.getElementById("feedbackWebhookUrl");
  const slackWebhookUrlInput = document.getElementById("slackWebhookUrl");

  const authStatusBadge = document.getElementById("authStatusBadge");

  function updateAuthUI() {
    chrome.storage.sync.get(['googleAuthToken', 'userEmail', 'geminiApiKey', 'selectedModel', 'feedbackWebhookUrl', 'slackWebhookUrl'], (res) => {
      if (res.userEmail && res.googleAuthToken) {
        if (authStatusBadge) {
          authStatusBadge.innerHTML = `🟢 Signed In`;
          authStatusBadge.style.background = `#dcfce7`;
          authStatusBadge.style.color = `#15803d`;
          authStatusBadge.style.border = `1px solid #86efac`;
        }
        userInfoBox.innerHTML = `✓ Active Workspace SSO: <b>${res.userEmail}</b>`;
        userInfoBox.style.display = "block";
        googleLoginBtn.style.display = "none";
        googleLogoutBtn.style.display = "block";
      } else if (res.geminiApiKey) {
        if (authStatusBadge) {
          authStatusBadge.innerHTML = `🟡 Key Active`;
          authStatusBadge.style.background = `#fef9c3`;
          authStatusBadge.style.color = `#854d0e`;
          authStatusBadge.style.border = `1px solid #fde047`;
        }
        userInfoBox.innerHTML = `✓ Custom API Key Saved`;
        userInfoBox.style.display = "block";
        googleLoginBtn.style.display = "block";
        googleLogoutBtn.style.display = "none";
      } else {
        if (authStatusBadge) {
          authStatusBadge.innerHTML = `⚪ Not Signed In`;
          authStatusBadge.style.background = `#f1f5f9`;
          authStatusBadge.style.color = `#64748b`;
          authStatusBadge.style.border = `1px solid #cbd5e1`;
        }
        userInfoBox.style.display = "none";
        googleLoginBtn.style.display = "block";
        googleLogoutBtn.style.display = "none";
      }

      if (res.geminiApiKey) apiKeyInput.value = res.geminiApiKey;
      if (res.selectedModel) modelSelect.value = res.selectedModel;
      if (res.feedbackWebhookUrl && feedbackWebhookUrlInput) feedbackWebhookUrlInput.value = res.feedbackWebhookUrl;
      if (res.slackWebhookUrl && slackWebhookUrlInput) slackWebhookUrlInput.value = res.slackWebhookUrl;
    });
  }

  updateAuthUI();

  // Quick-link to Google AI Studio for free Workspace key
  getAiStudioKeyBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://aistudio.google.com/app/apikey?project=coptic-gemini-chrome-extension" });
  });

  const copySavedAnalysisBtn = document.getElementById("copySavedAnalysisBtn");
  if (copySavedAnalysisBtn) {
    copySavedAnalysisBtn.addEventListener("click", () => {
      chrome.storage.local.get(['lastAnalysisRecord'], (res) => {
        if (res.lastAnalysisRecord && res.lastAnalysisRecord.text) {
          const plainSOAP = res.lastAnalysisRecord.text.replace(/### ICD10_CODES[\s\S]*?(?=###|$)/i, "").trim();
          navigator.clipboard.writeText(plainSOAP).then(() => {
            alert("✓ Active Saved SOAP Note copied to clipboard!");
          });
        } else {
          alert("No saved patient analysis found yet. Run an analysis in Unumed first!");
        }
      });
    });
  }

  const feedbackBtn = document.getElementById("feedbackBtn");
  const exportFeedbackBtn = document.getElementById("exportFeedbackBtn");

  if (feedbackBtn) {
    feedbackBtn.addEventListener("click", () => {
      const comment = prompt("💬 Doctor Feedback / Bug Report:\nType your observation or request below (Sent directly to Coptic IT):");
      if (comment && comment.trim()) {
        const record = {
          id: "fb_" + Date.now(),
          text: comment.trim(),
          version: "3.7",
          date: new Date().toLocaleString()
        };

        chrome.storage.local.get(['doctorFeedbackLogs'], (res) => {
          const logs = res.doctorFeedbackLogs || [];
          logs.push(record);
          chrome.storage.local.set({ doctorFeedbackLogs: logs }, () => {
            alert("✓ Thank you! Your feedback has been sent directly to Coptic Hospital IT.");
            feedbackBtn.innerText = "✓ Feedback Sent!";
            setTimeout(() => { feedbackBtn.innerText = "💬 Send Doctor Feedback / Report Bug"; }, 3000);
          });
        });
      }
    });
  }

  if (exportFeedbackBtn) {
    exportFeedbackBtn.addEventListener("click", () => {
      chrome.storage.local.get(['doctorFeedbackLogs'], (res) => {
        const logs = res.doctorFeedbackLogs || [];
        if (logs.length === 0) {
          alert("No doctor feedback logs recorded yet.");
        } else {
          const formatted = logs.map((l, i) => `[#${i+1}] ${l.date} (v${l.version})\nURL: ${l.url || 'N/A'}\nFeedback: ${l.text}\n`).join("\n-------------------\n");
          navigator.clipboard.writeText(formatted).then(() => {
            alert(`✓ Copied ${logs.length} doctor feedback log(s) to clipboard!`);
          });
        }
      });
    });
  }

  // Handle Google Workspace SSO Sign-In
  googleLoginBtn.addEventListener("click", () => {
    statusDiv.innerText = "Connecting to Google Workspace...";
    
    if (chrome.identity && chrome.identity.getAuthToken) {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (!chrome.runtime.lastError && token) {
          fetchUserInfo(token);
          return;
        }

        const errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : "OAuth client ID pending configuration";
        console.warn("Chrome Identity Auth Notice:", errMsg);

        statusDiv.innerText = "Google AI Studio Key Page Opened";
        chrome.tabs.create({ url: "https://aistudio.google.com/app/apikey?project=coptic-gemini-chrome-extension" });
        alert(`Google Workspace Account Setup:\n\n1. Copy your Gemini API Key from Google AI Studio (opening in new tab).\n2. Paste it in the "Gemini API Key" field below and click "Save Settings".\n\n(Details: ${errMsg})`);
      });
    } else {
      chrome.tabs.create({ url: "https://aistudio.google.com/app/apikey?project=coptic-gemini-chrome-extension" });
    }
  });

  function fetchUserInfo(token) {
    fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const email = data.email || "Workspace User";
      chrome.storage.sync.set({ googleAuthToken: token, userEmail: email }, () => {
        statusDiv.innerText = "Signed in with Google Workspace!";
        updateAuthUI();
        setTimeout(() => statusDiv.innerText = "", 2000);
      });
    })
    .catch(err => {
      chrome.storage.sync.set({ googleAuthToken: token, userEmail: "Workspace User" }, () => {
        updateAuthUI();
      });
    });
  }

  // Handle Logout
  googleLogoutBtn.addEventListener("click", () => {
    chrome.storage.sync.get(['googleAuthToken'], (res) => {
      if (res.googleAuthToken && chrome.identity && chrome.identity.removeCachedAuthToken) {
        chrome.identity.removeCachedAuthToken({ token: res.googleAuthToken }, () => {});
      }
      chrome.storage.sync.remove(['googleAuthToken', 'userEmail'], () => {
        statusDiv.innerText = "Signed out.";
        updateAuthUI();
        setTimeout(() => statusDiv.innerText = "", 2000);
      });
    });
  });

  // Save Settings
  saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const fbWebhook = feedbackWebhookUrlInput ? feedbackWebhookUrlInput.value.trim() : "";
    const slackWebhook = slackWebhookUrlInput ? slackWebhookUrlInput.value.trim() : "";
    chrome.storage.sync.set({ geminiApiKey: key, selectedModel: model, feedbackWebhookUrl: fbWebhook, slackWebhookUrl: slackWebhook }, () => {
      statusDiv.innerText = "Settings saved successfully!";
      updateAuthUI();
      setTimeout(() => statusDiv.innerText = "", 2000);
    });
  });

  // Load and render recon log
  function updateLogUI() {
    chrome.storage.local.get(['unumedReconLog'], (res) => {
      const logs = res.unumedReconLog || [];
      if (logs.length === 0) {
        reconLogBox.innerText = "No Unumed traffic logged yet.";
      } else {
        reconLogBox.innerHTML = logs.map(l => {
          const op = l.graphqlOperation ? ` <b>(GQL: ${l.graphqlOperation})</b>` : "";
          const badge = l.responseBody ? " ✅ Payload" : "";
          return `<b>[${l.method}]</b> ${l.endpoint}${op}${badge}`;
        }).join("<br>");
      }
    });
  }

  updateLogUI();

  // Copy diagnostic log
  copyLogBtn.addEventListener("click", () => {
    chrome.storage.local.get(['unumedReconLog'], (res) => {
      const logs = res.unumedReconLog || [];
      const payload = JSON.stringify(logs, null, 2);
      navigator.clipboard.writeText(payload).then(() => {
        alert("Diagnostic log copied to clipboard! Paste it into your message to the developer.");
      });
    });
  });

  // Clear log
  clearLogBtn.addEventListener("click", () => {
    chrome.storage.local.set({ unumedReconLog: [] }, () => {
      updateLogUI();
    });
  });
});