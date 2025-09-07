class UnhingedColleagueClient {
    constructor() {
        this.socket = io();
        this.currentMode = 'strategy';
        this.sessionActive = false;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.initializeEventListeners();
        this.initializeSocketEvents();
    }

    initializeEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMode = e.target.dataset.mode;
            });
        });

        // Start session
        document.getElementById('start-session-btn').addEventListener('click', () => {
            this.startSession();
        });

        // Voice recording
        const recordBtn = document.getElementById('record-btn');
        recordBtn.addEventListener('mousedown', () => this.startRecording());
        recordBtn.addEventListener('mouseup', () => this.stopRecording());
        recordBtn.addEventListener('mouseleave', () => this.stopRecording());
        
        // Touch events for mobile
        recordBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        recordBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });

        // Text mode toggle
        document.getElementById('text-mode-btn').addEventListener('click', () => {
            const textArea = document.getElementById('text-input-area');
            textArea.classList.toggle('hidden');
        });

        // Send text message
        document.getElementById('send-text-btn').addEventListener('click', () => {
            this.sendTextMessage();
        });

        // Text input enter key
        document.getElementById('text-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendTextMessage();
            }
        });

        // Generate output
        document.getElementById('generate-output-btn').addEventListener('click', () => {
            this.generateOutput();
        });
    }

    initializeSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateStatus('Connected to server', 'connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateStatus('Disconnected from server', 'error');
            this.sessionActive = false;
            this.updateUI();
        });

        this.socket.on('session-ready', (data) => {
            console.log('Session ready:', data);
            this.sessionActive = true;
            this.updateStatus(`${data.message} Mode: ${data.mode}`, 'connected');
            this.updateUI();
            this.showConversationArea();
        });

        this.socket.on('challenger-response', (data) => {
            console.log('Challenger response:', data);
            this.addMessageToConversation('challenger', data.text, data);
            this.updatePhaseIndicator(data.phase);
            
            // Play audio if available
            if (data.audioStream) {
                this.playAudio(data.audioStream.audioBuffer);
            }
        });

        this.socket.on('phase-transition', (data) => {
            console.log('Phase transition:', data);
            this.updatePhaseIndicator(data.newPhase);
            if (data.message) {
                this.updateStatus(data.message, 'connecting');
            }
        });

        this.socket.on('strategy-output', (data) => {
            console.log('Strategy output generated:', data);
            this.displayOutput(data);
        });

        this.socket.on('error', (data) => {
            console.error('Socket error:', data);
            this.updateStatus(`Error: ${data.message}`, 'error');
        });

        this.socket.on('session-ended', () => {
            console.log('Session ended');
            this.sessionActive = false;
            this.updateStatus('Session ended', 'connected');
            this.updateUI();
        });
    }

    async startSession() {
        this.updateStatus('Starting challenge session...', 'connecting');
        
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Start session
            this.socket.emit('start-session', {
                mode: this.currentMode,
                userContext: {
                    name: 'Demo User',
                    role: 'strategic leader'
                },
                companyData: {
                    name: 'Demo Company',
                    size: 'startup',
                    industry: 'technology'
                }
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            this.updateStatus('Failed to access microphone. Please enable microphone access.', 'error');
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
                
                // Stop all tracks to free up the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            const recordBtn = document.getElementById('record-btn');
            recordBtn.classList.add('recording');
            recordBtn.classList.add('active');
            recordBtn.innerHTML = '🔴 Recording...';
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.updateStatus('Failed to start recording', 'error');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        this.isRecording = false;

        // Reset UI
        const recordBtn = document.getElementById('record-btn');
        recordBtn.classList.remove('recording');
        recordBtn.classList.remove('active');
        recordBtn.innerHTML = '🎤 Hold to Talk';
    }

    async sendVoiceMessage(audioBlob) {
        try {
            // Convert blob to base64 for easier transmission
            const reader = new FileReader();
            reader.onload = () => {
                const base64Audio = reader.result.split(',')[1]; // Remove data:audio/wav;base64, prefix
                
                // Send to server
                this.socket.emit('user-input', {
                    input: base64Audio,
                    inputType: 'voice'
                });
            };
            reader.readAsDataURL(audioBlob);

            this.addMessageToConversation('user', '[Voice message]', { inputType: 'voice' });

        } catch (error) {
            console.error('Failed to send voice message:', error);
            this.updateStatus('Failed to send voice message', 'error');
        }
    }

    sendTextMessage() {
        const textInput = document.getElementById('text-input');
        const message = textInput.value.trim();

        if (!message || !this.sessionActive) return;

        this.socket.emit('user-input', {
            input: message,
            inputType: 'text'
        });

        this.addMessageToConversation('user', message, { inputType: 'text' });
        textInput.value = '';
    }

    generateOutput() {
        if (!this.sessionActive) return;

        this.updateStatus('Generating strategy document...', 'connecting');
        this.socket.emit('generate-output');
    }

    addMessageToConversation(speaker, message, metadata = {}) {
        const messagesContainer = document.getElementById('conversation-messages');
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${speaker}`;
        
        let content = `<div class="message-content">${message}</div>`;
        
        if (metadata.challengeType) {
            content += `<div class="message-meta">Challenge: ${metadata.challengeType}</div>`;
        }
        
        if (metadata.inputType) {
            content += `<div class="message-meta">Input: ${metadata.inputType}</div>`;
        }
        
        content += `<div class="message-meta">${new Date().toLocaleTimeString()}</div>`;
        
        messageElement.innerHTML = content;
        messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updatePhaseIndicator(phase) {
        const indicator = document.getElementById('phase-indicator');
        const phaseNames = {
            'provocation': 'Provocation',
            'deep_dive': 'Deep Dive', 
            'synthesis': 'Synthesis',
            'output': 'Output Generation'
        };
        
        indicator.textContent = phaseNames[phase] || phase;
    }

    showConversationArea() {
        document.getElementById('conversation-area').classList.remove('hidden');
        document.getElementById('input-controls').classList.remove('hidden');
        document.getElementById('output-section').classList.remove('hidden');
    }

    displayOutput(outputData) {
        const outputContainer = document.getElementById('output-document');
        
        // Convert markdown-style content to HTML
        let htmlContent = outputData.output.content
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>')
            .replace(/^\- (.+)$/gm, '<li>$1</li>')
            .replace(/\n/g, '<br>');
        
        outputContainer.innerHTML = `
            <h3>${outputData.output.title}</h3>
            <div class="output-content">${htmlContent}</div>
            <div class="output-meta">
                <p><strong>Generated:</strong> ${new Date(outputData.timestamp).toLocaleString()}</p>
                <p><strong>Word Count:</strong> ${outputData.output.metadata.wordCount}</p>
                <p><strong>Session Type:</strong> ${outputData.mode}</p>
            </div>
        `;
        
        outputContainer.classList.remove('hidden');
        this.updateStatus('Strategy document generated successfully!', 'connected');
    }

    async playAudio(audioBuffer) {
        try {
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Convert buffer to audio data
            const audioData = new Uint8Array(audioBuffer);
            const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play audio
            const audio = new Audio(audioUrl);
            audio.play();
            
            // Clean up URL after playing
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
            });
            
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
    }

    updateStatus(message, type) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        statusElement.classList.remove('hidden');
        
        // Auto-hide after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 5000);
        }
    }

    updateUI() {
        const startBtn = document.getElementById('start-session-btn');
        const inputControls = document.getElementById('input-controls');
        
        if (this.sessionActive) {
            startBtn.textContent = 'Session Active';
            startBtn.disabled = true;
            inputControls.classList.remove('hidden');
        } else {
            startBtn.textContent = 'Start Challenge Session';
            startBtn.disabled = false;
            inputControls.classList.add('hidden');
        }
    }
}

// Initialize the client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.unhingedClient = new UnhingedColleagueClient();
});