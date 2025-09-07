export class MockAnamService {
  constructor() {
    this.apiKey = process.env.ANAM_API_KEY;
    this.baseURL = 'https://api.anam.ai/v1';
    this.streamURL = process.env.ANAM_STREAM_URL;
    
    this.currentPersona = null;
    this.websocket = null;
    this.isConnected = false;
    
    console.log('✅ Mock Anam service initialized');
  }

  async initializeAvatar(personaType = 'senior_strategic_advisor') {
    console.log(`🧠 Mock Anam: Initializing avatar "${personaType}"`);
    
    // Mock persona data
    this.currentPersona = {
      id: 'mock-persona-12345',
      name: 'Unhinged Colleague',
      type: personaType,
      status: 'active',
      capabilities: ['speech', 'expressions', 'gestures']
    };
    
    // Mock WebSocket connection
    this.isConnected = true;
    
    console.log('🎭 Mock Anam: Avatar initialized successfully');
    return this.currentPersona;
  }

  async deliverResponse(audioStream, emotion = 'challenging', facialExpression = 'questioning') {
    console.log(`🎬 Mock Anam: Delivering response with emotion="${emotion}", expression="${facialExpression}"`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock avatar animation response
    return {
      avatarId: this.currentPersona?.id,
      animationId: `mock-animation-${Date.now()}`,
      emotion: emotion,
      facialExpression: facialExpression,
      audioProcessed: true,
      duration: audioStream?.audioBuffer?.length || 1000
    };
  }

  async updateExpression(expression) {
    console.log(`😊 Mock Anam: Updating expression to "${expression}"`);
    return { success: true, expression: expression };
  }

  async triggerGesture(gestureType) {
    console.log(`✋ Mock Anam: Triggering gesture "${gestureType}"`);
    return { success: true, gesture: gestureType };
  }

  async setEmotion(emotion) {
    console.log(`💭 Mock Anam: Setting emotion to "${emotion}"`);
    return { success: true, emotion: emotion };
  }

  async startListening() {
    console.log('👂 Mock Anam: Avatar started listening');
    return { success: true, listening: true };
  }

  async stopListening() {
    console.log('🤐 Mock Anam: Avatar stopped listening');
    return { success: true, listening: false };
  }

  async cleanup() {
    console.log('🧹 Mock Anam: Cleaning up avatar resources');
    
    if (this.websocket) {
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.currentPersona = null;
    
    return { success: true };
  }

  // Mock WebSocket methods
  async initializeWebSocket() {
    console.log('🔌 Mock Anam: WebSocket connection established');
    this.isConnected = true;
    return { success: true };
  }

  // Utility methods for frontend avatar animation
  getAvatarState() {
    return {
      isConnected: this.isConnected,
      currentPersona: this.currentPersona,
      isListening: false,
      currentEmotion: 'neutral',
      lastExpression: 'default'
    };
  }
}