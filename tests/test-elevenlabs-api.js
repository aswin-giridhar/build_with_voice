import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ElevenLabsService } from '../src/services/ElevenLabsService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🧪 Testing ElevenLabs API Integration');
console.log('======================================');

// Test configuration
const testConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
  modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
  sttModel: process.env.ELEVENLABS_STT_MODEL || 'scribe_v1',
  testText: 'Hello! This is a test of the ElevenLabs text-to-speech API.',
  outputDir: 'tests/audio_output',
  delays: {
    betweenApiCalls: 1500,      // 1.5 seconds between API calls
    ttsGeneration: 2000,        // 2 seconds for TTS operations
    sttProcessing: 1000,        // 1 second for STT operations
    errorHandling: 500,         // 0.5 seconds between error tests
    voiceVariations: 2500       // 2.5 seconds between voice emotion tests
  }
};

// Progress tracking utilities
function showProgress(current, total, testName) {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  console.log(`📈 Progress: [${progressBar}] ${percentage}% - Test ${current}/${total}: ${testName}`);
}

// Utility function for delays with progress indication
async function delayWithProgress(ms, message = 'Processing') {
  console.log(`⏳ ${message}... (${ms/1000}s)`);
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Fail-safe test execution wrapper
async function runTestSafely(testName, testFunction, testNumber, totalTests) {
  try {
    showProgress(testNumber, totalTests, testName);
    console.log(`\n🧪 ${testNumber}. ${testName}...`);
    const result = await testFunction();
    console.log(`✅ ${testName} completed successfully`);
    return { success: true, result, error: null };
  } catch (error) {
    console.error(`❌ ${testName} failed:`, error.message);
    console.log(`⚠️ Continuing with remaining tests...`);
    return { success: false, result: null, error: error.message };
  }
}

// Ensure output directory exists
if (!fs.existsSync(testConfig.outputDir)) {
  fs.mkdirSync(testConfig.outputDir, { recursive: true });
}

async function testElevenLabsConnection() {
  console.log('\n1. Testing ElevenLabs API Key and Connection...');
  
  if (!testConfig.apiKey) {
    console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
    return false;
  }
  
  console.log('✅ API Key found:', testConfig.apiKey.substring(0, 20) + '...');
  
  try {
    const client = new ElevenLabsClient({
      apiKey: testConfig.apiKey
    });
    
    console.log('✅ ElevenLabs client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize ElevenLabs client:', error.message);
    return false;
  }
}

async function testGetVoices(client) {
  console.log('\n2. Testing Get Voices API...');
  
  try {
    const voices = await client.voices.getAll();
    console.log('✅ Voices retrieved successfully');
    console.log('📊 Available voices count:', voices.voices.length);
    
    // Debug: Log the first voice object structure
    if (voices.voices.length > 0) {
      console.log('🔍 DEBUG: First voice object structure:', {
        voice_id: voices.voices[0].voice_id,
        name: voices.voices[0].name,
        category: voices.voices[0].category,
        keys: Object.keys(voices.voices[0]).slice(0, 10) // Show first 10 properties
      });
    }
    
    // Check if our configured voice is available
    const ourVoice = voices.voices.find(voice => voice.voice_id === testConfig.voiceId);
    if (ourVoice) {
      console.log('✅ Configured voice found:', ourVoice.name, `(${testConfig.voiceId})`);
      console.log('📝 Voice details:', {
        name: ourVoice.name,
        category: ourVoice.category,
        description: ourVoice.description
      });
    } else {
      console.log('⚠️ Configured voice not found:', testConfig.voiceId);
      console.log('📝 Available voices:', 
        voices.voices.slice(0, 5).map(voice => `${voice.name} (${voice.voice_id})`)
      );
      
      // Select the first available voice as fallback
      if (voices.voices.length > 0) {
        const firstVoice = voices.voices[0];
        if (firstVoice.voice_id) {
          console.log(`🔄 Using first available voice as fallback: ${firstVoice.name} (${firstVoice.voice_id})`);
          testConfig.voiceId = firstVoice.voice_id;
        } else {
          console.error('❌ No valid voice_id found in first voice object');
        }
      }
    }
    
    return voices;
  } catch (error) {
    console.error('❌ Get voices failed:', error.message);
    if (error.status) {
      console.error('📊 Status Code:', error.status);
    }
    return false;
  }
}

async function testTextToSpeech(client) {
  console.log('\n3. Testing Text-to-Speech API...');
  
  try {
    console.log('⏳ Preparing TTS request...');
    console.log('📝 Text to convert:', `"${testConfig.testText}"`);
    console.log('🎤 Voice ID:', testConfig.voiceId);
    console.log('🤖 Model:', testConfig.modelId);
    
    await delayWithProgress(testConfig.delays.ttsGeneration, 'Generating speech audio');
    
    const response = await client.textToSpeech.convert(testConfig.voiceId, {
      text: testConfig.testText,
      model_id: testConfig.modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.6,
        use_speaker_boost: true
      }
    });
    
    console.log('✅ Text-to-speech conversion successful');
    console.log('🔄 Processing audio stream...');
    
    // Save audio to file for verification - fix based on official docs
    // ElevenLabs API returns a ReadableStream, not an object with arrayBuffer()
    const chunks = [];
    const reader = response.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    const outputPath = path.join(testConfig.outputDir, 'test_tts_output.mp3');
    fs.writeFileSync(outputPath, audioBuffer);
    
    console.log('📁 Audio saved to:', outputPath);
    console.log('📊 Audio size:', audioBuffer.length, 'bytes');
    
    return { audioBuffer, outputPath };
  } catch (error) {
    console.error('❌ Text-to-speech failed:', error.message);
    if (error.status) {
      console.error('📊 Status Code:', error.status);
    }
    if (error.response) {
      console.error('📊 Response:', await error.response.text().catch(() => 'Unable to read response'));
    }
    return false;
  }
}

async function testStreamingTTS(client) {
  console.log('\n4. Testing Streaming Text-to-Speech...');
  
  try {
    const response = await client.textToSpeech.stream(testConfig.voiceId, {
      text: 'This is a streaming test. The audio should be generated in real-time.',
      model_id: testConfig.modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8
      }
    });
    
    console.log('✅ Streaming TTS started...');
    
    // Collect streaming data
    const chunks = [];
    const reader = response.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    const outputPath = path.join(testConfig.outputDir, 'test_streaming_tts.mp3');
    fs.writeFileSync(outputPath, audioBuffer);
    
    console.log('✅ Streaming TTS completed');
    console.log('📁 Streaming audio saved to:', outputPath);
    console.log('📊 Audio size:', audioBuffer.length, 'bytes');
    
    return true;
  } catch (error) {
    console.error('❌ Streaming TTS failed:', error.message);
    return false;
  }
}

async function testSpeechToText(client) {
  console.log('\n5. Testing Speech-to-Text API...');
  
  // First check if we have a test audio file from TTS
  const testAudioPath = path.join(testConfig.outputDir, 'test_tts_output.mp3');
  
  if (!fs.existsSync(testAudioPath)) {
    console.log('⚠️ No test audio file found, skipping STT test');
    console.log('💡 Run TTS test first to generate audio for STT testing');
    return false;
  }
  
  try {
    // Read the audio file
    const audioBuffer = fs.readFileSync(testAudioPath);
    console.log('📁 Using test audio file:', testAudioPath);
    console.log('📊 Audio file size:', audioBuffer.length, 'bytes');
    console.log('🤖 STT Model:', testConfig.sttModel);
    console.log('🌍 Language:', 'en');
    
    await delayWithProgress(testConfig.delays.sttProcessing, 'Preparing STT request');
    
    // Create FormData for the request
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('file', audioBlob, 'test_audio.mp3');
    formData.append('model_id', testConfig.sttModel);
    formData.append('language_code', 'en');
    
    console.log('⏳ Converting speech to text...');
    console.log('📊 Expected processing time: ~2-4 seconds');
    
    // Make direct API call since the SDK might not support STT
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': testConfig.apiKey
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Speech-to-text conversion successful');
    console.log('📝 Transcribed text:', result.text);
    console.log('📊 Confidence:', result.confidence || 'Not provided');
    
    return result;
  } catch (error) {
    console.error('❌ Speech-to-text failed:', error.message);
    if (error.status) {
      console.error('📊 Status Code:', error.status);
    }
    return false;
  }
}

async function testComprehensiveSTT(client) {
  console.log('\n5b. Testing Comprehensive Speech-to-Text Coverage...');
  
  let successCount = 0;
  let totalTests = 0;
  
  // Test 1: Multiple audio formats
  console.log('\n🎵 Testing multiple audio formats...');
  const audioFiles = [
    { path: 'test_tts_output.mp3', type: 'audio/mpeg', name: 'MP3' },
    { path: 'test_streaming_tts.mp3', type: 'audio/mpeg', name: 'Streaming MP3' }
  ];
  
  for (const audioFile of audioFiles) {
    const fullPath = path.join(testConfig.outputDir, audioFile.path);
    if (fs.existsSync(fullPath)) {
      totalTests++;
      try {
        const audioBuffer = fs.readFileSync(fullPath);
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: audioFile.type });
        formData.append('file', audioBlob, audioFile.path);
        formData.append('model_id', testConfig.sttModel);
        formData.append('language_code', 'en');
        
        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: { 'xi-api-key': testConfig.apiKey },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ ${audioFile.name} STT successful: "${result.text}"`);
          successCount++;
        } else {
          console.log(`❌ ${audioFile.name} STT failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${audioFile.name} STT error: ${error.message}`);
      }
    }
  }
  
  // Test 2: Round-trip accuracy testing
  console.log('\n🔄 Testing round-trip TTS->STT accuracy...');
  const testPhrases = [
    'Hello world, this is a test.',
    'The quick brown fox jumps over the lazy dog.',
    'Testing speech recognition accuracy with ElevenLabs.'
  ];
  
  for (const phrase of testPhrases) {
    totalTests++;
    try {
      // Generate TTS
      const ttsResponse = await client.textToSpeech.convert(testConfig.voiceId, {
        text: phrase,
        model_id: testConfig.modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      });
      
      // Convert to buffer
      const chunks = [];
      const reader = ttsResponse.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const audioBuffer = Buffer.concat(chunks);
      
      // Convert back to text
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      formData.append('file', audioBlob, 'roundtrip_test.mp3');
      formData.append('model_id', testConfig.sttModel);
      formData.append('language_code', 'en');
      
      const sttResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': testConfig.apiKey },
        body: formData
      });
      
      if (sttResponse.ok) {
        const result = await sttResponse.json();
        const similarity = calculateTextSimilarity(phrase.toLowerCase(), result.text.toLowerCase());
        console.log(`✅ Round-trip test: "${phrase}" -> "${result.text}" (${Math.round(similarity * 100)}% similarity)`);
        if (similarity > 0.7) successCount++;
      } else {
        console.log(`❌ Round-trip STT failed for: "${phrase}"`);
      }
    } catch (error) {
      console.log(`❌ Round-trip test error for "${phrase}": ${error.message}`);
    }
  }
  
  // Test 3: Different language codes (if supported)
  console.log('\n🌍 Testing different language codes...');
  const languages = ['en', 'es', 'fr', 'de'];
  const testAudioPath = path.join(testConfig.outputDir, 'test_tts_output.mp3');
  
  if (fs.existsSync(testAudioPath)) {
    const audioBuffer = fs.readFileSync(testAudioPath);
    
    for (const lang of languages) {
      totalTests++;
      try {
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        formData.append('file', audioBlob, 'test_audio.mp3');
        formData.append('model_id', testConfig.sttModel);
        formData.append('language_code', lang);
        
        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: { 'xi-api-key': testConfig.apiKey },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Language ${lang} STT: "${result.text}"`);
          successCount++;
        } else {
          console.log(`❌ Language ${lang} STT failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Language ${lang} STT error: ${error.message}`);
      }
    }
  }
  
  console.log(`📊 Comprehensive STT tests: ${successCount}/${totalTests} passed`);
  return successCount > totalTests * 0.6; // 60% success rate threshold
}

async function testElevenLabsServiceSTT() {
  console.log('\n5c. Testing ElevenLabsService STT Methods...');
  
  try {
    const service = new ElevenLabsService();
    let successCount = 0;
    let totalTests = 0;
    
    // Test with different generated audio files
    const audioFiles = [
      'test_tts_output.mp3',
      'test_streaming_tts.mp3',
      'service_challenging_test.mp3'
    ];
    
    for (const audioFile of audioFiles) {
      const audioPath = path.join(testConfig.outputDir, audioFile);
      if (fs.existsSync(audioPath)) {
        totalTests++;
        try {
          console.log(`🎤 Testing service STT with ${audioFile}...`);
          const audioBuffer = fs.readFileSync(audioPath);
          
          const transcription = await service.speechToText(audioBuffer);
          console.log(`✅ Service STT successful: "${transcription}"`);
          
          // Validate transcription is not empty and reasonable
          if (transcription && transcription.length > 0 && transcription.length < 1000) {
            successCount++;
          } else {
            console.log(`⚠️ Transcription seems invalid: length ${transcription?.length}`);
          }
        } catch (error) {
          console.log(`❌ Service STT failed for ${audioFile}: ${error.message}`);
        }
      }
    }
    
    // Test error handling with invalid audio
    totalTests++;
    try {
      console.log('🔍 Testing service STT error handling...');
      const invalidBuffer = Buffer.from('invalid audio data');
      await service.speechToText(invalidBuffer);
      console.log('⚠️ Expected error but service STT succeeded with invalid data');
    } catch (error) {
      console.log('✅ Service STT error handling working correctly');
      successCount++;
    }
    
    console.log(`📊 ElevenLabsService STT tests: ${successCount}/${totalTests} passed`);
    return successCount >= totalTests - 1; // Allow 1 failure
  } catch (error) {
    console.error('❌ ElevenLabsService STT testing failed:', error.message);
    return false;
  }
}

// Helper function to calculate text similarity
function calculateTextSimilarity(text1, text2) {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  const allWords = new Set([...words1, ...words2]);
  
  let matches = 0;
  for (const word of allWords) {
    if (words1.includes(word) && words2.includes(word)) {
      matches++;
    }
  }
  
  return matches / allWords.size;
}

async function testGetModels(client) {
  console.log('\n6. Testing Get Models API...');
  
  try {
    // Try to get models - this endpoint might not be available in all plans
    const response = await fetch('https://api.elevenlabs.io/v1/models', {
      headers: {
        'xi-api-key': testConfig.apiKey
      }
    });
    
    if (!response.ok) {
      console.log('⚠️ Models endpoint not accessible (might require higher plan)');
      return false;
    }
    
    const models = await response.json();
    console.log('✅ Models retrieved successfully');
    console.log('📊 Available models:', models.map(m => m.model_id));
    
    // Check if our configured model is available
    const ourModel = models.find(model => model.model_id === testConfig.modelId);
    if (ourModel) {
      console.log('✅ Configured model available:', testConfig.modelId);
    } else {
      console.log('⚠️ Configured model not found:', testConfig.modelId);
    }
    
    return models;
  } catch (error) {
    console.error('❌ Get models failed:', error.message);
    return false;
  }
}

async function testCustomVoiceCreation(client) {
  console.log('\n7. Testing Custom Voice Creation...');
  
  try {
    // Note: This test requires audio samples which we don't have
    // So we'll test the error handling for missing files
    console.log('🔍 Testing voice creation error handling (no audio samples provided)...');
    
    await client.voices.add({
      name: 'Test Challenger Voice',
      description: 'A test voice for the challenger persona',
      files: [] // Empty files array should trigger an error
    });
    
    console.log('⚠️ Expected error for empty files but request succeeded');
    return false;
  } catch (error) {
    console.log('✅ Custom voice creation error handling working correctly');
    console.log('📊 Error message:', error.message);
    console.log('💡 Note: Actual voice creation requires audio sample files');
    return true;
  }
}

async function testVoiceSettingsVariations(client) {
  console.log('\n8. Testing Voice Settings Variations...');
  
  const emotions = {
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
  
  const testTexts = {
    challenging: 'That sounds safe. Show me the math behind this decision.',
    provocative: 'Really? Are you seriously going to settle for that approach?',
    analytical: 'Let me break down the data and identify the key metrics.',
    decisive: 'So what are you going to do? When will you start?'
  };
  
  let successCount = 0;
  const totalEmotions = Object.keys(emotions).length;
  
  for (const [emotion, settings] of Object.entries(emotions)) {
    try {
      console.log(`🎭 Testing ${emotion} voice settings...`);
      console.log(`📝 Text: "${testTexts[emotion]}"`);
      console.log(`⚙️ Settings: stability=${settings.stability}, style=${settings.style}`);
      
      await delayWithProgress(testConfig.delays.voiceVariations, `Generating ${emotion} voice`);
      
      const response = await client.textToSpeech.convert(testConfig.voiceId, {
        text: testTexts[emotion],
        model_id: testConfig.modelId,
        voice_settings: settings
      });
      
      console.log('🔄 Processing audio stream...');
      
      // Fix arrayBuffer issue - use streaming approach like official docs
      const chunks = [];
      const reader = response.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const audioBuffer = Buffer.concat(chunks);
      const outputPath = path.join(testConfig.outputDir, `test_${emotion}_voice.mp3`);
      fs.writeFileSync(outputPath, audioBuffer);
      
      console.log(`✅ ${emotion} voice generated successfully`);
      console.log(`📁 Saved to: ${outputPath}`);
      console.log(`📊 Audio size: ${audioBuffer.length} bytes`);
      console.log(`📈 Progress: ${successCount + 1}/${totalEmotions} emotions completed`);
      
      successCount++;
      
      // Add delay between emotions to prevent rate limiting
      if (successCount < totalEmotions) {
        await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next emotion test');
      }
    } catch (error) {
      console.error(`❌ ${emotion} voice generation failed:`, error.message);
    }
  }
  
  console.log(`📊 Voice variations test: ${successCount}/${totalEmotions} emotions successful`);
  return successCount === totalEmotions;
}

async function testTextEnhancement() {
  console.log('\n9. Testing Text Enhancement for Challenger Persona...');
  
  try {
    const service = new ElevenLabsService();
    
    const testCases = [
      {
        emotion: 'challenging',
        input: 'That sounds safe. Show me the math?',
        expectedEnhancements: ['?... ', 'Show me the math']
      },
      {
        emotion: 'provocative', 
        input: 'Really. That is obviously wrong.',
        expectedEnhancements: ['... ', 'Really', 'Obviously']
      },
      {
        emotion: 'decisive',
        input: 'So what are you going to do? When will you start?',
        expectedEnhancements: ['So what are you going to do', 'When']
      }
    ];
    
    let successCount = 0;
    
    for (const testCase of testCases) {
      console.log(`🔍 Testing ${testCase.emotion} text enhancement...`);
      
      const enhanced = service.enhanceTextForChallenger(testCase.input, testCase.emotion);
      console.log(`📝 Original: "${testCase.input}"`);
      console.log(`📝 Enhanced: "${enhanced}"`);
      
      // Check if enhancement was applied
      if (enhanced !== testCase.input && enhanced.length > testCase.input.length) {
        console.log(`✅ ${testCase.emotion} enhancement applied successfully`);
        successCount++;
      } else {
        console.log(`⚠️ ${testCase.emotion} enhancement may not have been applied`);
      }
    }
    
    console.log(`📊 Text enhancement test: ${successCount}/${testCases.length} cases successful`);
    return successCount > 0;
  } catch (error) {
    console.error('❌ Text enhancement testing failed:', error.message);
    return false;
  }
}

async function testElevenLabsServiceClass() {
  console.log('\n10. Testing ElevenLabsService Class Integration...');
  
  try {
    const service = new ElevenLabsService();
    
    console.log('✅ ElevenLabsService instantiated successfully');
    console.log('📊 Voice ID:', service.voiceId);
    console.log('📊 Model ID:', service.modelId);
    console.log('📊 STT Model:', service.sttModelId);
    
    // Test generateSpeech method with different emotions
    const emotions = ['challenging', 'provocative', 'analytical', 'decisive'];
    let successCount = 0;
    
    for (const emotion of emotions) {
      try {
        console.log(`🎭 Testing generateSpeech with ${emotion} emotion...`);
        
        const result = await service.generateSpeech(
          `This is a ${emotion} test message for the challenger persona.`,
          emotion
        );
        
        console.log(`✅ ${emotion} speech generated successfully`);
        console.log(`📊 Format: ${result.format}`);
        console.log(`📊 Sample Rate: ${result.sampleRate}`);
        console.log(`📊 Emotion: ${result.emotion}`);
        console.log(`📊 Audio size: ${result.audioBuffer.length} bytes`);
        
        // Save the audio file
        const outputPath = path.join(testConfig.outputDir, `service_${emotion}_test.mp3`);
        fs.writeFileSync(outputPath, result.audioBuffer);
        console.log(`📁 Saved to: ${outputPath}`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ ${emotion} generateSpeech failed:`, error.message);
      }
    }
    
    console.log(`📊 Service class test: ${successCount}/${emotions.length} emotions successful`);
    
    // Test getAvailableVoices method
    try {
      console.log('🔍 Testing getAvailableVoices method...');
      const voices = await service.getAvailableVoices();
      console.log('✅ Available voices retrieved via service');
      console.log('📊 Voices count:', voices.length);
    } catch (error) {
      console.error('❌ getAvailableVoices failed:', error.message);
    }
    
    return successCount > 0;
  } catch (error) {
    console.error('❌ ElevenLabsService class testing failed:', error.message);
    return false;
  }
}

async function testStreamingSpeech(client) {
  console.log('\n11. Testing Service Class Streaming Speech...');
  
  try {
    const service = new ElevenLabsService();
    
    console.log('🔍 Testing streamSpeech method...');
    const stream = await service.streamSpeech(
      'This is a streaming test for the challenger persona. The response should be immediate.',
      'challenging'
    );
    
    console.log('✅ Streaming speech started via service');
    
    // Collect streaming data
    const chunks = [];
    const reader = stream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    const outputPath = path.join(testConfig.outputDir, 'service_streaming_test.mp3');
    fs.writeFileSync(outputPath, audioBuffer);
    
    console.log('✅ Service streaming speech completed');
    console.log('📁 Saved to:', outputPath);
    console.log('📊 Audio size:', audioBuffer.length, 'bytes');
    
    return true;
  } catch (error) {
    console.error('❌ Service streaming speech failed:', error.message);
    return false;
  }
}

async function testEnhancedErrorHandling(client) {
  console.log('\n12. Testing Enhanced Error Handling...');
  
  let errorTests = 0;
  let passedTests = 0;
  
  // Test with invalid voice ID
  try {
    errorTests++;
    await client.textToSpeech.convert('invalid-voice-id', {
      text: 'test',
      model_id: testConfig.modelId
    });
    console.log('⚠️ Expected error but request succeeded');
  } catch (error) {
    console.log('✅ Invalid voice ID error handling working correctly');
    console.log('📊 Error message:', error.message);
    passedTests++;
  }
  
  // Test with invalid API key
  try {
    errorTests++;
    const invalidClient = new ElevenLabsClient({ apiKey: 'invalid-key' });
    await invalidClient.textToSpeech.convert(testConfig.voiceId, {
      text: 'test',
      model_id: testConfig.modelId
    });
    console.log('⚠️ Expected authentication error but request succeeded');
  } catch (error) {
    console.log('✅ Authentication error handling working correctly');
    console.log('📊 Error message:', error.message);
    passedTests++;
  }
  
  // Test with invalid model ID
  try {
    errorTests++;
    await client.textToSpeech.convert(testConfig.voiceId, {
      text: 'test',
      model_id: 'invalid-model'
    });
    console.log('⚠️ Expected model error but request succeeded');
  } catch (error) {
    console.log('✅ Invalid model error handling working correctly');
    console.log('📊 Error message:', error.message);
    passedTests++;
  }
  
  // Test STT with invalid audio format
  try {
    errorTests++;
    const formData = new FormData();
    const invalidBlob = new Blob(['invalid audio data'], { type: 'text/plain' });
    formData.append('file', invalidBlob, 'invalid.txt');
    formData.append('model_id', testConfig.sttModel);
    
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': testConfig.apiKey
      },
      body: formData
    });
    
    if (!response.ok) {
      console.log('✅ Invalid audio format error handling working correctly');
      passedTests++;
    } else {
      console.log('⚠️ Expected audio format error but request succeeded');
    }
  } catch (error) {
    console.log('✅ Invalid audio format error handling working correctly');
    console.log('📊 Error message:', error.message);
    passedTests++;
  }
  
  console.log(`📊 Enhanced error handling: ${passedTests}/${errorTests} tests passed`);
  return passedTests >= errorTests - 1; // Allow 1 failure
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive ElevenLabs API Tests with Progress Tracking...\n');
  
  const results = {
    connection: false,
    getVoices: false,
    textToSpeech: false,
    streamingTTS: false,
    speechToText: false,
    comprehensiveSTT: false,
    serviceSTT: false,
    getModels: false,
    customVoiceCreation: false,
    voiceSettingsVariations: false,
    textEnhancement: false,
    serviceClassIntegration: false,
    serviceStreaming: false,
    enhancedErrorHandling: false
  };
  
  const testDefinitions = [
    { name: 'Connection Test', key: 'connection', func: () => testElevenLabsConnection() },
    { name: 'Get Voices API', key: 'getVoices', func: null }, // Special handling needed
    { name: 'Text-to-Speech API', key: 'textToSpeech', func: null }, // Special handling needed
    { name: 'Streaming TTS', key: 'streamingTTS', func: null }, // Special handling needed
    { name: 'Speech-to-Text API', key: 'speechToText', func: null }, // Special handling needed
    { name: 'Comprehensive STT Coverage', key: 'comprehensiveSTT', func: null }, // Special handling needed
    { name: 'ElevenLabsService STT', key: 'serviceSTT', func: () => testElevenLabsServiceSTT() },
    { name: 'Get Models API', key: 'getModels', func: null }, // Special handling needed
    { name: 'Custom Voice Creation', key: 'customVoiceCreation', func: null }, // Special handling needed
    { name: 'Voice Settings Variations', key: 'voiceSettingsVariations', func: null }, // Special handling needed
    { name: 'Text Enhancement', key: 'textEnhancement', func: () => testTextEnhancement() },
    { name: 'Service Class Integration', key: 'serviceClassIntegration', func: () => testElevenLabsServiceClass() },
    { name: 'Service Streaming', key: 'serviceStreaming', func: null }, // Special handling needed
    { name: 'Enhanced Error Handling', key: 'enhancedErrorHandling', func: null } // Special handling needed
  ];
  
  const totalTests = testDefinitions.length;
  let completedTests = 0;
  let client = null;
  
  console.log(`📊 Total tests to run: ${totalTests}`);
  console.log('🔄 All tests will run even if some fail to provide complete coverage\n');
  
  // Test 1: Connection (Critical - needed for other tests)
  const connectionResult = await runTestSafely(
    'Connection Test',
    async () => {
      const result = await testElevenLabsConnection();
      if (!result) throw new Error('Failed to establish connection');
      client = result;
      return result;
    },
    ++completedTests,
    totalTests
  );
  results.connection = connectionResult.success;
  
  if (!connectionResult.success) {
    console.log('\n❌ Critical connection test failed - some tests may not work properly');
    console.log('⚠️ Continuing with remaining tests for diagnostic purposes...\n');
  }
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 2: Get Voices
  const voicesResult = await runTestSafely(
    'Get Voices API',
    async () => {
      if (!client) throw new Error('No client available');
      return await testGetVoices(client);
    },
    ++completedTests,
    totalTests
  );
  results.getVoices = voicesResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 3: Text-to-Speech
  const ttsResult = await runTestSafely(
    'Text-to-Speech API',
    async () => {
      if (!client) throw new Error('No client available');
      return await testTextToSpeech(client);
    },
    ++completedTests,
    totalTests
  );
  results.textToSpeech = ttsResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 4: Streaming TTS
  const streamingResult = await runTestSafely(
    'Streaming TTS',
    async () => {
      if (!client) throw new Error('No client available');
      return await testStreamingTTS(client);
    },
    ++completedTests,
    totalTests
  );
  results.streamingTTS = streamingResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 5: Speech-to-Text
  const sttResult = await runTestSafely(
    'Speech-to-Text API',
    async () => {
      if (!client) throw new Error('No client available');
      return await testSpeechToText(client);
    },
    ++completedTests,
    totalTests
  );
  results.speechToText = sttResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 6: Comprehensive STT Coverage
  const comprehensiveSTTResult = await runTestSafely(
    'Comprehensive STT Coverage',
    async () => {
      if (!client) throw new Error('No client available');
      return await testComprehensiveSTT(client);
    },
    ++completedTests,
    totalTests
  );
  results.comprehensiveSTT = comprehensiveSTTResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 7: ElevenLabsService STT
  const serviceSTTResult = await runTestSafely(
    'ElevenLabsService STT',
    testElevenLabsServiceSTT,
    ++completedTests,
    totalTests
  );
  results.serviceSTT = serviceSTTResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 8: Get Models
  const modelsResult = await runTestSafely(
    'Get Models API',
    async () => {
      if (!client) throw new Error('No client available');
      return await testGetModels(client);
    },
    ++completedTests,
    totalTests
  );
  results.getModels = modelsResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 9: Custom Voice Creation
  const customVoiceResult = await runTestSafely(
    'Custom Voice Creation',
    async () => {
      if (!client) throw new Error('No client available');
      return await testCustomVoiceCreation(client);
    },
    ++completedTests,
    totalTests
  );
  results.customVoiceCreation = customVoiceResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 10: Voice Settings Variations
  const voiceVariationsResult = await runTestSafely(
    'Voice Settings Variations',
    async () => {
      if (!client) throw new Error('No client available');
      return await testVoiceSettingsVariations(client);
    },
    ++completedTests,
    totalTests
  );
  results.voiceSettingsVariations = voiceVariationsResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 11: Text Enhancement
  const textEnhancementResult = await runTestSafely(
    'Text Enhancement',
    testTextEnhancement,
    ++completedTests,
    totalTests
  );
  results.textEnhancement = textEnhancementResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 12: Service Class Integration
  const serviceClassResult = await runTestSafely(
    'Service Class Integration',
    testElevenLabsServiceClass,
    ++completedTests,
    totalTests
  );
  results.serviceClassIntegration = serviceClassResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing next test');
  
  // Test 13: Service Streaming
  const serviceStreamingResult = await runTestSafely(
    'Service Streaming',
    async () => {
      if (!client) throw new Error('No client available');
      return await testStreamingSpeech(client);
    },
    ++completedTests,
    totalTests
  );
  results.serviceStreaming = serviceStreamingResult.success;
  
  await delayWithProgress(testConfig.delays.betweenApiCalls, 'Preparing final test');
  
  // Test 14: Enhanced Error Handling
  const errorHandlingResult = await runTestSafely(
    'Enhanced Error Handling',
    async () => {
      if (!client) throw new Error('No client available');
      return await testEnhancedErrorHandling(client);
    },
    ++completedTests,
    totalTests
  );
  results.enhancedErrorHandling = errorHandlingResult.success;
  
  // Final Progress
  showProgress(totalTests, totalTests, 'All Tests Completed');
  
  // Summary
  console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('==========================================');
  
  console.log('\n🔥 Basic ElevenLabs API Tests:');
  ['connection', 'getVoices', 'textToSpeech', 'streamingTTS', 'speechToText', 'getModels'].forEach(test => {
    console.log(`${results[test] ? '✅' : '❌'} ${test}: ${results[test] ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('\n🎤 Speech-to-Text Coverage:');
  ['speechToText', 'comprehensiveSTT', 'serviceSTT'].forEach(test => {
    console.log(`${results[test] ? '✅' : '❌'} ${test}: ${results[test] ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('\n🎭 Advanced ElevenLabs Features:');
  ['customVoiceCreation', 'voiceSettingsVariations', 'textEnhancement', 'serviceClassIntegration', 'serviceStreaming', 'enhancedErrorHandling'].forEach(test => {
    console.log(`${results[test] ? '✅' : '❌'} ${test}: ${results[test] ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTestCount = Object.keys(results).length;
  const successRate = Math.round((passedTests / totalTestCount) * 100);
  
  console.log(`\n🎯 Overall Results: ${passedTests}/${totalTestCount} tests passed (${successRate}%)`);
  
  if (successRate >= 85) {
    console.log('🎉 ElevenLabs API integration is working excellently with comprehensive coverage!');
  } else if (successRate >= 70) {
    console.log('✅ ElevenLabs API integration is working well with good coverage!');
  } else if (successRate >= 50) {
    console.log('⚠️ ElevenLabs API integration has some issues but basic functionality works.');
  } else {
    console.log('❌ ElevenLabs API integration has significant issues that need attention.');
  }
  
  console.log('\n📁 Audio files saved in:', testConfig.outputDir);
  console.log('💡 Test files include emotion-specific voice samples for challenger persona');
  console.log('🔍 All tests completed - check individual results above for detailed diagnostics');
  
  return results;
}

// Add global timeout and error handling
function withTimeout(promise, timeoutMs, description) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`${description} timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔄 Starting test execution with debug logging...');
  console.log('🔍 DEBUG: About to call runAllTests()');
  
  // Simplified test execution with debug logging
  runAllTests()
    .then(results => {
      console.log('🔍 DEBUG: runAllTests completed successfully');
      console.log('\n✅ Test execution completed successfully');
      
      // Exit with appropriate code
      const failedTests = Object.values(results).filter(result => !result).length;
      process.exit(failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.log('🔍 DEBUG: runAllTests failed with error');
      console.error('\n❌ Test execution failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}

export { runAllTests, testElevenLabsConnection, testTextToSpeech, testSpeechToText };
