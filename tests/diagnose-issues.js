import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔍 DIAGNOSING API INTEGRATION ISSUES');
console.log('====================================');

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
async function runDiagnosticSafely(testName, testFunction, testNumber, totalTests) {
  try {
    showProgress(testNumber, totalTests, testName);
    console.log(`\n🔍 ${testNumber}. ${testName}...`);
    const result = await testFunction();
    console.log(`✅ ${testName} completed successfully`);
    return { success: true, result, error: null };
  } catch (error) {
    console.error(`❌ ${testName} failed:`, error.message);
    console.log(`⚠️ Continuing with remaining diagnostics...`);
    return { success: false, result: null, error: error.message };
  }
}

// Import and test your existing service classes
async function diagnoseServices() {
  console.log('🚀 Starting Comprehensive Service Diagnostics with Progress Tracking...\n');
  
  const results = {
    environmentCheck: false,
    openaiService: false,
    elevenLabsService: false,
    anamService: false,
    mainAppIntegration: false
  };
  
  const totalTests = 5;
  let completedTests = 0;
  
  console.log(`📊 Total diagnostics to run: ${totalTests}`);
  console.log('🔄 All diagnostics will run even if some fail to provide complete coverage\n');
  
  // Test 1: Environment Variables Check
  const envCheckResult = await runDiagnosticSafely(
    'Environment Variables Check',
    async () => {
      console.log('\n📋 Checking environment variables...');
      const requiredVars = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY', 'ANAM_API_KEY'];
      const envStatus = {};
      
      requiredVars.forEach(varName => {
        const exists = !!process.env[varName];
        envStatus[varName] = exists;
        console.log(`${varName}: ${exists ? '✅ Found' : '❌ Missing'}`);
      });
      
      const allPresent = Object.values(envStatus).every(Boolean);
      if (!allPresent) {
        throw new Error('Some required environment variables are missing');
      }
      
      return envStatus;
    },
    ++completedTests,
    totalTests
  );
  results.environmentCheck = envCheckResult.success;
  
  await delayWithProgress(1000, 'Preparing next diagnostic');
  
  // Test 2: OpenAI Service
  const openaiResult = await runDiagnosticSafely(
    'OpenAI Service Integration',
    async () => {
      console.log('\n🤖 Testing OpenAI Service Class...');
      await delayWithProgress(1500, 'Loading OpenAI service');
      
      const { OpenAIChallengerService } = await import('../src/services/OpenAIChallengerService.js');
      const openaiService = new OpenAIChallengerService('efficiency');
      
      console.log('✅ OpenAI service imported and instantiated');
      
      // Test initialization
      await delayWithProgress(2000, 'Initializing OpenAI agent');
      const initResult = await openaiService.initializeAgent({
        sessionId: 'test-session',
        userContext: { role: 'developer' },
        companyData: { name: 'Test Company' },
        mode: 'efficiency'
      });
      
      console.log('✅ OpenAI service initialized:', initResult.success ? 'SUCCESS' : 'FAILED');
      
      if (!initResult.success) {
        throw new Error('OpenAI service initialization failed');
      }
      
      // Test a simple input
      await delayWithProgress(3000, 'Testing OpenAI response generation');
      const response = await openaiService.processInput(
        'Hello, can you help me optimize my workflow?',
        [],
        'provocation'
      );
      
      console.log('✅ OpenAI service response received');
      console.log('📝 Response preview:', response.response.substring(0, 100) + '...');
      
      return { initResult, response };
    },
    ++completedTests,
    totalTests
  );
  results.openaiService = openaiResult.success;
  
  await delayWithProgress(1000, 'Preparing next diagnostic');
  
  // Test 3: ElevenLabs Service
  const elevenLabsResult = await runDiagnosticSafely(
    'ElevenLabs Service Integration',
    async () => {
      console.log('\n🎤 Testing ElevenLabs Service Class...');
      await delayWithProgress(1500, 'Loading ElevenLabs service');
      
      const { ElevenLabsService } = await import('../src/services/ElevenLabsService.js');
      const elevenLabsService = new ElevenLabsService();
      
      console.log('✅ ElevenLabs service imported and instantiated');
      
      // Test text-to-speech
      await delayWithProgress(3000, 'Testing text-to-speech generation');
      const audioResult = await elevenLabsService.generateSpeech(
        'Hello, this is a test of the ElevenLabs integration.',
        'challenging'
      );
      
      console.log('✅ ElevenLabs TTS successful');
      console.log('📊 Audio buffer size:', audioResult.audioBuffer.length, 'bytes');
      console.log('📊 Format:', audioResult.format);
      console.log('📊 Emotion:', audioResult.emotion);
      
      return audioResult;
    },
    ++completedTests,
    totalTests
  );
  results.elevenLabsService = elevenLabsResult.success;
  
  await delayWithProgress(1000, 'Preparing next diagnostic');
  
  // Test 4: Anam Service
  const anamResult = await runDiagnosticSafely(
    'Anam Service Integration',
    async () => {
      console.log('\n🎭 Testing Anam Service Class...');
      await delayWithProgress(1500, 'Loading Anam service');
      
      const { AnamService } = await import('../src/services/AnamService.js');
      const anamService = new AnamService();
      
      console.log('✅ Anam service imported and instantiated');
      
      // Test avatar initialization
      await delayWithProgress(2500, 'Initializing Anam avatar');
      const avatarResult = await anamService.initializeAvatar('efficiency');
      
      console.log('✅ Anam avatar initialized');
      console.log('📝 Session token preview:', avatarResult.sessionToken.substring(0, 20) + '...');
      
      return avatarResult;
    },
    ++completedTests,
    totalTests
  );
  results.anamService = anamResult.success;
  
  await delayWithProgress(1000, 'Preparing final diagnostic');
  
  // Test 5: Main App Integration
  const mainAppResult = await runDiagnosticSafely(
    'Main App Integration',
    async () => {
      console.log('\n🚀 Testing Main App Integration...');
      await delayWithProgress(1500, 'Loading main app components');
      
      const { UnhingedColleagueSession } = await import('../src/services/UnhingedColleagueSession.js');
      
      console.log('✅ UnhingedColleagueSession imported successfully');
      
      // Create a mock socket for testing
      const mockSocket = {
        emit: (event, data) => console.log(`📡 Socket emit: ${event}`, typeof data),
        id: 'test-socket-id'
      };
      
      const session = new UnhingedColleagueSession(
        mockSocket,
        { role: 'developer' },
        'efficiency',
        { name: 'Test Company' },
        console
      );
      
      console.log('✅ Session created successfully');
      
      // Test initialization
      await delayWithProgress(2000, 'Initializing session');
      await session.initialize();
      console.log('✅ Session initialized successfully');
      
      return { session, mockSocket };
    },
    ++completedTests,
    totalTests
  );
  results.mainAppIntegration = mainAppResult.success;
  
  // Final Progress
  showProgress(totalTests, totalTests, 'All Diagnostics Completed');
  
  // Comprehensive Summary
  console.log('\n📊 COMPREHENSIVE DIAGNOSTIC RESULTS');
  console.log('=====================================');
  
  console.log('\n🔧 Core Infrastructure:');
  console.log(`${results.environmentCheck ? '✅' : '❌'} Environment Variables: ${results.environmentCheck ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n🤖 Service Integrations:');
  console.log(`${results.openaiService ? '✅' : '❌'} OpenAI Service: ${results.openaiService ? 'PASSED' : 'FAILED'}`);
  console.log(`${results.elevenLabsService ? '✅' : '❌'} ElevenLabs Service: ${results.elevenLabsService ? 'PASSED' : 'FAILED'}`);
  console.log(`${results.anamService ? '✅' : '❌'} Anam Service: ${results.anamService ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n🚀 Application Integration:');
  console.log(`${results.mainAppIntegration ? '✅' : '❌'} Main App Integration: ${results.mainAppIntegration ? 'PASSED' : 'FAILED'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n🎯 Overall Results: ${passedTests}/${totalTests} diagnostics passed (${successRate}%)`);
  
  if (successRate >= 80) {
    console.log('🎉 Excellent! Most services are working correctly!');
  } else if (successRate >= 60) {
    console.log('✅ Good! Most core functionality is working with some issues to address.');
  } else if (successRate >= 40) {
    console.log('⚠️ Partial functionality - several services need attention.');
  } else {
    console.log('❌ Multiple critical issues detected - significant troubleshooting needed.');
  }
  
  // Detailed Recommendations
  console.log('\n💡 DETAILED RECOMMENDATIONS:');
  
  if (!results.environmentCheck) {
    console.log('\n🔴 CRITICAL: Environment Variables');
    console.log('  - Ensure all API keys are properly set in your .env file');
    console.log('  - Verify .env file is in the project root directory');
    console.log('  - Check for typos in environment variable names');
  }
  
  if (!results.openaiService) {
    console.log('\n🔴 CRITICAL: OpenAI Service');
    console.log('  - Verify OPENAI_API_KEY is valid and has sufficient credits');
    console.log('  - Check if the configured model (gpt-4) is accessible');
    console.log('  - Ensure network connectivity to OpenAI servers');
    console.log('  - Review OpenAIChallengerService.js for implementation issues');
  }
  
  if (!results.elevenLabsService) {
    console.log('\n🔴 CRITICAL: ElevenLabs Service');
    console.log('  - Verify ELEVENLABS_API_KEY is valid and active');
    console.log('  - Check if voice ID exists in your ElevenLabs account');
    console.log('  - Ensure you have sufficient character quota');
    console.log('  - Review ElevenLabsService.js for implementation issues');
  }
  
  if (!results.anamService) {
    console.log('\n🔴 CRITICAL: Anam Service');
    console.log('  - Verify ANAM_API_KEY is correct and active');
    console.log('  - Check if avatar/voice/LLM IDs exist in your account');
    console.log('  - Verify API endpoint structure hasn\'t changed');
    console.log('  - Review AnamService.js for implementation issues');
  }
  
  if (!results.mainAppIntegration) {
    console.log('\n🟡 WARNING: Main App Integration');
    console.log('  - Check UnhingedColleagueSession.js for dependency issues');
    console.log('  - Verify all service imports are working correctly');
    console.log('  - Review session initialization logic');
  }
  
  if (passedTests === totalTests) {
    console.log('\n🚀 All systems operational! Ready for hackathon development!');
  } else {
    console.log('\n🔧 Focus on fixing the failed services above before proceeding');
  }
  
  console.log('\n🔍 All diagnostics completed - check individual results above for detailed troubleshooting');
  
  return results;
}

diagnoseServices().catch(error => {
  console.error('❌ Diagnosis failed:', error.message);
  console.error('🔍 Stack trace:', error.stack);
});
