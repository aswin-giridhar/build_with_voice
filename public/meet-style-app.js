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
        this.anamClient = null;
        
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
    }

    initializeEventListeners() {
        // Persona selection
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentPersona = e.currentTarget.dataset.persona;
                this.currentAvatarId = e.currentTarget.dataset.avatarId;
                this.updatePersonaDisplay();
                this.updatePersonaPreview();
                
                // Apply persona styling immediately
                this.applyPersonaStyling();
            });
        });

        // Start session
        document.getElementById('start-session-btn').addEventListener('click', () => {
            this.startSession();
        });

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
        });
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
            this.addMessageToChat('challenger', data.text);
            this.updatePhase(data.phase);
            this.animateAvatar('challenging');
            
            // Play audio if available
            if (data.audioStream) {
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
        this.updateStatus('Starting session...', 'connecting');
        
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
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
            
        } catch (error) {
            console.error('Failed to start session:', error);
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
            reader.onload = () => {
                const base64Audio = reader.result.split(',')[1];
                
                this.socket.emit('user-input', {
                    input: base64Audio,
                    inputType: 'voice'
                });
                
                this.addMessageToChat('user', '[Voice message]');
            };
            reader.readAsDataURL(audioBlob);

        } catch (error) {
            console.error('Failed to send voice message:', error);
            this.updateStatus('Failed to send message', 'error');
        }
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

    async waitForAnamSDK() {
        return new Promise((resolve, reject) => {
            if (window.AnamSDK) {
                resolve();
                return;
            }
            
            const timeout = setTimeout(() => {
                reject(new Error('Anam SDK loading timeout'));
            }, 10000); // 10 second timeout
            
            window.addEventListener('anam-sdk-ready', () => {
                clearTimeout(timeout);
                resolve();
            });
            
            window.addEventListener('anam-sdk-error', (event) => {
                clearTimeout(timeout);
                reject(event.detail);
            });
        });
    }

    async initializeAnamAvatar() {
        try {
            this.updateStatus('Loading Anam.ai avatar...', 'connecting');
            
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
            const { sessionToken, persona, avatarId } = tokenData;
            console.log(`✅ Anam session token received for ${persona} (Avatar: ${avatarId})`);
            console.log('🔍 Session token details:', { 
                tokenLength: sessionToken?.length, 
                avatarId, 
                persona 
            });
            
            // Update display with actual persona info
            this.updatePersonaDisplay();
            
            // Step 2: Wait for Anam SDK to be ready
            console.log('📦 Waiting for Anam SDK...');
            await this.waitForAnamSDK();
            
            // Step 3: Create Anam client with detailed error handling
            console.log('🔌 Creating Anam client...');
            console.log('🔍 Using session token:', sessionToken.substring(0, 20) + '...');
            
            try {
                this.anamClient = window.AnamSDK.createClient(sessionToken);
                console.log('✅ Anam client created successfully');
                
                // Step 3.1: Add event listeners based on official documentation
                this.setupAnamEventListeners();
                
            } catch (clientError) {
                console.error('❌ Failed to create Anam client:', clientError);
                throw new Error(`Client creation failed: ${clientError.message}`);
            }
            
            // Step 4: Stream to video element with enhanced error handling
            console.log('🎥 Starting video stream...');
            
            try {
                const videoElement = document.getElementById('anam-video');
                
                // Get user input stream for better integration
                let userInputStream = null;
                try {
                    userInputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('🎤 User input stream obtained');
                } catch (audioError) {
                    console.log('⚠️ Could not get user audio input:', audioError.message);
                }
                
                // Method 1: streamToVideoElement with user input stream (recommended by docs)
                console.log('🔄 Attempting Method 1: streamToVideoElement with user input...');
                try {
                    if (userInputStream) {
                        await this.anamClient.streamToVideoElement('anam-video', userInputStream);
                    } else {
                        await this.anamClient.streamToVideoElement('anam-video');
                    }
                    console.log('✅ Method 1 successful');
                } catch (method1Error) {
                    console.log('❌ Method 1 failed:', method1Error.message);
                    
                    // Method 2: Try with video element directly
                    console.log('🔄 Attempting Method 2: streamToVideoElement with element...');
                    try {
                        if (userInputStream) {
                            await this.anamClient.streamToVideoElement(videoElement, userInputStream);
                        } else {
                            await this.anamClient.streamToVideoElement(videoElement);
                        }
                        console.log('✅ Method 2 successful');
                    } catch (method2Error) {
                        console.log('❌ Method 2 failed:', method2Error.message);
                        
                        // Method 3: Use stream() method for manual control (from docs)
                        console.log('🔄 Attempting Method 3: stream() method...');
                        try {
                            if (userInputStream) {
                                const [videoStream] = await this.anamClient.stream(userInputStream);
                                if (videoStream && videoElement) {
                                    videoElement.srcObject = videoStream;
                                    await videoElement.play();
                                    console.log('✅ Method 3 successful');
                                } else {
                                    throw new Error('No video stream returned from stream() method');
                                }
                            } else {
                                throw new Error('User input stream required for stream() method');
                            }
                        } catch (method3Error) {
                            console.log('❌ Method 3 failed:', method3Error.message);
                            
                            // Method 4: Try basic streamToVideoElement without any parameters
                            console.log('🔄 Attempting Method 4: basic streamToVideoElement...');
                            try {
                                await this.anamClient.streamToVideoElement('anam-video');
                                console.log('✅ Method 4 successful');
                            } catch (method4Error) {
                                console.log('❌ Method 4 failed:', method4Error.message);
                                
                                // All methods failed, throw comprehensive error
                                throw new Error(`All streaming methods failed. Errors: Method1: ${method1Error.message}, Method2: ${method2Error.message}, Method3: ${method3Error.message}, Method4: ${method4Error.message}`);
                            }
                        }
                    }
                }
                
                this.updateStatus('Anam.ai avatar ready', 'connected');
                console.log('✅ Anam avatar initialized successfully');
                
            } catch (streamError) {
                console.error('❌ Video stream failed:', streamError);
                
                // Enhanced error handling with specific error types
                let errorMessage = streamError.message;
                
                if (streamError.message && streamError.message.includes('500')) {
                    errorMessage = `Server Error: Avatar streaming service unavailable (${avatarId})`;
                } else if (streamError.message && streamError.message.includes('401')) {
                    errorMessage = `Authentication Error: Session token may be invalid`;
                } else if (streamError.message && streamError.message.includes('404')) {
                    errorMessage = `Not Found: Avatar streaming endpoint not available`;
                } else if (streamError.message && streamError.message.includes('timeout')) {
                    errorMessage = `Timeout: Avatar took too long to load (network issue)`;
                } else if (streamError.message && streamError.message.includes('Unknown error')) {
                    errorMessage = `Anam Service Error: The avatar streaming service is currently unavailable`;
                } else if (streamError.message && streamError.message.includes('All streaming methods failed')) {
                    errorMessage = `Multiple streaming methods failed - this may be a temporary service issue`;
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Anam avatar:', error);
            
            // Show fallback avatar with detailed error info
            this.showFallbackAvatar(error.message);
        }
    }

    setupAnamEventListeners() {
        if (!this.anamClient) return;
        
        console.log('🎧 Setting up Anam event listeners...');
        
        // Use proper event constants based on official documentation
        // Fallback to string constants if AnamEvent enum not available
        const AnamEvent = window.AnamSDK.AnamEvent || {
            CONNECTION_ESTABLISHED: 'CONNECTION_ESTABLISHED',
            SESSION_READY: 'SESSION_READY',
            CONNECTION_CLOSED: 'CONNECTION_CLOSED',
            VIDEO_PLAY_STARTED: 'VIDEO_PLAY_STARTED',
            MESSAGE_HISTORY_UPDATED: 'MESSAGE_HISTORY_UPDATED',
            MESSAGE_STREAM_EVENT_RECEIVED: 'MESSAGE_STREAM_EVENT_RECEIVED',
            INPUT_AUDIO_STREAM_STARTED: 'INPUT_AUDIO_STREAM_STARTED',
            TALK_STREAM_INTERRUPTED: 'TALK_STREAM_INTERRUPTED'
        };
        
        try {
            // Connection events
            this.anamClient.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
                console.log('🔗 Anam connection established');
                this.updateStatus('Connected to Anam', 'connected');
            });
            
            this.anamClient.addListener(AnamEvent.CONNECTION_CLOSED, () => {
                console.log('🔌 Anam connection closed');
                this.updateStatus('Connection closed', 'error');
            });
            
            // Video events
            this.anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
                console.log('🎥 Video stream started');
                // Hide loading indicator when video actually starts
                const loadingDiv = document.getElementById('avatar-loading');
                if (loadingDiv) {
                    loadingDiv.style.display = 'none';
                }
                this.updateStatus('Avatar ready', 'connected');
            });
            
            // Conversation events
            this.anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (messages) => {
                console.log('💬 Message history updated:', messages);
                // Update chat with full conversation history
                this.updateChatFromHistory(messages);
            });
            
            this.anamClient.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, (event) => {
                console.log('📝 Message stream event:', event);
                if (event.type === 'persona') {
                    // Persona is speaking - show real-time transcription
                    this.updatePersonaTranscript(event.text);
                    this.animateAvatar('speaking');
                } else if (event.type === 'user') {
                    // User finished speaking
                    this.updateUserTranscript(event.text);
                }
            });
            
            // Audio events
            this.anamClient.addListener(AnamEvent.INPUT_AUDIO_STREAM_STARTED, (stream) => {
                console.log('🎤 Audio input stream started');
                this.updateStatus('Microphone active', 'connected');
            });
            
            // Talk stream events
            this.anamClient.addListener(AnamEvent.TALK_STREAM_INTERRUPTED, (event) => {
                console.log('⚠️ Talk stream interrupted:', event.correlationId);
                this.handleStreamInterruption(event.correlationId);
            });
            
            console.log('✅ Anam event listeners configured');
            
        } catch (eventError) {
            console.warn('⚠️ Some event listeners could not be configured:', eventError.message);
            // Continue without events - basic functionality should still work
        }
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
        
        // Reinitialize Anam avatar with new persona
        try {
            if (this.anamClient) {
                // Cleanup existing client
                this.anamClient = null;
            }
            
            // Initialize new persona
            await this.initializeAnamAvatar();
            
            this.updatePersonaDisplay();
            this.addMessageToChat('system', `Switched to ${this.personas[newPersona].name} (${this.personas[newPersona].avatar})`);
            
        } catch (error) {
            console.error('Failed to switch persona:', error);
            this.updateStatus('Persona switch failed', 'error');
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
