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
  const userInfoBox = document.getElementById("userInfoBox");

  function updateAuthUI() {
    chrome.storage.sync.get(['googleAuthToken', 'userEmail', 'geminiApiKey', 'selectedModel'], (res) => {
      if (res.userEmail && res.googleAuthToken) {
        userInfoBox.innerHTML = `✓ Workspace SSO: <b>${res.userEmail}</b>`;
        userInfoBox.style.display = "block";
        googleLoginBtn.style.display = "none";
        googleLogoutBtn.style.display = "block";
      } else {
        userInfoBox.style.display = "none";
        googleLoginBtn.style.display = "block";
        googleLogoutBtn.style.display = "none";
      }

      if (res.geminiApiKey) apiKeyInput.value = res.geminiApiKey;
      if (res.selectedModel) modelSelect.value = res.selectedModel;
    });
  }

  updateAuthUI();

  // Handle Google Workspace SSO Sign-In
  googleLoginBtn.addEventListener("click", () => {
    statusDiv.innerText = "Connecting to Google Workspace...";
    
    if (chrome.identity && chrome.identity.getAuthToken) {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
          console.warn("getAuthToken error/notice:", chrome.runtime.lastError);
          // Prompt user or fallback
          statusDiv.innerText = "Sign in ready. Verify Chrome Profile SSO.";
          return;
        }
        fetchUserInfo(token);
      });
    } else {
      statusDiv.innerText = "Chrome Identity API active.";
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
    chrome.storage.sync.set({ geminiApiKey: key, selectedModel: model }, () => {
      statusDiv.innerText = "Settings saved successfully!";
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