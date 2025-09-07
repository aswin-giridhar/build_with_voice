import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🧪 Simple API Test');
console.log('==================');

// Check if environment variables are loaded
console.log('Environment variables check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing');
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'Found' : 'Missing');
console.log('ANAM_API_KEY:', process.env.ANAM_API_KEY ? 'Found' : 'Missing');

// Test basic OpenAI connection
async function testBasicOpenAI() {
  try {
    console.log('\nTesting OpenAI import...');
    const { default: OpenAI } = await import('openai');
    console.log('✅ OpenAI module imported successfully');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No OpenAI API key found');
      return false;
    }
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('✅ OpenAI client created');
    
    // Try a simple API call
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Hello World"' }],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI API call successful');
    console.log('Response:', completion.choices[0].message.content);
    return true;
    
  } catch (error) {
    console.log('❌ OpenAI test failed:', error.message);
    return false;
  }
}

// Test basic ElevenLabs connection
async function testBasicElevenLabs() {
  try {
    console.log('\nTesting ElevenLabs import...');
    const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
    console.log('✅ ElevenLabs module imported successfully');
    
    if (!process.env.ELEVENLABS_API_KEY) {
      console.log('❌ No ElevenLabs API key found');
      return false;
    }
    
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
    
    console.log('✅ ElevenLabs client created');
    
    // Try to get voices
    const voices = await client.voices.getAll();
    console.log('✅ ElevenLabs API call successful');
    console.log('Available voices:', voices.voices.length);
    return true;
    
  } catch (error) {
    console.log('❌ ElevenLabs test failed:', error.message);
    return false;
  }
}

// Test basic Anam connection
async function testBasicAnam() {
  try {
    console.log('\nTesting Anam.ai connection...');
    const { default: axios } = await import('axios');
    console.log('✅ Axios imported successfully');
    
    if (!process.env.ANAM_API_KEY) {
      console.log('❌ No Anam API key found');
      return false;
    }
    
    const client = axios.create({
      baseURL: 'https://api.anam.ai/v1',
      headers: {
        'Authorization': `Bearer ${process.env.ANAM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Anam client created');
    
    // Try session token generation
    const response = await client.post('/auth/session-token', {
      personaConfig: {
        avatarId: '6cc28442-cccd-42a8-b6e4-24b7210a09c5',
        voiceId: 'ba228b78-7120-4ace-ad30-362edadbde8b',
        llmId: 'ANAM_GPT_4O_MINI_V1',
        systemPrompt: 'You are a helpful assistant.'
      }
    });
    
    console.log('✅ Anam.ai API call successful');
    console.log('Session token generated:', response.data.sessionToken ? 'Yes' : 'No');
    return true;
    
  } catch (error) {
    console.log('❌ Anam test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
    return false;
  }
}

async function runSimpleTests() {
  console.log('\n🚀 Running simple API tests...\n');
  
  const results = {
    openai: await testBasicOpenAI(),
    elevenlabs: await testBasicElevenLabs(),
    anam: await testBasicAnam()
  };
  
  console.log('\n📊 Results Summary:');
  console.log('===================');
  Object.entries(results).forEach(([service, success]) => {
    console.log(`${success ? '✅' : '❌'} ${service}: ${success ? 'WORKING' : 'FAILED'}`);
  });
  
  const workingCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 ${workingCount}/3 services working`);
  
  return results;
}

runSimpleTests().catch(console.error);
