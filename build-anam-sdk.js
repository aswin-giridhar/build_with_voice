// Build script to create a stable Anam SDK bundle
import { createClient } from '@anam-ai/js-sdk';
import fs from 'fs';
import path from 'path';

// Create the SDK bundle that will be loaded by the client
const sdkBundle = `
// Anam SDK Bundle - Stable Version 3.4.1
// This replaces the unstable CDN loading with the npm-installed version

(function() {
    'use strict';
    
    // Import the createClient function from the installed npm package
    // This will be replaced with the actual bundled code
    
    // For now, we'll use a dynamic import approach that works with the installed package
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
            
            // Fallback to CDN with specific version (testing v3.3.0)
            console.log('🔄 Falling back to CDN with version 3.3.0...');
            try {
                const { createClient } = await import('https://esm.sh/@anam-ai/js-sdk@3.3.0');
                window.AnamSDK = { createClient };
                console.log('✅ Anam SDK loaded from CDN fallback (v3.3.0)');
                window.dispatchEvent(new CustomEvent('anam-sdk-ready'));
            } catch (fallbackError) {
                console.error('❌ CDN fallback also failed:', fallbackError);
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

// Write the bundle to the public directory
const outputPath = path.join('public', 'anam-sdk-bundle.js');
fs.writeFileSync(outputPath, sdkBundle);

console.log('✅ Anam SDK bundle created at:', outputPath);
console.log('🔧 This bundle uses the stable npm version instead of @latest from CDN');
