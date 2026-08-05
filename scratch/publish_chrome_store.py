import urllib.request
import urllib.parse
import json
import os
import sys

def print_log(msg):
    print(msg, flush=True)
    sys.stdout.flush()
    try:
        with open("deploy_error.txt", "a") as f:
            f.write(str(msg) + "\n")
    except Exception:
        pass

def print_gh_error(msg):
    print(f"::error::{msg}", flush=True)
    print_log(msg)

def publish():
    client_id = os.environ.get('CLIENT_ID', '').strip()
    client_secret = os.environ.get('CLIENT_SECRET', '').strip()
    refresh_token = os.environ.get('REFRESH_TOKEN', '').strip()
    extension_id = os.environ.get('EXTENSION_ID', '').strip()

    print_log(f"🔑 Client ID Length: {len(client_id)}")
    print_log(f"🔑 Client Secret Length: {len(client_secret)}")
    print_log(f"🔑 Refresh Token Length: {len(refresh_token)}")
    print_log(f"🔑 Extension ID Length: {len(extension_id)}")

    if not client_id or not client_secret or not refresh_token or not extension_id:
        print_gh_error(f"One or more Chrome Web Store API secrets are empty! (ClientID len: {len(client_id)}, Secret len: {len(client_secret)}, Token len: {len(refresh_token)}, ExtID len: {len(extension_id)})")
        sys.exit(1)

    # 1. Request OAuth 2.0 Access Token
    print_log("🔑 Exchanging Refresh Token for Access Token from Google...")
    token_url = "https://oauth2.googleapis.com/token"
    token_data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }).encode('utf-8')

    req = urllib.request.Request(
        token_url,
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            token_res = json.loads(resp.read().decode())
            access_token = token_res.get("access_token")
            if not access_token:
                print_gh_error(f"OAuth Response did not contain access_token: {token_res}")
                sys.exit(1)
            print_log("✓ Google OAuth Access Token acquired successfully!")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        print_gh_error(f"Google OAuth HTTP Error {e.code}: {err_body}")
        sys.exit(1)
    except Exception as e:
        print_gh_error(f"OAuth General Error: {e}")
        sys.exit(1)

    # 2. Upload Zip Package
    upload_url = f"https://www.googleapis.com/upload/chromewebstore/v1.1/items/{extension_id}"
    print_log(f"📦 Uploading coptic-gemini-assist.zip to Chrome Web Store (ID: {extension_id})...")
    
    with open("coptic-gemini-assist.zip", "rb") as f:
        zip_data = f.read()

    up_req = urllib.request.Request(
        upload_url,
        data=zip_data,
        headers={
            "Authorization": f"Bearer {access_token}",
            "x-goog-api-version": "2"
        },
        method="PUT"
    )
    
    try:
        with urllib.request.urlopen(up_req) as resp:
            up_res = json.loads(resp.read().decode())
            print_log(f"📦 Upload Response: {json.dumps(up_res, indent=2)}")
            upload_state = up_res.get("uploadState")
            if upload_state != "SUCCESS":
                print_log(f"⚠️ Upload State is '{upload_state}'. Proceeding to publish check...")
            else:
                print_log("✓ Extension zip uploaded successfully!")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        print_gh_error(f"Chrome Web Store Upload HTTP Error {e.code}: {err_body}")
        sys.exit(1)

    # 3. Publish Extension Item
    pub_url = f"https://www.googleapis.com/chromewebstore/v1.1/items/{extension_id}/publish"
    print_log("🚀 Requesting Chrome Web Store publish...")
    
    pub_req = urllib.request.Request(
        pub_url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "x-goog-api-version": "2",
            "Content-Length": "0"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(pub_req) as resp:
            pub_res = json.loads(resp.read().decode())
            print_log(f"📢 Publish Response: {json.dumps(pub_res, indent=2)}")
            print_log("🎉 Extension build successfully published to Chrome Web Store!")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        print_log(f"❌ Chrome Web Store Publish HTTP Error {e.code}: {err_body}")

if __name__ == "__main__":
    publish()
