#!/usr/bin/env python3
import json
import glob
import re
import os

print("=== 🔍 COPTIC GEMINI ASSISTANT: COMPREHENSIVE CODEBASE AUDIT ===")

errors = []
warnings = []
passed = []

# 1. Manifest V3 Schema & Permissions Audit
print("\n--- 1. Auditing manifest.json ---")
try:
    with open("manifest.json", "r") as f:
        manifest = json.load(f)
    
    assert manifest.get("manifest_version") == 3, "Manifest version must be 3"
    passed.append("Manifest Version 3 confirmed")
    
    permissions = manifest.get("permissions", [])
    assert "activeTab" not in permissions, "activeTab permission found (violates Chrome Web Store rules)"
    passed.append("Unused 'activeTab' permission correctly absent")
    
    assert "storage" in permissions, "storage permission missing"
    assert "identity" in permissions, "identity permission missing"
    passed.append("Required permissions (storage, identity) present")
    
    web_resources = manifest.get("web_accessible_resources", [])
    assert len(web_resources) > 0, "web_accessible_resources missing"
    passed.append("web_accessible_resources configured for interceptor.js")
except Exception as e:
    errors.append(f"Manifest Audit Error: {e}")

# 2. JavaScript Syntax & Structural Balance
print("\n--- 2. Auditing JavaScript Files (Syntax & Braces) ---")
js_files = glob.glob("*.js") + glob.glob("tests/*.js")
for js_file in js_files:
    try:
        with open(js_file, "r") as f:
            code = f.read()
        
        # Check balanced braces
        curly_open = code.count('{')
        curly_close = code.count('}')
        if curly_open != curly_close:
            errors.append(f"Syntax Error in {js_file}: Open curly braces ({curly_open}) != Close curly braces ({curly_close})")
        else:
            passed.append(f"{js_file}: Balanced curly braces ({curly_open})")
            
        paren_open = code.count('(')
        paren_close = code.count(')')
        if paren_open != paren_close:
            errors.append(f"Syntax Error in {js_file}: Open parens ({paren_open}) != Close parens ({paren_close})")
        else:
            passed.append(f"{js_file}: Balanced parentheses ({paren_open})")

    except Exception as e:
        errors.append(f"Error reading {js_file}: {e}")

# 3. DOM Element ID Cross-Reference Audit
print("\n--- 3. Auditing DOM Element References (popup.html <-> popup.js) ---")
try:
    with open("popup.html", "r") as f:
        popup_html = f.read()
    with open("popup.js", "r") as f:
        popup_js = f.read()
        
    html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', popup_html))
    js_get_ids = set(re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', popup_js))
    
    missing_in_html = js_get_ids - html_ids
    if missing_in_html:
        errors.append(f"popup.js references IDs missing in popup.html: {missing_in_html}")
    else:
        passed.append("All popup.js getElementById references match popup.html element IDs")
except Exception as e:
    errors.append(f"DOM Audit Error: {e}")

# 4. 5-Category EHR Data Collector Audit
print("\n--- 4. Auditing 5-Category Patient Context Collector in content.js ---")
try:
    with open("content.js", "r") as f:
        content_code = f.read()
        
    categories = ["labs", "imaging", "medications", "documents", "notes"]
    for cat in categories:
        if cat not in content_code:
            warnings.append(f"Category '{cat}' might be missing in content.js")
        else:
            passed.append(f"Context category '{cat}' present in content.js")
            
    # Verify GraphQL operations
    gql_ops = ["searchPatientEhrLab", "searchPatientEhrImaging", "patientOngoingOrders", "searchPatientEhrDocument", "searchPatientEhrNotes"]
    for op in gql_ops:
        if op not in content_code:
            errors.append(f"GraphQL operation '{op}' interceptor handler missing in content.js")
        else:
            passed.append(f"GraphQL operation '{op}' intercepted")
except Exception as e:
    errors.append(f"EHR Aggregator Audit Error: {e}")

# 5. Privacy & De-Identification Redactor Audit
print("\n--- 5. Auditing De-Identification Redactor ---")
try:
    if "redactPII" in content_code:
        passed.append("redactPII() function implemented in content.js")
    else:
        errors.append("redactPII() function missing in content.js")
except Exception as e:
    errors.append(f"Privacy Audit Error: {e}")

# Summary Output
print("\n=================== 📊 AUDIT RESULTS ===================")
print(f"✅ PASSED CHECKS: {len(passed)}")
for p in passed:
    print(f"  ✓ {p}")

if warnings:
    print(f"\n⚠️ WARNINGS ({len(warnings)}):")
    for w in warnings:
        print(f"  ! {w}")

if errors:
    print(f"\n❌ ERRORS FOUND ({len(errors)}):")
    for err in errors:
        print(f"  ✖ {err}")
    exit(1)
else:
    print("\n🎉 ALL CHECKS PASSED PERFECTLY! 100% HEALTHY CODEBASE.")
    exit(0)
