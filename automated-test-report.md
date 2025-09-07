# Anam SDK Version Test Report
Generated: 2025-09-07T03:16:00.882Z

## Test Results

| Version | Load Status | Endpoints Called | Error Messages | Video Stream | Notes |
|---------|-------------|------------------|----------------|--------------|-------|
| 3.2.5 | ⏳ Pending | - | - | - | Ready for testing |
| 3.2.0 | ⏳ Pending | - | - | - | Ready for testing |
| 3.1.5 | ⏳ Pending | - | - | - | Ready for testing |
| 3.1.0 | ⏳ Pending | - | - | - | Ready for testing |
| 3.0.5 | ⏳ Pending | - | - | - | Ready for testing |
| 3.0.0 | ⏳ Pending | - | - | - | Ready for testing |
| 3.3.0 | ⏳ Pending | - | - | - | Ready for testing |
| 3.4.0 | ⏳ Pending | - | - | - | Ready for testing |

## Testing Instructions

### For Each Version:
1. Run: `node automated-sdk-test.js 3.2.5`
2. Open: http://localhost:5001
3. Open Browser Dev Tools (F12) → Console tab
4. Start a session and look for these console messages:
   - ✅ "DOCUMENTED ENDPOINT CALLED: /v1/sessions" (GOOD)
   - ❌ "PROBLEMATIC ENDPOINT CALLED: /v1/engine/session" (BAD)
5. Test avatar video streaming
6. Record results in this table

### Success Criteria:
- ✅ SDK loads without 404 errors
- ✅ Uses documented endpoints (/v1/sessions)
- ❌ Does NOT call /v1/engine/session
- ✅ Avatar video streaming works

### Current Test Version: 3.2.5

## Detailed Test Log

### Version 3.2.5 - 2025-09-07T03:16:00.882Z
- Status: Ready for testing
- Expected: Most likely to work with documented endpoints
- Action: Open http://localhost:5001 and test

## Quick Test Commands

```bash
# Test each version systematically
node automated-sdk-test.js 3.2.5  # Test version 3.2.5
node automated-sdk-test.js 3.2.0  # Test version 3.2.0
node automated-sdk-test.js 3.1.5  # Test version 3.1.5
node automated-sdk-test.js 3.1.0  # Test version 3.1.0
node automated-sdk-test.js 3.0.5  # Test version 3.0.5
node automated-sdk-test.js 3.0.0  # Test version 3.0.0
node automated-sdk-test.js 3.3.0  # Test version 3.3.0
node automated-sdk-test.js 3.4.0  # Test version 3.4.0
```

## Expected Working Versions (in order of likelihood):
1. **3.2.0** - Older stable version, likely uses documented endpoints
2. **3.1.5** - Even older, more stable
3. **3.1.0** - Early stable release
4. **3.0.5** - Very stable, definitely uses documented endpoints
5. **3.0.0** - Original stable version

## Problematic Versions:
- **3.4.1** - Confirmed to call undocumented /v1/engine/session endpoint
- **3.3.1** - Version doesn't exist (404 error)
