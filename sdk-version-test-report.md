# Anam SDK Version Test Report

## Test Results

| Version | Status | Endpoints Called | Error Messages | Notes |
|---------|--------|------------------|----------------|-------|
| 3.4.1 | ⏳ Testing | - | - | - |
| 3.4.0 | ⏳ Testing | - | - | - |
| 3.3.0 | ⏳ Testing | - | - | - |
| 3.2.5 | ⏳ Testing | - | - | - |
| 3.2.0 | ⏳ Testing | - | - | - |
| 3.1.5 | ⏳ Testing | - | - | - |
| 3.1.0 | ⏳ Testing | - | - | - |
| 3.0.5 | ⏳ Testing | - | - | - |
| 3.0.0 | ⏳ Testing | - | - | - |

## Testing Instructions

1. Run this script to update the SDK version
2. Open http://localhost:5001 in browser
3. Start a session and monitor network requests
4. Record which endpoints are called
5. Note any errors in console
6. Update this report with results

## Expected Working Version

We're looking for a version that:
- ✅ Loads successfully (no 404 errors)
- ✅ Uses documented endpoints (/v1/sessions, /v1/sessions/{id})
- ❌ Does NOT call /v1/engine/session (undocumented)
- ✅ Successfully streams avatar video

## Current Findings

- v3.4.1: ❌ Calls undocumented /v1/engine/session endpoint (500 error)
- v3.3.1: ❌ Version doesn't exist (404 error)
- v3.3.0: ⏳ Testing...

