# 💬 Slack & GitHub Autonomous Doctor Feedback Gateway Guide

**Coptic Hospital Lusaka — AI Assistant Integration Guide**

This guide explains how to set up an **autonomous, zero-maintenance Feedback Gateway** that automatically forwards doctor feedback to **Slack** (`#coptic-ai-feedback` / `#it-support`) and **GitHub Issues** (`amitry/coptic-gemini-extension`) — **without requiring any IT admin to log in or configure tokens in individual browser extensions!**

---

## 🏗️ Architecture Overview

```
 [ Doctor Clicks 💬 Send Feedback ]
                │
                ▼
  [ Chrome Extension (v4.0) ]  ───(Stores local backup in doctorFeedbackLogs)
                │
                ▼ (HTTP POST)
 ┌─────────────────────────────────────────────────────────────┐
 │  Serverless Feedback Gateway (Google Apps Script / Webhook) │
 └──────────────────────────────┬──────────────────────────────┘
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
 💬 [ Slack Channel ]                        🐙 [ GitHub Issues ]
    #coptic-ai-feedback                         amitry/coptic-gemini-extension
    Instant alert formatted card                Auto-logs issue with telemetry
```

---

## 🚀 Step 1: Create Slack Incoming Webhook (2 Minutes)

1. Go to your Slack workspace settings: [api.slack.com/apps](https://api.slack.com/apps) -> **Create New App** -> **From Scratch**.
2. Name: `Coptic AI Feedback Bot` | Workspace: `Coptic Hospital`.
3. Click **Incoming Webhooks** -> Toggle **Activate Incoming Webhooks** to **On**.
4. Click **Add New Webhook to Workspace** -> Select channel `#coptic-ai-feedback` or `#it-support`.
5. Copy the generated Webhook URL:  
   `https://hooks.slack.com/services/T.../B.../X...`

---

## 🚀 Step 2: Deploy Serverless Google Apps Script Webhook (3 Minutes)

1. Open Google Apps Script: [script.google.com](https://script.google.com) -> Click **New Project**.
2. Copy and paste the code from [`scratch/feedback_webhook.gs`](scratch/feedback_webhook.gs) into `Code.gs`.
3. Click **Project Settings ⚙️** -> Scroll to **Script Properties** -> Add two properties:
   * `SLACK_WEBHOOK_URL` = *(Your Slack Webhook URL from Step 1)*
   * `GITHUB_TOKEN`      = *(Your GitHub Bot or Admin Access Token `ghp_...`)*
4. Click **Deploy** -> **New Deployment**:
   * Select Type: **Web App**
   * Description: `Coptic AI Feedback Gateway`
   * Execute as: **Me**
   * Who has access: **Anyone** (allows anonymous feedback from doctors)
5. Click **Deploy** and copy the **Web App URL**:  
   `https://script.google.com/macros/s/.../exec`

---

## 🚀 Step 3: Enter Gateway URL in Extension Popup

1. Open the extension popup in Chrome Toolbar.
2. In **Feedback Webhook / Slack Gateway URL**, paste your Google Script Web App URL from Step 2.
3. Click **Save Settings**.

---

## 🌟 Why This Architecture Wins:
* 🟢 **100% Offline & Admin Resilient**: Works 24/7/365 even when all IT admins are offsite, asleep, or offline.
* 🔒 **Zero Hardcoded Secrets**: GitHub tokens and Slack webhooks stay secure inside Google Cloud Script Properties.
* 📲 **Real-time Team Awareness**: Doctor feedback instantly alerts the IT team in Slack!
