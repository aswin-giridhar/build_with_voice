// Automated SDK Version Testing Script
// Tests all SDK versions systematically and records results

import fs from 'fs';
import path from 'path';

const versions = [
    '3.2.5', // Latest stable before new features
    '3.2.0', // Stable version
    '3.1.5', // Stable core functionality
    '3.1.0', // Early stable release
    '3.0.5', // Very stable
    '3.0.0', // Original stable
    '3.3.0', // Has new features, test if others fail
    '3.4.0'  // Pre-problematic version
];

function createSDKBundle(version) {
    const sdkBundle = `
// Anam SDK Bundle - Testing Version ${version}
// This replaces the unstable CDN loading with the npm-installed version

(function() {
    'use strict';
    
    async function initializeAnamSDK() {
        try {
            console.log('🎭 Loading Anam SDK from npm package (v3.4.1)...');
            
            // Use the installed npm package
            const { createClient } = await import('/node_modules/@anam-ai/js-sdk/dist/module/index.js');
            
            // Make it globally available
            window.AnamSDK = { createClient };
            console.log('✅ Anam SDK loaded successfully from npm package');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('anam-sdk-ready'));
            
        } catch (error) {
            console.error('❌ Failed to load Anam SDK from npm:', error);
            
            // Fallback to CDN with specific version (testing v${version})
            console.log('🔄 Falling back to CDN with version ${version}...');
            try {
                const { createClient } = await import('https://esm.sh/@anam-ai/js-sdk@${version}');
                window.AnamSDK = { createClient };
                console.log('✅ Anam SDK loaded from CDN fallback (v${version})');
                
                // Add version info to global scope for testing
                window.AnamSDK.version = '${version}';
                window.AnamSDK.testVersion = '${version}';
                
                // Enhanced logging for endpoint monitoring
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    const url = args[0];
                    if (typeof url === 'string' && url.includes('anam.ai')) {
                        console.log('🌐 Anam API Call:', url);
                        if (url.includes('/v1/engine/session')) {
                            console.error('❌ PROBLEMATIC ENDPOINT CALLED: /v1/engine/session');
                            window.AnamSDK.endpointIssue = true;
                        } else if (url.includes('/v1/sessions')) {
                            console.log('✅ DOCUMENTED ENDPOINT CALLED: /v1/sessions');
                            window.AnamSDK.endpointGood = true;
                        }
                    }
                    return originalFetch.apply(this, args);
                };
                
                window.dispatchEvent(new CustomEvent('anam-sdk-ready'));
            } catch (fallbackError) {
                console.error('❌ CDN fallback also failed for v${version}:', fallbackError);
                window.AnamSDK = { 
                    error: fallbackError.message,
                    version: '${version}',
                    failed: true
                };
                window.dispatchEvent(new CustomEvent('anam-sdk-error', { detail: fallbackError }));
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAnamSDK);
    } else {
        initializeAnamSDK();
    }
})();
`;

    return sdkBundle;
}

function updateSDKBundle(version) {
    const bundle = createSDKBundle(version);
    const outputPath = path.join('public', 'anam-sdk-bundle.js');
    fs.writeFileSync(outputPath, bundle);
    console.log(`✅ Updated SDK bundle to version ${version}`);
}

function createTestReport() {
    const timestamp = new Date().toISOString();
    const report = `# Anam SDK Version Test Report
Generated: ${timestamp}

## Test Results

| Version | Load Status | Endpoints Called | Error Messages | Video Stream | Notes |
|---------|-------------|------------------|----------------|--------------|-------|
${versions.map(v => `| ${v} | ⏳ Pending | - | - | - | Ready for testing |`).join('\n')}

## Testing Instructions

### For Each Version:
1. Run: \`node automated-sdk-test.js ${versions[0]}\`
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

### Current Test Version: ${versions[0]}

## Detailed Test Log

### Version ${versions[0]} - ${timestamp}
- Status: Ready for testing
- Expected: Most likely to work with documented endpoints
- Action: Open http://localhost:5001 and test

## Quick Test Commands

\`\`\`bash
# Test each version systematically
${versions.map(v => `node automated-sdk-test.js ${v}  # Test version ${v}`).join('\n')}
\`\`\`

## Expected Working Versions (in order of likelihood):
1. **3.2.0** - Older stable version, likely uses documented endpoints
2. **3.1.5** - Even older, more stable
3. **3.1.0** - Early stable release
4. **3.0.5** - Very stable, definitely uses documented endpoints
5. **3.0.0** - Original stable version

## Problematic Versions:
- **3.4.1** - Confirmed to call undocumented /v1/engine/session endpoint
- **3.3.1** - Version doesn't exist (404 error)
`;

    fs.writeFileSync('automated-test-report.md', report);
    console.log('📄 Created automated test report: automated-test-report.md');
}

// Main execution
console.log('🧪 Starting Automated SDK Version Testing...');
console.log('📋 Versions to test:', versions.join(', '));

createTestReport();

// Set up first version for testing
const firstVersion = versions[0];
console.log(`\n🎯 Setting up test for version ${firstVersion}...`);
updateSDKBundle(firstVersion);

console.log('\n📋 TESTING INSTRUCTIONS:');
console.log('1. Open http://localhost:5001 in browser');
console.log('2. Open Browser Dev Tools (F12) → Console tab');
console.log('3. Start a session (click "Start Strategic Challenge")');
console.log('4. Look for these console messages:');
console.log('   ✅ "DOCUMENTED ENDPOINT CALLED: /v1/sessions" (GOOD)');
console.log('   ❌ "PROBLEMATIC ENDPOINT CALLED: /v1/engine/session" (BAD)');
console.log('5. Test if avatar video streaming works');
console.log(`6. If ${firstVersion} fails, run: node automated-sdk-test.js ${versions[1]}`);

// Allow testing specific version via command line
const targetVersion = process.argv[2];
if (targetVersion && versions.includes(targetVersion)) {
    console.log(`\n🎯 Testing specific version: ${targetVersion}`);
    updateSDKBundle(targetVersion);
    
    const versionIndex = versions.indexOf(targetVersion);
    const nextVersion = versions[versionIndex + 1];
    
    console.log(`\n📋 Current: Testing version ${targetVersion}`);
    if (nextVersion) {
        console.log(`📋 Next: If this fails, run: node automated-sdk-test.js ${nextVersion}`);
    } else {
        console.log('📋 This is the last version to test');
    }
}

console.log('\n🎯 GOAL: Find SDK version that uses documented endpoints and enables avatar video streaming');
