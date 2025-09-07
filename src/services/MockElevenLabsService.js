export class MockElevenLabsService {
  constructor() {
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    this.modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
    this.sttModelId = process.env.ELEVENLABS_STT_MODEL || 'scribe_v1';
    
    console.log('✅ Mock ElevenLabs service initialized');
  }

  async generateSpeech(text, emotion = 'challenging') {
    console.log(`🔊 Mock TTS: "${text}" (${emotion})`);
    
    // Return a mock audio buffer
    return {
      audioBuffer: Buffer.from('mock-audio-data'),
      format: 'mp3',
      sampleRate: 44100,
      bitrate: 128,
      emotion: emotion
    };
  }

  async speechToText(audioBuffer) {
    console.log('🎙️ Mock STT: Processing audio...');
    
    // Mock transcription responses based on common business strategy inputs
    const mockResponses = [
      "I want to improve our revenue strategy",
      "We need to optimize our go-to-market approach", 
      "How can we scale our operations more effectively",
      "What's the best way to increase customer retention",
      "I'm thinking about expanding into new markets"
    ];
    
    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    console.log(`📝 Mock transcription: "${response}"`);
    
    return response;
  }

  async createCustomVoice(name, description, audioSamples) {
    console.log(`🎭 Mock: Creating custom voice "${name}"`);
    return 'mock-voice-id-12345';
  }

  async getAvailableVoices() {
    console.log('🗣️ Mock: Getting available voices');
    return [
      { voice_id: 'mock-voice-1', name: 'Strategic Challenger' },
      { voice_id: 'mock-voice-2', name: 'Executive Coach' }
    ];
  }

  async streamSpeech(text, emotion = 'challenging') {
    console.log(`🌊 Mock streaming: "${text}" (${emotion})`);
    
    // Return a mock stream-like object
    return {
      pipe: (destination) => {
        console.log('📡 Mock: Piping audio stream');
        return destination;
      }
    };
  }
}