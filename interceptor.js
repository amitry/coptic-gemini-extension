// interceptor.js - Runs in "MAIN" world context
(function() {
  function shouldLog(url) {
    if (!url) return false;
    // Ignore static assets
    if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|eot|otf)(\?.*)?$/i.test(url)) return false;
    // Ignore telemetry/analytics noise
    if (/posthog|analytics|sentry|doubleclick|google-analytics/i.test(url)) return false;
    return true;
  }

  function logTraffic(url, method, reqBody, resData) {
    try {
      let parsedReqBody = reqBody;
      if (typeof reqBody === "string") {
        try { parsedReqBody = JSON.parse(reqBody); } catch (e) {}
      }

      let graphqlOperation = null;
      if (parsedReqBody && typeof parsedReqBody === "object") {
        if (parsedReqBody.operationName) {
          graphqlOperation = parsedReqBody.operationName;
        } else if (Array.isArray(parsedReqBody) && parsedReqBody[0]?.operationName) {
          graphqlOperation = parsedReqBody.map(op => op.operationName).join(", ");
        }
      }

      // Broadcast intercepted request payload metadata to content script
      window.postMessage({
        type: "UNUMED_RECON_DATA",
        endpoint: url,
        method: method || "GET",
        graphqlOperation: graphqlOperation,
        requestBody: parsedReqBody || null,
        responseBody: resData || null,
        timestamp: new Date().toISOString()
      }, "*");
    } catch (err) {
      console.warn("Coptic Interceptor logging error:", err);
    }
  }

  // --- 1. Hook window.fetch ---
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : (resource?.url || "");
    const method = (config?.method || "GET").toUpperCase();
    const reqBody = config?.body;

    const response = await originalFetch.apply(this, args);

    if (shouldLog(url)) {
      try {
        const clone = response.clone();
        const contentType = clone.headers.get("content-type") || "";
        let resData = null;
        if (contentType.includes("application/json")) {
          resData = await clone.json();
        } else {
          const text = await clone.text();
          try { resData = JSON.parse(text); } catch(e) { resData = text.substring(0, 2000); }
        }
        logTraffic(url, method, reqBody, resData);
      } catch (err) {
        logTraffic(url, method, reqBody, "[Error cloning response]");
      }
    }

    return response;
  };

  // --- 2. Hook XMLHttpRequest (XHR) ---
  const originalXhrOpen = window.XMLHttpRequest.prototype.open;
  const originalXhrSend = window.XMLHttpRequest.prototype.send;

  window.XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    return originalXhrOpen.apply(this, arguments);
  };

  window.XMLHttpRequest.prototype.send = function(body) {
    this._reqBody = body;
    this.addEventListener('load', function() {
      if (shouldLog(this._url)) {
        let resData = this.responseText;
        try {
          resData = JSON.parse(this.responseText);
        } catch (e) {
          if (typeof resData === 'string' && resData.length > 2000) {
            resData = resData.substring(0, 2000);
          }
        }
        logTraffic(this._url, this._method, this._reqBody, resData);
      }
    });
    return originalXhrSend.apply(this, arguments);
  };
})();