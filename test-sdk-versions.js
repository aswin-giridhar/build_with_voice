// SDK Version Testing Script
// This script tests different Anam SDK versions to find one that uses documented endpoints

import fs from 'fs';
import path from 'path';

const versions = [
    '3.4.1', // Current problematic version
    '3.4.0',
    '3.3.0',
    '3.2.5',
    '3.2.0',
    '3.1.5',
    '3.1.0',
    '3.0.5',
    '3.0.0'
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
                
                window.dispatchEvent(new CustomEvent('anam-sdk-ready'));
            } catch (fallbackError) {
                console.error('❌ CDN fallback also failed for v${version}:', fallbackError);
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

// Test each version
console.log('🧪 Starting SDK version testing...');
console.log('📋 Versions to test:', versions.join(', '));

// Create a test report template
const testReport = `# Anam SDK Version Test Report

## Test Results

| Version | Status | Endpoints Called | Error Messages | Notes |
|---------|--------|------------------|----------------|-------|
${versions.map(v => `| ${v} | ⏳ Testing | - | - | - |`).join('\n')}

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

`;

fs.writeFileSync('sdk-version-test-report.md', testReport);
console.log('📄 Created test report: sdk-version-test-report.md');

// Start with version 3.3.0
console.log('\n🔧 Setting up test for version 3.3.0...');
updateSDKBundle('3.3.0');

console.log('\n📋 Next steps:');
console.log('1. Open http://localhost:5001 in browser');
console.log('2. Open browser dev tools (F12)');
console.log('3. Go to Network tab');
console.log('4. Start a session and monitor API calls');
console.log('5. Look for calls to /v1/engine/session vs documented endpoints');
console.log('6. If version fails, run: node test-sdk-versions.js [version]');

// Allow testing specific version via command line
const targetVersion = process.argv[2];
if (targetVersion && versions.includes(targetVersion)) {
    console.log(`\n🎯 Testing specific version: ${targetVersion}`);
    updateSDKBundle(targetVersion);
}
