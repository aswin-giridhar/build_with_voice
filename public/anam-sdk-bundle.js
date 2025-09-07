
// Anam SDK Bundle - Testing Version 3.2.0
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
            
            // Fallback to CDN with specific version (testing v3.2.0)
            console.log('🔄 Falling back to CDN with version 3.2.0...');
            try {
                const { createClient } = await import('https://esm.sh/@anam-ai/js-sdk@3.2.0');
                window.AnamSDK = { createClient };
                console.log('✅ Anam SDK loaded from CDN fallback (v3.2.0)');
                
                // Add version info to global scope for testing
                window.AnamSDK.version = '3.2.0';
                window.AnamSDK.testVersion = '3.2.0';
                
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
                console.error('❌ CDN fallback also failed for v3.2.0:', fallbackError);
                window.AnamSDK = { 
                    error: fallbackError.message,
                    version: '3.2.0',
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
