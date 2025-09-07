import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export class ElevenLabsService {
  constructor() {
    // Store API key for direct API calls
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    
    // Initialize ElevenLabs client
    this.client = new ElevenLabsClient({
      apiKey: this.apiKey,
    });
    
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    this.modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
    this.sttModelId = process.env.ELEVENLABS_STT_MODEL || 'scribe_v1';
    
    // Voice settings for different emotions/challenge types
    this.voiceSettings = {
      challenging: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.7,
        use_speaker_boost: true
      },
      provocative: {
        stability: 0.3,
        similarity_boost: 0.9,
        style: 0.9,
        use_speaker_boost: true
      },
      analytical: {
        stability: 0.6,
        similarity_boost: 0.7,
        style: 0.4,
        use_speaker_boost: true
      },
      decisive: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.8,
        use_speaker_boost: true
      }
    };
  }

  async generateSpeech(text, emotion = 'challenging') {
    try {
      const voiceSettings = this.voiceSettings[emotion] || this.voiceSettings.challenging;
      
      // Add strategic pauses and emphasis for challenger persona
      const enhancedText = this.enhanceTextForChallenger(text, emotion);
      
      const response = await this.client.textToSpeech.convert(this.voiceId, {
        text: enhancedText,
        model_id: this.modelId,
        voice_settings: voiceSettings,
      });
      
      // Convert response to buffer - ElevenLabs client returns a ReadableStream
      const chunks = [];
      const reader = response.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const audioBuffer = Buffer.concat(chunks);
      
      return {
        audioBuffer: audioBuffer,
        format: 'mp3',
        sampleRate: 44100,
        bitrate: 128,
        emotion: emotion
      };
      
    } catch (error) {
      console.error('ElevenLabs TTS Error:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  enhanceTextForChallenger(text, emotion) {
    // Add strategic pauses and emphasis based on challenger persona
    let enhanced = text;
    
    if (emotion === 'challenging') {
      // Add pauses after questions for dramatic effect
      enhanced = enhanced.replace(/\?/g, '?... ');
      // Emphasize key challenger phrases
      enhanced = enhanced.replace(/(That sounds safe|Show me the math|Try again)/gi, '<emphasis level="strong">$1</emphasis>');
    }
    
    if (emotion === 'provocative') {
      // Add longer pauses for provocative statements
      enhanced = enhanced.replace(/\./g, '... ');
      // Emphasize provocative words
      enhanced = enhanced.replace(/(Really|Seriously|Obviously)/gi, '<emphasis level="strong">$1</emphasis>');
    }
    
    if (emotion === 'decisive') {
      // Emphasize decision-forcing language
      enhanced = enhanced.replace(/(So what are you going to do|When|How)/gi, '<emphasis level="moderate">$1</emphasis>');
    }
    
    return enhanced;
  }

  async speechToText(audioBuffer) {
    try {
      console.log('🎤 Converting speech to text with ElevenLabs...');
      console.log('📊 Audio buffer size:', audioBuffer.length);
      
      // Create FormData and send as file parameter as expected by ElevenLabs API
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model_id', this.sttModelId);
      formData.append('language_code', 'en');
      
      // Use direct fetch instead of client library for better control
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs STT API Error:', errorText);
        throw new Error(`Status code: ${response.status}\nBody: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Speech to text successful:', result.text);
      return result.text;
      
    } catch (error) {
      console.error('ElevenLabs STT Error:', error);
      throw new Error(`Failed to convert speech to text: ${error.message}`);
    }
  }

  async createCustomVoice(name, description, audioSamples) {
    try {
      // Create a custom voice for the challenger persona
      const response = await this.client.voices.add({
        name: name,
        description: description,
        files: audioSamples
      });
      
      return response.voice_id;
      
    } catch (error) {
      console.error('ElevenLabs Voice Creation Error:', error);
      throw new Error(`Failed to create custom voice: ${error.message}`);
    }
  }

  async getAvailableVoices() {
    try {
      const response = await this.client.voices.getAll();
      return response.voices;
    } catch (error) {
      console.error('ElevenLabs Get Voices Error:', error);
      throw new Error(`Failed to get available voices: ${error.message}`);
    }
  }

  // Stream speech for real-time conversation
  async streamSpeech(text, emotion = 'challenging') {
    try {
      const voiceSettings = this.voiceSettings[emotion] || this.voiceSettings.challenging;
      const enhancedText = this.enhanceTextForChallenger(text, emotion);
      
      const response = await this.client.textToSpeech.stream(this.voiceId, {
        text: enhancedText,
        modelId: this.modelId,
        voiceSettings: voiceSettings,
      });
      
      return response;
      
    } catch (error) {
      console.error('ElevenLabs Streaming Error:', error);
      throw new Error(`Failed to stream speech: ${error.message}`);
    }
  }
}
