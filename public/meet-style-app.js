class MeetStyleUnhingedColleague {
    constructor() {
        this.socket = io();
        this.currentPersona = 'efficiency';
        // this.currentAvatarId = '481542ce-2746-4989-bd70-1c3e8ebd069e'; // Elena - Original
        this.currentAvatarId = '3d4f6f63-157c-4469-b9bf-79534934cd71'; // Test ID
        this.sessionActive = false;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.chatOpen = false;
        
        // Check if user is returning from Anam.ai
        this.handleReturnNavigation();
        
        // Persona configurations - Now centrally managed via server
        // Avatar IDs are controlled by environment variables on the server
        this.personas = {
            efficiency: {
                name: 'Efficiency Maximizer',
                avatar: 'Elena Avatar',
                sample: '"Look, that sounds like busywork. What revenue does this generate?"'
            },
            moonshot: {
                name: 'Moonshot Incubator',
                avatar: 'Stephanie Avatar',
                sample: '"Another incremental feature... Where\'s the revolutionary impact?"'
            },
            customer: {
                name: 'Customer Oracle',
                avatar: 'Omari Avatar',
                sample: '"Would this change their life... or just fill another roadmap slot?"'
            },
            investor: {
                name: 'Investor Mindset',
                avatar: 'Robert Avatar',
                sample: '"That\'s a hobby, not a business. Where\'s the return?"'
            }
        };
        
        this.initializeEventListeners();
        this.initializeSocketEvents();
        this.initializeUserVideo();
        this.setupMessageListener();
    }
    
    setupMessageListener() {
        // Listen for messages from Anam.ai iframe or page
        window.addEventListener('message', (event) => {
            // Security check - only accept messages from Anam.ai domains
            if (!event.origin.includes('anam.ai')) {
                return;
            }
            
            console.log('📨 Received message from Anam.ai:', event.data);
            
            // Check for end call signals
            if (event.data.type === 'call_ended' || 
                event.data.action === 'end_call' ||
                event.data.event === 'session_ended' ||
                (typeof event.data === 'string' && event.data.includes('end'))) {
                
                console.log('☎️ End call detected from Anam.ai');
                this.handleEndCallFromAnam();
            }
        });
        
        // Also listen for page visibility changes (user navigating away)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Check if returning from Anam.ai
                const wasInAnamSession = localStorage.getItem('inAnamSession');
                if (wasInAnamSession === 'true') {
                    console.log('🔄 Returned from Anam.ai session via visibility change');
                    localStorage.removeItem('inAnamSession');
                    this.handleEndCallFromAnam();
                }
            }
        });
    }
    
    setupEndCallDetection(anamUrl) {
        // Mark that we're starting an Anam session
        localStorage.setItem('inAnamSession', 'true');
        localStorage.setItem('anamSessionUrl', anamUrl);
        
        // Set up periodic check for return (fallback method)
        const checkInterval = setInterval(() => {
            // If the main app page becomes visible and we were in an Anam session
            if (document.visibilityState === 'visible' && 
                localStorage.getItem('inAnamSession') === 'true') {
                
                console.log('⚙️ Periodic check detected return from Anam.ai');
                clearInterval(checkInterval);
                localStorage.removeItem('inAnamSession');
                this.handleEndCallFromAnam();
            }
        }, 2000); // Check every 2 seconds
        
        // Clear interval after 30 minutes (session timeout)
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30 * 60 * 1000);
    }
    
    handleEndCallFromAnam() {
        console.log('🏠 Handling end call from Anam.ai - returning to main app');
        
        // Clear Anam session flags
        localStorage.removeItem('inAnamSession');
        localStorage.removeItem('anamSessionUrl');
        
        // Get session info
        const persona = localStorage.getItem('selectedPersona');
        const startTime = localStorage.getItem('sessionStartTime');
        const mainAppUrl = localStorage.getItem('mainAppUrl');
        
        // Calculate session duration
        let sessionDuration = 'unknown';
        if (startTime) {
            const duration = Math.round((Date.now() - parseInt(startTime)) / 1000);
            sessionDuration = `${Math.floor(duration / 60)}m ${duration % 60}s`;
        }
        
        // Set return to home flag for welcome message
        localStorage.setItem('returnToHome', 'true');
        localStorage.setItem('sessionDuration', sessionDuration);
        
        // Navigate back to main app or reload if already there
        if (mainAppUrl && window.location.href !== mainAppUrl) {
            console.log(`🔄 Navigating back to main app: ${mainAppUrl}`);
            window.location.href = mainAppUrl;
        } else {
            console.log('🔄 Already on main app, showing welcome back message');
            setTimeout(() => {
                this.showEndCallWelcome(persona, sessionDuration);
            }, 500);
        }
    }
    
    showEndCallWelcome(persona, duration) {
        const personaName = this.personas[persona]?.name || 'Avatar';
        
        // Create end call welcome overlay
        const welcomeOverlay = document.createElement('div');
        welcomeOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: center;
            z-index: 2000; animation: fadeIn 0.5s ease;
        `;
        
        welcomeOverlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(30,30,30,0.95), rgba(60,60,60,0.95));
                border-radius: 20px; padding: 40px; text-align: center; max-width: 500px;
                border: 2px solid ${this.getPersonaColor(persona)};
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;">☎️</div>
                <h2 style="color: ${this.getPersonaColor(persona)}; margin-bottom: 16px; font-size: 1.5rem;">
                    Session Ended
                </h2>
                <p style="color: white; margin-bottom: 24px; font-size: 1.1rem;">
                    Your <strong>${personaName}</strong> challenge session lasted <strong>${duration}</strong><br>
                    How did the strategic sparring go?
                </p>
                <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                    <button id="new-session" style="
                        background: ${this.getPersonaColor(persona)}; border: none; border-radius: 12px;
                        padding: 12px 24px; color: white; font-weight: 600; cursor: pointer;
                        transition: all 0.2s ease;
                    ">Start New Session</button>
                    <button id="different-persona" style="
                        background: transparent; border: 2px solid rgba(255,255,255,0.3);
                        border-radius: 12px; padding: 12px 24px; color: white; font-weight: 600;
                        cursor: pointer; transition: all 0.2s ease;
                    ">Try Different Persona</button>
                    <button id="done-for-now" style="
                        background: transparent; border: 2px solid rgba(255,255,255,0.2);
                        border-radius: 12px; padding: 12px 24px; color: rgba(255,255,255,0.7);
                        font-weight: 600; cursor: pointer; transition: all 0.2s ease;
                    ">Done for Now</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.body.appendChild(welcomeOverlay);
        
        document.getElementById('new-session').addEventListener('click', () => {
            const shareableLinks = {
                'efficiency': 'https://lab.anam.ai/share/w2Sp6ArKZ0kIAUdIIJ2CN',
                'moonshot': 'https://lab.anam.ai/share/aBZL9qawRPbhcXz7vFUK3',
                'customer': 'https://lab.anam.ai/share/DBLkgIkZqOzO3mJTa7cVF',
                'investor': 'https://lab.anam.ai/share/XlLT-u_1mbQQvio6GSbSm'
            };
            localStorage.setItem('returnToHome', 'true');
            localStorage.setItem('sessionStartTime', Date.now());
            window.location.href = shareableLinks[persona];
        });
        
        document.getElementById('different-persona').addEventListener('click', () => {
            document.body.removeChild(welcomeOverlay);
            // Highlight persona cards for selection
            this.highlightPersonaCards();
        });
        
        document.getElementById('done-for-now').addEventListener('click', () => {
            document.body.removeChild(welcomeOverlay);
            // Clear all session storage
            localStorage.removeItem('selectedPersona');
            localStorage.removeItem('sessionDuration');
            localStorage.removeItem('sessionStartTime');
            localStorage.removeItem('mainAppUrl');
        });
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (document.body.contains(welcomeOverlay)) {
                welcomeOverlay.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => {
                    if (document.body.contains(welcomeOverlay)) {
                        document.body.removeChild(welcomeOverlay);
                    }
                }, 500);
            }
        }, 10000);
    }
    
    highlightPersonaCards() {
        // Add a subtle glow effect to persona cards
        document.querySelectorAll('.mode-card').forEach(card => {
            card.style.animation = 'pulse 2s ease-in-out infinite';
            setTimeout(() => {
                card.style.animation = '';
            }, 6000);
        });
    }
    
    handleReturnNavigation() {
        // Check if user is returning from Anam.ai shareable link
        const returnToHome = localStorage.getItem('returnToHome');
        const selectedPersona = localStorage.getItem('selectedPersona');
        const sessionDuration = localStorage.getItem('sessionDuration');
        
        if (returnToHome === 'true') {
            console.log('🏠 User returned from Anam.ai, showing welcome back message');
            
            // Clear the return flag
            localStorage.removeItem('returnToHome');
            
            // Show appropriate welcome message based on whether it's an end call return
            setTimeout(() => {
                if (sessionDuration) {
                    // This is an end call return with session info
                    this.showEndCallWelcome(selectedPersona, sessionDuration);
                    localStorage.removeItem('sessionDuration');
                } else {
                    // This is a manual return (user navigated back)
                    this.showReturnWelcome(selectedPersona);
                }
            }, 500);
        }
    }
    
    showReturnWelcome(persona) {
        const personaName = this.personas[persona]?.name || 'Avatar';
        
        // Create welcome back overlay
        const welcomeOverlay = document.createElement('div');
        welcomeOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: center;
            z-index: 2000; animation: fadeIn 0.5s ease;
        `;
        
        welcomeOverlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(30,30,30,0.95), rgba(60,60,60,0.95));
                border-radius: 20px; padding: 40px; text-align: center; max-width: 500px;
                border: 2px solid ${this.getPersonaColor(persona)};
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎆</div>
                <h2 style="color: ${this.getPersonaColor(persona)}; margin-bottom: 16px; font-size: 1.5rem;">
                    Welcome Back!
                </h2>
                <p style="color: white; margin-bottom: 24px; font-size: 1.1rem;">
                    How was your session with <strong>${personaName}</strong>?<br>
                    Ready to try another challenger or the same one again?
                </p>
                <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                    <button id="select-again" style="
                        background: ${this.getPersonaColor(persona)}; border: none; border-radius: 12px;
                        padding: 12px 24px; color: white; font-weight: 600; cursor: pointer;
                        transition: all 0.2s ease;
                    ">Try ${personaName} Again</button>
                    <button id="explore-others" style="
                        background: transparent; border: 2px solid rgba(255,255,255,0.3);
                        border-radius: 12px; padding: 12px 24px; color: white; font-weight: 600;
                        cursor: pointer; transition: all 0.2s ease;
                    ">Explore Other Personas</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.body.appendChild(welcomeOverlay);
        
        document.getElementById('select-again').addEventListener('click', () => {
            const shareableLinks = {
                'efficiency': 'https://lab.anam.ai/share/PcjEKKR6enTs94Hq36CRa',    // Elena - Efficiency Maximizer
                'moonshot': 'https://lab.anam.ai/share/aBZL9qawRPbhcXz7vFUK3',     // Stephanie - Moonshot Incubator
                'customer': 'https://lab.anam.ai/share/DBLkgIkZqOzO3mJTa7cVF',     // Mary - The Relentless Operator
                'investor': 'https://lab.anam.ai/share/XlLT-u_1mbQQvio6GSbSm'      // Robert - Investor Mindset
            };
            localStorage.setItem('returnToHome', 'true');
            window.location.href = shareableLinks[persona];
        });
        
        document.getElementById('explore-others').addEventListener('click', () => {
            document.body.removeChild(welcomeOverlay);
        });
        
        // Auto-close after 8 seconds
        setTimeout(() => {
            if (document.body.contains(welcomeOverlay)) {
                welcomeOverlay.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => {
                    if (document.body.contains(welcomeOverlay)) {
                        document.body.removeChild(welcomeOverlay);
                    }
                }, 500);
            }
        }, 8000);
    }
    
    getPersonaColor(persona) {
        const colors = {
            efficiency: '#ef4444',    // Red
            moonshot: '#8b5cf6',      // Purple  
            customer: '#06b6d4',      // Cyan
            investor: '#eab308'       // Yellow
        };
        return colors[persona || this.currentPersona] || colors['efficiency'];
    }

    initializeEventListeners() {
        // Persona selection - Open shareable links directly
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const persona = e.currentTarget.dataset.persona;
                
                // Get shareable link for this persona
                const shareableLinks = {
                    'efficiency': 'https://lab.anam.ai/share/w2Sp6ArKZ0kIAUdIIJ2CN',    // Elena - Efficiency Maximizer
                    'moonshot': 'https://lab.anam.ai/share/aBZL9qawRPbhcXz7vFUK3',     // Stephanie - Moonshot Incubator
                    'customer': 'https://lab.anam.ai/share/DBLkgIkZqOzO3mJTa7cVF',     // Mary - The Relentless Operator
                    'investor': 'https://lab.anam.ai/share/XlLT-u_1mbQQvio6GSbSm'      // Robert - Investor Mindset
                };
                
                const shareableUrl = shareableLinks[persona] || shareableLinks['efficiency'];
                
                console.log(`🎭 Opening ${persona} persona directly: ${shareableUrl}`);
                
                // Store current persona selection for return navigation
                localStorage.setItem('selectedPersona', persona);
                localStorage.setItem('returnToHome', 'true');
                localStorage.setItem('sessionStartTime', Date.now());
                localStorage.setItem('mainAppUrl', window.location.href);
                
                // Set up end call detection monitoring
                this.setupEndCallDetection(shareableUrl);
                
                // Open Anam.ai shareable link in same tab
                window.location.href = shareableUrl;
            });
        });

        // Start session functionality now handled by persona card clicks
        // Sessions launch directly to Anam.ai shareable links

        // Control buttons
        document.getElementById('mic-btn').addEventListener('click', () => {
            this.toggleMicrophone();
        });

        document.getElementById('record-btn').addEventListener('mousedown', () => this.startRecording());
        document.getElementById('record-btn').addEventListener('mouseup', () => this.stopRecording());
        document.getElementById('record-btn').addEventListener('mouseleave', () => this.stopRecording());
        
        // Touch events for mobile
        document.getElementById('record-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        }, { passive: false });
        document.getElementById('record-btn').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });

        document.getElementById('chat-btn').addEventListener('click', () => {
            this.toggleChat();
        });

        document.getElementById('output-btn').addEventListener('click', () => {
            this.generateOutput();
        });

        document.getElementById('end-btn').addEventListener('click', () => {
            this.endSession();
        });

        document.getElementById('persona-switch-btn').addEventListener('click', () => {
            this.showPersonaSwitcher();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.sessionActive && !e.repeat) {
                e.preventDefault();
                this.startRecording();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.sessionActive) {
                e.preventDefault();
                this.stopRecording();
            }
        });
    }

    initializeSocketEvents() {
        // Add error handling for socket connection
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateStatus('Connected', 'connected');
        });

        this.socket.on('connect_error', (error) => {
            console.log('Connection error:', error);
            this.updateStatus('Connection failed', 'error');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateStatus('Disconnected', 'error');
            this.sessionActive = false;
            this.resetInterface();
        });

        this.socket.on('session-ready', (data) => {
            console.log('Session ready:', data);
            this.sessionActive = true;
            this.updateStatus('Session active', 'connected');
            this.hideOverlay();
            this.showSessionControls();
            this.initializeAnamAvatar();
        });

        this.socket.on('challenger-response', (data) => {
            console.log('Challenger response:', data);
            
            // Update transcript with challenger response
            if (this.transcriptionActive && data.text) {
                this.updateTranscript(data.text, 'challenger');
            }
            
            this.addMessageToChat('challenger', data.text);
            this.updatePhase(data.phase);
            this.animateAvatar('challenging');
            
            // Play audio if available and show audio feedback
            if (data.audioStream) {
                this.updateStatus('Playing challenger response...', 'connecting');
                this.playAudio(data.audioStream.audioBuffer);
            }
        });

        this.socket.on('phase-transition', (data) => {
            console.log('Phase transition:', data);
            this.updatePhase(data.newPhase);
            this.showPhaseTransition(data.newPhase);
        });

        this.socket.on('strategy-output', (data) => {
            console.log('Strategy output generated:', data);
            this.displayStrategyDocument(data);
        });

        this.socket.on('error', (data) => {
            // Filter out non-critical errors
            if (data && data.message && !data.message.includes('hook.js')) {
                console.error('Socket error:', data);
                this.updateStatus(`Error: ${data.message}`, 'error');
            }
        });
    }

    async startSession() {
        console.log('🚀 startSession() method called');
        console.log('🎭 Current persona:', this.currentPersona);
        console.log('📞 Socket connected:', this.socket.connected);
        
        this.updateStatus('Starting session...', 'connecting');
        
        try {
            console.log('🎤 Requesting microphone permission...');
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Microphone permission granted');
            
            console.log('📡 Emitting start-session event...');
            // Start session with selected persona
            this.socket.emit('start-session', {
                persona: this.currentPersona,
                mode: 'strategic_challenge', // Generic mode, persona-specific logic handled by persona
                userContext: {
                    name: 'Strategic Leader',
                    role: 'decision maker'
                },
                companyData: {
                    name: 'Demo Company',
                    size: 'startup',
                    industry: 'technology'
                }
            });
            console.log('✅ start-session event emitted');
            
        } catch (error) {
            console.error('❌ Failed to start session:', error);
            this.updateStatus('Microphone access denied', 'error');
        }
    }

    async startRecording() {
        if (this.isRecording || !this.sessionActive) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.sendVoiceMessage(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            const recordBtn = document.getElementById('record-btn');
            recordBtn.classList.add('recording');
            this.updateStatus('Recording...', 'connecting');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.updateStatus('Recording failed', 'error');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        this.isRecording = false;

        // Reset UI
        const recordBtn = document.getElementById('record-btn');
        recordBtn.classList.remove('recording');
        this.updateStatus('Processing...', 'connecting');
    }

    async sendVoiceMessage(audioBlob) {
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Audio = reader.result.split(',')[1];
                
                // Show processing status
                this.updateStatus('Processing voice with ElevenLabs STT...', 'connecting');
                
                // Send to ElevenLabs STT for transcription if transcription is active
                if (this.transcriptionActive) {
                    try {
                        const transcription = await this.transcribeWithElevenLabs(base64Audio);
                        if (transcription) {
                            this.updateTranscript(transcription, 'user');
                            this.addMessageToChat('user', transcription);
                        }
                    } catch (transcriptionError) {
                        console.warn('STT failed, using voice message fallback:', transcriptionError);
                        this.addMessageToChat('user', '[Voice message]');
                    }
                } else {
                    this.addMessageToChat('user', '[Voice message]');
                }
                
                // Send to backend for processing
                this.socket.emit('user-input', {
                    input: base64Audio,
                    inputType: 'voice'
                });
                
                this.updateStatus('Message sent', 'connected');
            };
            reader.readAsDataURL(audioBlob);

        } catch (error) {
            console.error('Failed to send voice message:', error);
            this.updateStatus('Failed to send message', 'error');
        }
    }
    
    async transcribeWithElevenLabs(base64Audio) {
        try {
            console.log('🎙️ Sending audio to ElevenLabs STT...');
            
            // Convert base64 to blob for ElevenLabs API
            const audioBlob = this.base64ToBlob(base64Audio, 'audio/wav');
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            
            // Send to our backend which proxies to ElevenLabs
            const response = await fetch('/api/elevenlabs/stt', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`STT request failed: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ ElevenLabs STT result:', result);
            
            return result.text || result.transcript || null;
            
        } catch (error) {
            console.error('❌ ElevenLabs STT failed:', error);
            throw error;
        }
    }
    
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    toggleMicrophone() {
        const micBtn = document.getElementById('mic-btn');
        micBtn.classList.toggle('active');
        // Microphone toggle logic would go here
    }

    toggleChat() {
        const chatPanel = document.getElementById('chat-panel');
        const chatBtn = document.getElementById('chat-btn');
        
        this.chatOpen = !this.chatOpen;
        
        if (this.chatOpen) {
            chatPanel.classList.add('open');
            chatBtn.classList.add('active');
        } else {
            chatPanel.classList.remove('open');
            chatBtn.classList.remove('active');
        }
    }

    generateOutput() {
        if (!this.sessionActive) return;

        this.updateStatus('Generating strategy document...', 'connecting');
        this.socket.emit('generate-output');
    }

    endSession() {
        if (this.sessionActive) {
            this.socket.emit('end-session');
            this.sessionActive = false;
            this.resetInterface();
            this.showOverlay();
        }
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const messageText = document.createElement('div');
        messageText.textContent = message;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString();
        
        messageElement.appendChild(messageText);
        messageElement.appendChild(messageTime);
        chatMessages.appendChild(messageElement);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateStatus(message, type) {
        const statusText = document.getElementById('status-text');
        const statusDot = document.getElementById('status-dot');
        
        statusText.textContent = message;
        
        statusDot.className = 'status-dot';
        if (type === 'connecting') {
            statusDot.classList.add('connecting');
        } else if (type === 'error') {
            statusDot.classList.add('error');
        }
        
        // Auto-hide success messages
        if (type === 'connected' && message !== 'Session active') {
            setTimeout(() => {
                if (this.sessionActive) {
                    this.updateStatus('Session active', 'connected');
                }
            }, 3000);
        }
    }

    updatePersonaDisplay() {
        const persona = this.personas[this.currentPersona];
        const modeIndicator = document.getElementById('mode-indicator');
        const personaDisplay = document.getElementById('persona-display');
        const challengerAvatar = document.getElementById('challenger-avatar');
        
        if (modeIndicator) {
            modeIndicator.textContent = persona.name;
            modeIndicator.className = `mode-indicator ${this.currentPersona}`;
        }
        
        if (personaDisplay) {
            personaDisplay.textContent = `${persona.name} • ${persona.avatar}`;
        }
        
        // Update avatar styling based on persona
        if (challengerAvatar) {
            challengerAvatar.className = `challenger-avatar ${this.currentPersona}`;
        }
    }

    updatePersonaPreview() {
        const persona = this.personas[this.currentPersona];
        const previewElement = document.getElementById('persona-preview');
        
        if (previewElement) {
            previewElement.querySelector('.preview-name').textContent = `${persona.name} (${persona.avatar})`;
            previewElement.querySelector('.preview-sample').textContent = persona.sample;
            
            // Update color based on persona
            const colors = {
                efficiency: '#ef4444',
                moonshot: '#8b5cf6', 
                customer: '#06b6d4',
                investor: '#eab308'
            };
            previewElement.style.borderLeftColor = colors[this.currentPersona];
        }
    }
    
    applyPersonaStyling() {
        // Apply persona-specific styling throughout the UI
        const challengerAvatar = document.getElementById('challenger-avatar');
        const modeIndicator = document.getElementById('mode-indicator');
        
        if (challengerAvatar) {
            challengerAvatar.className = `challenger-avatar ${this.currentPersona}`;
        }
        
        if (modeIndicator) {
            modeIndicator.className = `mode-indicator ${this.currentPersona}`;
        }
    }

    updatePhase(phase) {
        const phaseNames = {
            'provocation': 'Provocation',
            'deep_dive': 'Deep Dive',
            'synthesis': 'Synthesis', 
            'output': 'Output Generation'
        };
        
        const phaseIndicator = document.getElementById('phase-indicator');
        phaseIndicator.textContent = phaseNames[phase] || phase;
        phaseIndicator.classList.remove('hidden');
    }

    showPhaseTransition(newPhase) {
        const phaseNames = {
            'provocation': 'Time to challenge your thinking...',
            'deep_dive': 'Let\'s dig deeper into this...',
            'synthesis': 'Now let\'s make some decisions...',
            'output': 'Generating your strategy document...'
        };
        
        const message = phaseNames[newPhase] || `Entering ${newPhase} phase`;
        this.updateStatus(message, 'connecting');
        
        // Show phase indicator with animation
        const phaseIndicator = document.getElementById('phase-indicator');
        phaseIndicator.style.transform = 'translateX(-50%) scale(1.2)';
        setTimeout(() => {
            phaseIndicator.style.transform = 'translateX(-50%) scale(1)';
        }, 300);
    }


    async initializeAnamAvatar() {
        try {
            console.log(`🎭 Initializing Anam avatar for persona: ${this.currentPersona}`);
            
            // PRIMARY SOLUTION: Try shareable links first
            const success = await this.initializeWithShareableLink();
            
            if (success) {
                console.log('✅ Anam avatar initialized with shareable link');
                this.updateStatus('Anam.ai avatar ready (shareable link)', 'connected');
                return;
            }
            
            // BACKUP SOLUTION: Fall back to SDK/API if shareable link fails
            console.log('🔄 Shareable link failed, trying SDK/API backup...');
            await this.initializeWithSDKAPI();
            
        } catch (error) {
            console.error('❌ All Anam avatar initialization methods failed:', error);
            this.showFallbackAvatar(error.message);
        }
    }
    
    async initializeWithShareableLink() {
        try {
            this.updateStatus('Loading Anam.ai avatar via JavaScript SDK...', 'connecting');
            
            // Get session token first (required for Anam.ai SDK)
            const tokenResponse = await fetch('/api/anam/session-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    persona: this.currentPersona
                })
            });
            
            if (!tokenResponse.ok) {
                console.log('🔄 Session token failed, trying direct shareable link...');
                return this.initializeDirectShareableLink();
            }
            
            const tokenData = await tokenResponse.json();
            const { sessionToken } = tokenData;
            
            console.log(`🎭 Initializing Anam.ai JavaScript SDK for ${this.currentPersona}`);
            
            // Load Anam.ai SDK dynamically
            if (!window.anamSDK) {
                await this.loadAnamSDK();
            }
            
            const avatarContainer = document.getElementById('anam-video');
            const loadingDiv = document.getElementById('avatar-loading');
            
            if (avatarContainer && loadingDiv) {
                loadingDiv.style.display = 'none';
                avatarContainer.style.display = 'block';
                
                // Initialize Anam SDK with session token
                this.anamClient = new window.anamSDK.AnamClient({
                    apiKey: sessionToken,
                    videoElement: avatarContainer,
                    onMessage: (message) => this.handleAnamMessage(message),
                    onTranscript: (transcript) => this.handleAnamTranscript(transcript),
                    onError: (error) => console.error('Anam SDK Error:', error)
                });
                
                await this.anamClient.connect();
                
                // Add themed overlay with controls integration
                this.addAvatarControlsOverlay();
                
                console.log('✅ Anam SDK initialized successfully');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Anam SDK initialization failed:', error);
            // Fallback to direct shareable link
            return this.initializeDirectShareableLink();
        }
    }
    
    async initializeDirectShareableLink() {
        try {
            console.log('🔗 Using direct shareable link approach');
            
            // Get shareable links for each persona
            const shareableLinks = {
                'efficiency': 'https://lab.anam.ai/share/ElIHseGUJP4my2KOL4VU2',
                'moonshot': 'https://lab.anam.ai/share/ElIHseGUJP4my2KOL4VU2',
                'customer': 'https://lab.anam.ai/share/ElIHseGUJP4my2KOL4VU2',
                'investor': 'https://lab.anam.ai/share/ElIHseGUJP4my2KOL4VU2'
            };
            
            const shareableUrl = shareableLinks[this.currentPersona] || shareableLinks['efficiency'];
            const avatarContainer = document.getElementById('anam-video');
            const loadingDiv = document.getElementById('avatar-loading');
            
            if (avatarContainer && loadingDiv) {
                loadingDiv.style.display = 'none';
                
                // Create embedded container with better integration
                const embedContainer = document.createElement('div');
                embedContainer.className = `anam-embed-container ${this.currentPersona}`;
                embedContainer.style.cssText = `
                    width: 100%; height: 100%; position: relative;
                    border-radius: 12px; overflow: hidden;
                    background: ${this.getPersonaColor()};
                    display: flex; flex-direction: column;
                `;
                
                // Create header
                const headerDiv = document.createElement('div');
                headerDiv.style.cssText = `
                    padding: 8px 16px; background: rgba(0,0,0,0.2);
                    color: white; font-weight: 600; font-size: 0.8rem;
                    display: flex; justify-content: space-between; align-items: center;
                `;
                headerDiv.innerHTML = `
                    <span>${this.personas[this.currentPersona].name} Avatar</span>
                    <div style="display: flex; gap: 8px;">
                        <div class="status-dot connecting"></div>
                        <span style="font-size: 0.7rem; opacity: 0.8;">Live</span>
                    </div>
                `;
                
                // Create main content area
                const contentDiv = document.createElement('div');
                contentDiv.style.cssText = `
                    flex: 1; display: flex; align-items: center; justify-content: center;
                    background: linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3));
                    position: relative;
                `;
                
                // Add avatar representation
                const avatarIcon = document.createElement('div');
                avatarIcon.style.cssText = `
                    font-size: 4rem; margin-bottom: 12px;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
                `;
                avatarIcon.textContent = this.getPersonaIcon();
                
                const avatarInfo = document.createElement('div');
                avatarInfo.style.cssText = `
                    text-align: center; color: white;
                `;
                avatarInfo.innerHTML = `
                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">
                        ${this.personas[this.currentPersona].name}
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.9; font-style: italic; margin-bottom: 12px;">
                        ${this.personas[this.currentPersona].sample}
                    </div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">
                        🎭 Connected to Anam.ai Avatar
                    </div>
                `;
                
                contentDiv.appendChild(avatarIcon);
                contentDiv.appendChild(avatarInfo);
                
                // Add open button
                const openBtn = document.createElement('button');
                openBtn.style.cssText = `
                    position: absolute; top: 12px; right: 12px;
                    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 8px; padding: 6px 12px; color: white;
                    font-size: 0.7rem; cursor: pointer; backdrop-filter: blur(10px);
                    transition: all 0.2s ease;
                `;
                openBtn.textContent = 'Full Screen';
                openBtn.onclick = () => window.open(shareableUrl, '_blank');
                openBtn.onmouseover = () => {
                    openBtn.style.background = 'rgba(255,255,255,0.3)';
                    openBtn.style.transform = 'scale(1.05)';
                };
                openBtn.onmouseout = () => {
                    openBtn.style.background = 'rgba(255,255,255,0.2)';
                    openBtn.style.transform = 'scale(1)';
                };
                
                contentDiv.appendChild(openBtn);
                
                // Assemble container
                embedContainer.appendChild(headerDiv);
                embedContainer.appendChild(contentDiv);
                
                // Replace video element
                avatarContainer.style.display = 'none';
                avatarContainer.parentElement.appendChild(embedContainer);
                
                // Initialize transcription integration
                this.initializeTranscriptionIntegration();
                
                console.log('✅ Direct shareable link avatar initialized');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Direct shareable link failed:', error);
            return false;
        }
    }
    
    async loadAnamSDK() {
        return new Promise((resolve, reject) => {
            if (window.anamSDK) {
                resolve(window.anamSDK);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://esm.sh/@anam-ai/js-sdk@latest';
            script.type = 'module';
            script.onload = () => resolve(window.anamSDK);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    getPersonaIcon() {
        const icons = {
            efficiency: '⚡',    // Lightning bolt
            moonshot: '🚀',      // Rocket
            customer: '👥',      // People
            investor: '💰'       // Money bag
        };
        return icons[this.currentPersona] || icons['efficiency'];
    }
    
    handleAnamMessage(message) {
        console.log('Anam message:', message);
        this.addMessageToChat('challenger', message.text || message.content);
    }
    
    handleAnamTranscript(transcript) {
        console.log('Anam transcript:', transcript);
        // Display real-time transcript
        this.updateTranscript(transcript, 'anam');
    }
    
    addAvatarControlsOverlay() {
        const avatarContainer = document.getElementById('anam-video');
        if (!avatarContainer) return;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none; z-index: 10;
            border-radius: 12px; border: 2px solid ${this.getPersonaColor()};
            box-shadow: 0 0 20px ${this.getPersonaColor()}33;
        `;
        
        const statusBadge = document.createElement('div');
        statusBadge.style.cssText = `
            position: absolute; top: 8px; left: 8px;
            background: ${this.getPersonaColor()}; color: white;
            padding: 4px 12px; border-radius: 12px;
            font-size: 0.7rem; font-weight: 600;
            pointer-events: auto;
        `;
        statusBadge.textContent = `${this.personas[this.currentPersona].name} • Live`;
        
        overlay.appendChild(statusBadge);
        avatarContainer.parentElement.style.position = 'relative';
        avatarContainer.parentElement.appendChild(overlay);
    }
    
    initializeTranscriptionIntegration() {
        console.log('🎙️ Initializing ElevenLabs STT integration...');
        
        // Override existing recording to include transcription
        this.transcriptionActive = true;
        
        // Add transcript display if not exists
        this.addTranscriptDisplay();
        
        console.log('✅ Transcription integration ready');
    }
    
    addTranscriptDisplay() {
        const chatPanel = document.getElementById('chat-panel');
        if (!chatPanel || document.getElementById('transcript-display')) return;
        
        const transcriptDiv = document.createElement('div');
        transcriptDiv.id = 'transcript-display';
        transcriptDiv.style.cssText = `
            background: rgba(0,0,0,0.1); border-radius: 8px;
            padding: 12px; margin-bottom: 12px; min-height: 60px;
            border-left: 3px solid ${this.getPersonaColor()};
        `;
        transcriptDiv.innerHTML = `
            <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; opacity: 0.8;">
                🎙️ Live Transcription
            </div>
            <div id="transcript-content" style="font-size: 0.9rem; font-style: italic; opacity: 0.7;">
                Speak to see live transcription...
            </div>
        `;
        
        chatPanel.insertBefore(transcriptDiv, chatPanel.firstChild);
    }
    
    updateTranscript(text, source = 'user') {
        const transcriptContent = document.getElementById('transcript-content');
        if (!transcriptContent) return;
        
        const sourceIcon = source === 'user' ? '🎙️' : '🎭';
        const color = source === 'user' ? '#06b6d4' : this.getPersonaColor();
        
        transcriptContent.innerHTML = `
            <span style="color: ${color}; font-weight: 600;">${sourceIcon} ${source === 'user' ? 'You' : this.personas[this.currentPersona].name}:</span>
            <br>${text}
        `;
    }
    
    async initializeWithSDKAPI() {
        try {
            this.updateStatus('Loading Anam.ai avatar using SDK/API backup...', 'connecting');
            
            // Step 1: Get session token from server with persona
            console.log(`🎭 Requesting Anam session token for persona: ${this.currentPersona}...`);
            const tokenResponse = await fetch('/api/anam/session-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    persona: this.currentPersona
                })
            });
            
            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error(`❌ Token request failed: ${tokenResponse.status} - ${errorText}`);
                throw new Error(`Failed to get session token: ${tokenResponse.status} - ${errorText}`);
            }
            
            const tokenData = await tokenResponse.json();
            const { sessionToken, persona, avatarId, voiceId, llmId } = tokenData;
            console.log(`✅ Anam session token received for ${persona} (Avatar: ${avatarId})`);
            console.log('🔍 Session token details:', { 
                tokenLength: sessionToken?.length, 
                avatarId, 
                persona 
            });
            
            // Create avatar config from server response
            const avatarConfig = {
                avatarId: avatarId,
                voiceId: voiceId,
                llmId: llmId,
                persona: this.currentPersona
            };
            
            // Update display with actual persona info
            this.updatePersonaDisplay();
            
            // Step 2: Use Direct API - NO SDK needed!
            console.log('🚀 Initializing Anam Direct API...');
            
            // Initialize Direct API with session token and avatar config
            await window.AnamDirectAPI.initialize(
                sessionToken, 
                avatarConfig, 
                'anam-video'
            );
            
            this.updateStatus('Anam.ai avatar ready (SDK/API backup)', 'connected');
            console.log('✅ Anam avatar initialized successfully with SDK/API');
            
        } catch (error) {
            console.error('❌ SDK/API backup failed:', error);
            throw error; // Re-throw to trigger fallback avatar
        }
    }
    
    getPersonaColor() {
        const colors = {
            efficiency: '#ef4444',    // Red
            moonshot: '#8b5cf6',      // Purple  
            customer: '#06b6d4',      // Cyan
            investor: '#eab308'       // Yellow
        };
        return colors[this.currentPersona] || colors['efficiency'];
    }


    updateChatFromHistory(messages) {
        // Clear existing messages and rebuild from history
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
            const sender = message.role === 'user' ? 'user' : 'challenger';
            this.addMessageToChat(sender, message.content);
        });
    }

    updatePersonaTranscript(text) {
        // Update real-time transcription for persona
        const lastMessage = document.querySelector('#chat-messages .message.challenger:last-child');
        if (lastMessage) {
            const messageText = lastMessage.querySelector('div:first-child');
            if (messageText) {
                messageText.textContent = text;
            }
        }
    }

    updateUserTranscript(text) {
        // Add or update user message
        this.addMessageToChat('user', text);
    }

    handleStreamInterruption(correlationId) {
        console.log(`🛑 Handling stream interruption for: ${correlationId}`);
        // Stop any current avatar animations
        this.animateAvatar('ready');
        // Could add UI feedback here
    }

    showFallbackAvatar(errorMessage) {
        console.log('🎭 Using fallback avatar representation');
        
        const loadingDiv = document.getElementById('avatar-loading');
        const avatarVideo = document.getElementById('anam-video');
        
        // Hide the video element and show fallback
        if (avatarVideo) {
            avatarVideo.style.display = 'none';
        }
        
        if (loadingDiv) {
            const persona = this.personas[this.currentPersona];
            loadingDiv.innerHTML = `
                <div style="font-size: 4rem; margin-bottom: 20px;">🎭</div>
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">${persona.name}</div>
                <div style="font-size: 1rem; margin-bottom: 10px;">${persona.avatar}</div>
                <div style="font-size: 0.9rem; opacity: 0.8; font-style: italic;">${persona.sample}</div>
                <div style="font-size: 0.7rem; margin-top: 15px; opacity: 0.6;">Demo Mode - Avatar simulation</div>
            `;
            loadingDiv.style.display = 'block';
        }
        
        this.updateStatus('Using demo avatar', 'connected');
    }

    animateAvatar(emotion) {
        const avatar = document.getElementById('challenger-avatar');
        
        if (!avatar) return;
        
        // Remove existing emotion classes
        avatar.classList.remove('speaking', 'challenging', 'ready');
        
        // Add emotion-specific animations
        switch (emotion) {
            case 'challenging':
                avatar.classList.add('challenging');
                this.simulateLipSync();
                // Make eyes slightly narrower for challenging expression
                const challengingEyes = avatar.querySelectorAll('.eye');
                challengingEyes.forEach(eye => {
                    eye.style.height = '8px';
                    setTimeout(() => { eye.style.height = '12px'; }, 2000);
                });
                break;
            case 'provocative':
                avatar.classList.add('challenging');
                avatar.style.transform = 'scale(1.1)';
                setTimeout(() => { avatar.style.transform = 'scale(1)'; }, 500);
                this.simulateLipSync();
                // Raise eyebrows (move eyes up slightly)
                const provocativeEyes = avatar.querySelectorAll('.eye');
                provocativeEyes.forEach(eye => {
                    eye.style.transform = 'translateY(-2px)';
                    setTimeout(() => { eye.style.transform = 'translateY(0)'; }, 1500);
                });
                break;
            case 'ready':
                avatar.classList.add('ready');
                // Subtle breathing animation
                avatar.style.animation = 'pulse 3s ease-in-out infinite';
                // Blink animation for ready state
                const readyEyes = avatar.querySelectorAll('.eye');
                setInterval(() => {
                    readyEyes.forEach(eye => {
                        eye.style.height = '2px';
                        setTimeout(() => { eye.style.height = '12px'; }, 150);
                    });
                }, 3000);
                break;
            case 'thinking':
                // Move pupils up (thinking pose)
                const pupils = avatar.querySelectorAll('.pupil');
                pupils.forEach(pupil => {
                    pupil.style.transform = 'translate(-50%, -70%)';
                    setTimeout(() => {
                        pupil.style.transform = 'translate(-50%, -50%)';
                    }, 2000);
                });
                // Slight frown
                const mouth = avatar.querySelector('.mouth');
                if (mouth) {
                    mouth.style.borderRadius = '15px 15px 0 0';
                    setTimeout(() => {
                        mouth.style.borderRadius = '0 0 15px 15px';
                    }, 2000);
                }
                break;
        }
        
        // General avatar scaling animation
        avatar.style.transform = 'scale(1.02)';
        setTimeout(() => {
            avatar.style.transform = 'scale(1)';
        }, 300);
    }

    simulateLipSync() {
        const mouth = document.querySelector('.mouth');
        if (!mouth) return;
        
        // Simulate speaking animation by changing mouth shape
        let speakingInterval = setInterval(() => {
            const height = 5 + Math.random() * 10; // Random mouth opening
            mouth.style.height = height + 'px';
            mouth.style.borderRadius = height > 8 ? '50%' : '0 0 15px 15px';
        }, 150);
        
        // Stop after 3 seconds (typical response length)
        setTimeout(() => {
            clearInterval(speakingInterval);
            mouth.style.height = '5px';
            mouth.style.borderRadius = '0 0 15px 15px';
        }, 3000);
    }

    async playAudio(audioBuffer) {
        try {
            const audioElement = document.getElementById('audio-playback');
            const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            audioElement.src = audioUrl;
            audioElement.play();
            
            audioElement.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.animateAvatar('ready');
            };
            
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
    }

    displayStrategyDocument(data) {
        // For now, show in chat - could be enhanced with a modal
        this.addMessageToChat('challenger', '📄 Strategy document generated! Check your downloads.');
        
        // Create downloadable document
        const element = document.createElement('a');
        const file = new Blob([data.output.content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `strategy-${this.currentPersona}-${new Date().getTime()}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        this.updateStatus('Strategy document generated', 'connected');
        
        // Show output button
        document.getElementById('output-btn').classList.remove('hidden');
    }

    showPersonaSwitcher() {
        if (this.sessionActive) {
            // Create persona switch modal
            const modal = document.createElement('div');
            modal.className = 'persona-switch-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
                display: flex; align-items: center; justify-content: center;
                z-index: 1000;
            `;
            
            modal.innerHTML = `
                <div style="background: rgba(30,30,30,0.95); border-radius: 20px; padding: 30px; text-align: center; max-width: 400px; border: 1px solid rgba(255,255,255,0.2);">
                    <h3 style="margin-bottom: 20px; color: #667eea;">Switch Challenger Persona</h3>
                    <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                        ${Object.entries(this.personas).map(([key, persona]) => `
                            <button class="persona-switch-btn" data-persona="${key}" style="
                                padding: 12px 16px; border: 1px solid rgba(255,255,255,0.2);
                                border-radius: 8px; background: ${key === this.currentPersona ? 'rgba(102,126,234,0.2)' : 'transparent'};
                                color: white; cursor: pointer; text-align: left;
                                transition: all 0.2s ease;
                            ">
                                <div style="font-weight: 600; margin-bottom: 4px;">${persona.name}</div>
                                <div style="font-size: 0.8rem; opacity: 0.8;">${persona.avatar}</div>
                            </button>
                        `).join('')}
                    </div>
                    <button id="close-persona-modal" style="
                        padding: 8px 20px; border: 1px solid rgba(255,255,255,0.3);
                        border-radius: 20px; background: transparent; color: white;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Event listeners
            modal.querySelectorAll('.persona-switch-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const newPersona = e.currentTarget.dataset.persona;
                    this.switchPersona(newPersona);
                    document.body.removeChild(modal);
                });
            });
            
            modal.querySelector('#close-persona-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
    }

    async switchPersona(newPersona) {
        if (newPersona === this.currentPersona) return;
        
        this.updateStatus('Switching persona...', 'connecting');
        this.currentPersona = newPersona;
        this.currentAvatarId = this.personas[newPersona].avatarId;
        
        // Clean up existing avatar containers
        this.cleanupAvatarContainers();
        
        // Reinitialize Anam avatar with new persona using shareable link primary
        try {
            // Initialize new persona (shareable link first, SDK/API backup)
            await this.initializeAnamAvatar();
            
            this.updatePersonaDisplay();
            this.addMessageToChat('system', `Switched to ${this.personas[newPersona].name} (${this.personas[newPersona].avatar})`);
            
        } catch (error) {
            console.error('Failed to switch persona:', error);
            this.updateStatus('Persona switch failed', 'error');
        }
    }
    
    cleanupAvatarContainers() {
        // Remove any existing avatar containers
        const existingContainers = document.querySelectorAll('.anam-shareable-container, .anam-embed-container');
        existingContainers.forEach(container => container.remove());
        
        // Remove overlay elements
        const overlays = document.querySelectorAll('[style*="position: absolute"][style*="z-index: 10"]');
        overlays.forEach(overlay => overlay.remove());
        
        // Reset video element visibility
        const avatarVideo = document.getElementById('anam-video');
        const loadingDiv = document.getElementById('avatar-loading');
        
        if (avatarVideo) {
            avatarVideo.style.display = 'block';
            avatarVideo.src = ''; // Clear any existing content
        }
        
        if (loadingDiv) {
            loadingDiv.style.display = 'flex';
        }
        
        // Clean up any Anam client connections
        if (this.anamClient) {
            try {
                this.anamClient.disconnect();
                this.anamClient = null;
            } catch (e) {
                console.warn('Error disconnecting Anam client:', e);
            }
        }
    }

    hideOverlay() {
        document.getElementById('mode-selection-overlay').classList.add('hidden');
    }

    showOverlay() {
        document.getElementById('mode-selection-overlay').classList.remove('hidden');
    }

    showSessionControls() {
        // Enable all control buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.disabled = false;
        });
        
        // Show phase indicator
        document.getElementById('phase-indicator').classList.remove('hidden');
        
        // Apply persona styling to session
        this.applyPersonaStyling();
        
        // Update status
        this.updateStatus('Hold space or click 🔴 to speak', 'connected');
    }

    resetInterface() {
        // Hide session-specific elements
        document.getElementById('phase-indicator').classList.add('hidden');
        document.getElementById('output-btn').classList.add('hidden');
        
        // Reset buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active', 'recording');
            btn.disabled = false;
        });
        
        // Close chat if open
        if (this.chatOpen) {
            this.toggleChat();
        }
        
        // Reset avatar
        this.animateAvatar('ready');
        
        // Reset status
        this.updateStatus('Ready to connect', 'connected');
    }

    async initializeUserVideo() {
        try {
            console.log('📹 Initializing user camera...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 200 },
                    height: { ideal: 150 },
                    facingMode: 'user'
                },
                audio: false // We handle audio separately for recording
            });
            
            const userVideo = document.getElementById('user-video');
            if (userVideo) {
                userVideo.srcObject = stream;
                console.log('✅ User camera initialized');
            }
            
        } catch (error) {
            console.warn('⚠️ Could not access user camera:', error);
            
            // Show fallback avatar if camera fails
            const userVideo = document.getElementById('user-video');
            if (userVideo) {
                userVideo.style.display = 'none';
                userVideo.parentElement.innerHTML += '<div style="width: 100%; height: 100%; background: #333; display: flex; align-items: center; justify-content: center; font-size: 2rem; border-radius: 8px;">👤</div>';
            }
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.meetClient = new MeetStyleUnhingedColleague();
    
    // Initialize persona preview and styling
    window.meetClient.updatePersonaPreview();
    window.meetClient.applyPersonaStyling();
    
    // Add some initial instructions
    setTimeout(() => {
        const instructions = [
            'Welcome to your Enterprise Strategic Challenge Session',
            'Select your AI challenger persona and click "Start Strategic Challenge"',
            'Use space bar or hold 🔴 to speak',
            'Your mandatory AI sparring partner is ready to optimize your thinking!'
        ];
        
        instructions.forEach((instruction, index) => {
            setTimeout(() => {
                window.meetClient.addMessageToChat('challenger', instruction);
            }, index * 1000);
        });
    }, 500);
});

// Add CSS for persona switching modal
const style = document.createElement('style');
style.textContent = `
    .persona-switch-btn:hover {
        background: rgba(102,126,234,0.1) !important;
        border-color: #667eea !important;
    }
`;
document.head.appendChild(style);
