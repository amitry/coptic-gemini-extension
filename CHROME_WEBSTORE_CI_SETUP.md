# 🔑 How to Set Up Automated Chrome Web Store Publishing Secrets

**Coptic Hospital Lusaka — CI/CD Setup Guide**

This guide provides step-by-step instructions for acquiring your **Chrome Web Store API OAuth Credentials** and setting up the **GitHub Actions Auto-Publisher**.

---

## 📌 Prerequisites
* Access to the Google Account that owns/publishes the item on the [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/).
* Access to [Google Cloud Console](https://console.cloud.google.com/).
* Admin/Write access to the GitHub repository [`github.com/amitry/coptic-gemini-extension`](https://github.com/amitry/coptic-gemini-extension).

---

## 🛠️ Step 1: Enable the Chrome Web Store API (Google Cloud Console)

1. Go to **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com/).
2. Select your hospital project (e.g. `Coptic Hospital AI Assistant`).
3. In the left navigation menu, go to **APIs & Services > Library**.
4. In the search box, type **Chrome Web Store API**.
5. Click **Chrome Web Store API** and click **Enable**.

---

## 🛠️ Step 2: Create OAuth 2.0 Client ID & Client Secret

1. In Google Cloud Console, navigate to **APIs & Services > Credentials**.
2. Click **+ Create Credentials** at the top -> select **OAuth client ID**.
3. Select **Application type**: **Web application**.
4. **Name**: `Chrome Web Store Auto-Publisher`.
5. Scroll down to **Authorized redirect URIs** -> Click **+ Add URI** -> Paste:
   `https://developers.google.com/oauthplayground`
6. Click **Create**.
7. A modal will pop up with your credentials. Copy and save:
   * **Client ID** (`CHROME_CLIENT_ID`): `...apps.googleusercontent.com`
   * **Client Secret** (`CHROME_CLIENT_SECRET`): `GOCSPX-...`

---

## 🛠️ Step 3: Generate the `CHROME_REFRESH_TOKEN` (OAuth Playground)

1. Open **Google OAuth 2.0 Playground**:  
   👉 [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. In the top-right corner, click the **Gear Icon ⚙️ (OAuth 2.0 Configuration)**:
   * Check the box: **Use your own OAuth credentials**.
   * **OAuth Client ID**: Paste your `CHROME_CLIENT_ID` from Step 2.
   * **OAuth Client Secret**: Paste your `CHROME_CLIENT_SECRET` from Step 2.
   * Click **Close**.
3. On the left sidebar under **Step 1 (Select & authorize APIs)**:
   * Scroll down to the bottom text box (*"Input your own scopes"*).
   * Paste: `https://www.googleapis.com/auth/chromewebstore`
   * Click **Authorize APIs**.
4. Log in with the **Google Account that publishes the Chrome Extension**.
5. Click **Continue / Allow** to grant permission.
6. On **Step 2 (Exchange authorization code for tokens)**:
   * Click the blue button **Exchange authorization code for tokens**.
7. Copy the generated **Refresh token** (`CHROME_REFRESH_TOKEN` starting with `1//...`).

---

## 🛠️ Step 4: Save Secrets to GitHub Repository

1. Open your GitHub repository:  
   👉 [`github.com/amitry/coptic-gemini-extension`](https://github.com/amitry/coptic-gemini-extension)
2. Go to **Settings > Secrets and variables > Actions**.
3. Click **New repository secret** for each of the 4 secrets:

| Secret Name | Value to Paste |
| :--- | :--- |
| **`CHROME_EXTENSION_ID`** | `bakdiggcjbafjnddaaljamnbbgajpimk` |
| **`CHROME_CLIENT_ID`** | *(Your Client ID ending in `.apps.googleusercontent.com` from Step 2)* |
| **`CHROME_CLIENT_SECRET`** | *(Your Client Secret starting with `GOCSPX-` from Step 2)* |
| **`CHROME_REFRESH_TOKEN`** | *(Your Refresh Token starting with `1//` from Step 3)* |

---

## 🎉 Done!
Now every time you push code or bump the version string in `manifest.json`, GitHub Actions will automatically upload the new zip and publish it directly to all doctors' Chrome browsers upon Google review approval!
