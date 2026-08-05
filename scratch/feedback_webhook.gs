/**
 * 🇿🇲 Coptic Hospital AI Assistant — Autonomous Feedback & Slack Gateway
 * 
 * Free, Serverless Google Apps Script Endpoint.
 * Receives doctor feedback from Chrome extension and automatically:
 * 1. Posts a formatted card to Coptic Hospital Slack (#coptic-ai-feedback / #it-support)
 * 2. Creates a GitHub Issue under github.com/amitry/coptic-gemini-extension
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open https://script.google.com and click "New Project".
 * 2. Paste this code into Code.gs.
 * 3. Set Script Properties (Project Settings > Script Properties):
 *    - SLACK_WEBHOOK_URL : https://hooks.slack.com/services/T.../B.../X...
 *    - GITHUB_TOKEN      : ghp_... (Bot/Admin token)
 * 4. Click "Deploy" > "New Deployment" > Select "Web App".
 *    - Execute as: Me
 *    - Who has access: Anyone (even anonymous)
 * 5. Copy the Web App URL and paste into extension popup settings under Feedback Webhook URL!
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const comment = data.text || "No feedback text provided";
    const version = data.version || "v4.0";
    const url = data.url || "Unumed EHR";
    const timestamp = data.date || new Date().toLocaleString();

    // 1. Post to Slack Channel
    const slackWebhookUrl = PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL");
    if (slackWebhookUrl) {
      const slackPayload = {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "🩺 New Clinician Feedback / Bug Report", emoji: true }
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Location:*\n${url}` },
              { type: "mrkdwn", text: `*Extension Version:*\n\`${version}\`` }
            ]
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Clinician Observation:*\n>>> ${comment}` }
          },
          {
            type: "context",
            elements: [
              { type: "mrkdwn", text: `Received at ${timestamp} | Coptic Hospital Lusaka` }
            ]
          }
        ]
      };

      UrlFetchApp.fetch(slackWebhookUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(slackPayload),
        muteHttpExceptions: true
      });
    }

    // 2. Create GitHub Issue
    const githubToken = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
    if (githubToken) {
      const issuePayload = {
        title: `[Doctor Feedback] ${comment.substring(0, 50)}...`,
        body: `### 🩺 Clinician Report\n${comment}\n\n---\n* **Version**: \`${version}\`\n* **Location**: \`${url}\`\n* **Timestamp**: \`${timestamp}\``,
        labels: ["doctor-feedback", "triage"]
      };

      UrlFetchApp.fetch("https://api.github.com/repos/amitry/coptic-gemini-extension/issues", {
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "token " + githubToken,
          "Accept": "application/vnd.github.v3+json"
        },
        payload: JSON.stringify(issuePayload),
        muteHttpExceptions: true
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Feedback dispatched to Slack and GitHub" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
