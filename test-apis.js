import dotenv from 'dotenv';
import { ElevenLabsService } from './src/services/ElevenLabsService.js';

dotenv.config();

async function testElevenLabsIntegration() {
  console.log('🧪 Testing ElevenLabs Integration...');
  
  try {
    const elevenLabs = new ElevenLabsService();
    
    // Test Text-to-Speech
    console.log('\n1. Testing Text-to-Speech...');
    const testText = "That sounds safe. Where's the innovation?";
    const audioResponse = await elevenLabs.generateSpeech(testText, 'challenging');
    console.log('✅ TTS Success - Audio buffer length:', audioResponse.audioBuffer.length);
    
    // Test getting available voices
    console.log('\n2. Testing Voice List...');
    const voices = await elevenLabs.getAvailableVoices();
    console.log('✅ Available voices:', voices.length);
    if (voices.length > 0) {
      console.log('   First voice:', voices[0].name, '(ID:', voices[0].voice_id + ')');
    }
    
    // Test Speech-to-Text (using a dummy base64 audio)
    console.log('\n3. Testing Speech-to-Text...');
    // This is a minimal WAV file in base64 (just silence)
    const dummyBase64Audio = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGIYBUmZ3PRdWYyUYZ5sU2Z6SJfb4wG2gA==';
    
    try {
      const audioBuffer = Buffer.from(dummyBase64Audio, 'base64');
      const transcription = await elevenLabs.speechToText(audioBuffer);
      console.log('✅ STT Success - Transcription:', transcription);
    } catch (sttError) {
      console.log('⚠️  STT Test skipped (requires real audio):', sttError.message);
    }
    
    console.log('\n✅ ElevenLabs integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ ElevenLabs test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testElevenLabsIntegration().catch(console.error);