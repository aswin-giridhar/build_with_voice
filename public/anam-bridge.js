/**
 * Anam.ai Bridge Script
 * Detects end call events and communicates with parent window
 */

(function() {
    console.log('🌉 Anam.ai Bridge Script loaded');
    
    // Function to notify parent window of end call
    function notifyEndCall(reason = 'unknown') {
        console.log('📞 End call detected:', reason);
        
        try {
            // Send message to parent window (our main app)
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'call_ended',
                    action: 'end_call',
                    reason: reason,
                    timestamp: Date.now()
                }, '*');
            }
            
            // Also try sending to opener (if opened in new tab)
            if (window.opener) {
                window.opener.postMessage({
                    type: 'call_ended',
                    action: 'end_call',
                    reason: reason,
                    timestamp: Date.now()
                }, '*');
            }
        } catch (error) {
            console.warn('Failed to notify parent of end call:', error);
        }
    }
    
    // Monitor for end call buttons and events
    function setupEndCallDetection() {
        console.log('🔍 Setting up end call detection...');
        
        // Method 1: Monitor for common end call button clicks
        const endCallSelectors = [
            '[data-testid="end-call"]',
            '[aria-label*="end"]',
            '[aria-label*="End"]',
            '[title*="end"]',
            '[title*="End"]',
            'button[class*="end"]',
            'button[class*="hangup"]',
            'button[class*="disconnect"]',
            '.end-call',
            '.hangup',
            '.disconnect'
        ];
        
        // Add click listeners to potential end call buttons
        function addEndCallListeners() {
            endCallSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (!element.hasAttribute('data-bridge-listener')) {
                        element.addEventListener('click', () => {
                            console.log('🔴 End call button clicked:', selector);
                            setTimeout(() => notifyEndCall('button_click'), 100);
                        });
                        element.setAttribute('data-bridge-listener', 'true');
                    }
                });
            });
        }
        
        // Method 2: Monitor for page unload/beforeunload
        window.addEventListener('beforeunload', () => {
            console.log('📤 Page unloading - potential end call');
            notifyEndCall('page_unload');
        });
        
        // Method 3: Monitor for visibility change (tab switch/close)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                console.log('👁️ Page hidden - potential end call');
                setTimeout(() => notifyEndCall('page_hidden'), 500);
            }
        });
        
        // Method 4: Monitor for window focus loss
        window.addEventListener('blur', () => {
            console.log('🔍 Window blur - potential navigation away');
            setTimeout(() => notifyEndCall('window_blur'), 1000);
        });
        
        // Continuously check for new end call buttons (dynamic content)
        setInterval(addEndCallListeners, 2000);
        
        // Initial setup
        addEndCallListeners();
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEndCallDetection);
    } else {
        setupEndCallDetection();
    }
    
    // Expose global function for manual triggering
    window.triggerEndCall = function(reason = 'manual') {
        notifyEndCall(reason);
    };
    
    console.log('✅ Anam.ai Bridge Script initialized');
})();