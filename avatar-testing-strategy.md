# Avatar Testing Strategy & Troubleshooting Guide

## Overview
This document provides a systematic approach to test different avatar IDs and resolve the four core issues preventing successful video streaming with Anam.ai avatars.

## Current Status
✅ **Session Token Generation**: Working correctly (200 status responses)  
❌ **Video Streaming**: Failing with 500 errors  
✅ **Centralized Configuration**: Avatar IDs now managed via environment variables  

## Four Core Issues to Address

### 1. Avatar ID Accessibility
**Problem**: Test avatar IDs might not be accessible for video streaming  
**Solution**: Systematic testing of different avatar ID combinations

### 2. API Permissions
**Problem**: API key might not have video streaming permissions  
**Solution**: Verify API key capabilities and request additional permissions if needed

### 3. Service Availability
**Problem**: Anam's video streaming service might be temporarily unavailable  
**Solution**: Test at different times and implement robust fallback mechanisms

### 4. SDK Version Compatibility
**Problem**: We might be using an incompatible version of the Anam SDK  
**Solution**: Test different SDK versions and update if necessary

## Testing Strategy

### Phase 1: Avatar ID Testing Matrix

#### Current Environment Variables (.env)
```bash
# Primary Avatar IDs (Original)
ANAM_AVATAR_EFFICIENCY=481542ce-2746-4989-bd70-1c3e8ebd069e  # Elena
ANAM_AVATAR_MOONSHOT=e5fe7c2f-57cb-43e2-9e4c-e5c00d0c7185   # Stephanie  
ANAM_AVATAR_CUSTOMER=d87de127-a4d9-451c-aa76-35c00831fb44   # Omari
ANAM_AVATAR_INVESTOR=4b622e32-93c7-4b88-b93a-8b0df888eeb3   # Robert

# Alternative Avatar IDs (Test)
# ANAM_AVATAR_EFFICIENCY=3d4f6f63-157c-4469-b9bf-79534934cd71  # Test ID
# ANAM_AVATAR_MOONSHOT=70f7f686-6665-4e2b-8e80-049d0d70eb22   # Test ID
# ANAM_AVATAR_CUSTOMER=8f55b051-aa5f-4656-913a-24232b166c52   # Test ID  
# ANAM_AVATAR_INVESTOR=20c53fa6-963b-41b5-9713-36e41f5a77f8   # Test ID
```

#### Testing Protocol
1. **Test Original IDs First** (currently active)
   - Start server: `npm start`
   - Test each persona individually
   - Document which ones work for video streaming

2. **Test Alternative IDs** (if originals fail)
   - Comment out original IDs in .env
   - Uncomment alternative IDs
   - Restart server and test again

3. **Mixed Testing** (if some work, some don't)
   - Use working IDs for successful personas
   - Keep testing alternatives for failing ones

### Phase 2: API Key Verification

#### Check API Key Permissions
```javascript
// Add to test-anam-api.js
async function checkApiKeyPermissions() {
  try {
    const response = await fetch('https://api.anam.ai/v1/account/permissions', {
      headers: {
        'Authorization': `Bearer ${process.env.ANAM_API_KEY}`
      }
    });
    
    const permissions = await response.json();
    console.log('API Key Permissions:', permissions);
    
    // Check for video streaming permissions
    if (permissions.video_streaming) {
      console.log('✅ Video streaming permissions: ENABLED');
    } else {
      console.log('❌ Video streaming permissions: DISABLED');
    }
  } catch (error) {
    console.error('Failed to check permissions:', error);
  }
}
```

#### Request Additional Permissions
If video streaming is disabled:
1. Contact Anam.ai support
2. Request video streaming permissions for your API key
3. Provide your use case and account details

### Phase 3: Service Availability Testing

#### Implement Service Health Check
```javascript
// Add to src/app.js
app.get('/api/anam/health', async (req, res) => {
  try {
    const response = await fetch('https://api.anam.ai/v1/health', {
      headers: {
        'Authorization': `Bearer ${process.env.ANAM_API_KEY}`
      }
    });
    
    const health = await response.json();
    res.json({
      anam_service: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Anam service unavailable',
      details: error.message
    });
  }
});
```

#### Test at Different Times
- Test during different hours (US/EU business hours)
- Monitor for patterns in service availability
- Document when streaming works vs fails

### Phase 4: SDK Version Testing

#### Current SDK Loading
```html
<!-- In public/index.html -->
<script src="https://unpkg.com/@anam-ai/js-sdk@latest/dist/index.js"></script>
```

#### Test Different Versions
1. **Latest Stable**: `@anam-ai/js-sdk@latest`
2. **Specific Version**: `@anam-ai/js-sdk@1.0.0` (example)
3. **Beta Version**: `@anam-ai/js-sdk@beta`

#### Version Testing Protocol
```javascript
// Add version detection to meet-style-app.js
console.log('Anam SDK Version:', window.AnamSDK?.version || 'Unknown');

// Test different initialization methods
const initMethods = [
  () => window.AnamSDK.createClient(sessionToken),
  () => new window.AnamSDK.Client(sessionToken),
  () => window.AnamSDK.init(sessionToken)
];
```

## Quick Testing Commands

### 1. Test Session Token Generation
```bash
node test-anam-api.js
```

### 2. Test Different Avatar IDs
```bash
# Edit .env file to switch avatar IDs
# Restart server
npm start
# Test in browser at http://localhost:5001
```

### 3. Check Server Logs
```bash
# Monitor logs for detailed error information
tail -f logs/combined.log
tail -f logs/error.log
```

### 4. Test API Directly
```bash
curl -X POST https://api.anam.ai/v1/auth/session-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"personaConfig":{"avatarId":"481542ce-2746-4989-bd70-1c3e8ebd069e"}}'
```

## Troubleshooting Checklist

### ✅ Session Token Issues
- [x] API key is valid
- [x] Request format uses personaConfig wrapper
- [x] Avatar IDs are properly formatted UUIDs

### ❌ Video Streaming Issues (Current Focus)
- [ ] Avatar IDs have video streaming permissions
- [ ] API key has video streaming permissions  
- [ ] Anam video service is available
- [ ] SDK version is compatible
- [ ] Network/firewall allows video streaming

### 🔄 Fallback Mechanisms
- [x] Graceful error handling in client
- [x] Fallback avatar display
- [x] Detailed error messages
- [x] Multiple streaming method attempts

## Expected Outcomes

### Success Indicators
- Video element shows avatar
- No 500 errors in console
- Avatar responds to interactions
- Audio/video sync works

### Failure Patterns
- 500 Server Error: Service/permissions issue
- 401 Unauthorized: API key issue
- 404 Not Found: Avatar ID issue
- Timeout: Network/service availability issue

## Next Steps

1. **Immediate**: Test current original avatar IDs
2. **If fails**: Switch to alternative test IDs
3. **If still fails**: Check API permissions
4. **If permissions OK**: Test different SDK versions
5. **If SDK OK**: Contact Anam.ai support

## Support Information

### Anam.ai Support
- Documentation: https://docs.anam.ai
- Support: support@anam.ai
- Status Page: https://status.anam.ai (if available)

### Key Information for Support
- API Key: `NDJhNDBmM2QtM2MyNS00YmI0LTg4MzgtMzM1YTcxZDM4NWJiOmlYVGhQOUYvZFA0WDdrdCtVUmJueXBId1YvMjNOMzVkc1hVU2NTd3Bqdzg9`
- Use Case: Enterprise strategic challenge sessions
- Issue: Session tokens work, video streaming fails with 500 errors
- Avatar IDs being tested: [list current IDs]

## Testing Log Template

```
Date: ___________
Avatar ID: ___________
Persona: ___________
Result: ___________
Error Details: ___________
Notes: ___________
```

---

**Remember**: The goal is to systematically identify which combination of avatar IDs, API permissions, service timing, and SDK versions allows successful video streaming.
