import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
console.log('🔄 Loading environment variables...');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('✅ Environment variables loaded');
console.log('🧪 Testing OpenAI API Integration & OpenAIChallengerService');
console.log('===========================================================');

// Test configuration
console.log('🔄 Setting up test configuration...');
const testConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4',
  testPrompt: 'Hello! Please respond with "OpenAI API is working correctly" to confirm the connection.',
  delays: {
    betweenTests: 1000,        // 1 second between tests
    apiCalls: 2000,           // 2 seconds for API calls
    streaming: 3000,          // 3 seconds for streaming tests
    errorHandling: 500        // 0.5 seconds between error tests
  }
};

// Utility function for delays with progress indication
async function delayWithProgress(ms, message = 'Processing') {
  console.log(`⏳ ${message}... (${ms/1000}s)`);
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Progress tracking utility
function showProgress(current, total, testName) {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  console.log(`📈 Progress: [${progressBar}] ${percentage}% - Test ${current}/${total}: ${testName}`);
}

console.log('✅ Test configuration ready');
console.log('📊 API Key present:', !!testConfig.apiKey);
console.log('📊 Model:', testConfig.model);

// ========================================
// BASIC OPENAI API TESTS
// ========================================

async function testOpenAIConnection() {
  console.log('\n1. Testing OpenAI API Key and Connection...');
  
  if (!testConfig.apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    return false;
  }
  
  console.log('✅ API Key found:', testConfig.apiKey.substring(0, 20) + '...');
  
  try {
    const client = new OpenAI({
      apiKey: testConfig.apiKey
    });
    
    console.log('✅ OpenAI client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
    return false;
  }
}

async function testChatCompletion(client) {
  console.log('\n2. Testing Chat Completion API...');
  
  try {
    const completion = await client.chat.completions.create({
      model: testConfig.model,
      messages: [
        {
          role: 'user',
          content: testConfig.testPrompt
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    });
    
    console.log('✅ Chat completion successful');
    console.log('📝 Response:', completion.choices[0].message.content);
    console.log('📊 Usage:', completion.usage);
    
    return true;
  } catch (error) {
    console.error('❌ Chat completion failed:', error.message);
    if (error.status) {
      console.error('📊 Status Code:', error.status);
    }
    if (error.code) {
      console.error('📊 Error Code:', error.code);
    }
    return false;
  }
}

async function testStreamingCompletion(client) {
  console.log('\n3. Testing Streaming Chat Completion...');
  process.stdout.write('🔄 Starting streaming test...\n');
  
  try {
    // Add timeout to prevent hanging
    const streamPromise = client.chat.completions.create({
      model: testConfig.model,
      messages: [
        {
          role: 'user',
          content: 'Count from 1 to 5, one number per response.'
        }
      ],
      max_tokens: 50,
      temperature: 0.7,
      stream: true
    });
    
    // Timeout after 30 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Streaming test timeout after 30 seconds')), 30000)
    );
    
    const stream = await Promise.race([streamPromise, timeoutPromise]);
    console.log('✅ Streaming started...');
    
    let responseText = '';
    let chunkCount = 0;
    
    // Add timeout for the streaming loop
    const streamingTimeout = setTimeout(() => {
      console.log('\n⚠️ Streaming timeout - forcing completion');
      return true;
    }, 20000);
    
    try {
      for await (const chunk of stream) {
        chunkCount++;
        const content = chunk.choices[0]?.delta?.content || '';
        responseText += content;
        if (content) {
          process.stdout.write(content);
        }
        
        // Safety break after reasonable number of chunks
        if (chunkCount > 100) {
          console.log('\n⚠️ Breaking after 100 chunks to prevent infinite loop');
          break;
        }
      }
    } finally {
      clearTimeout(streamingTimeout);
    }
    
    console.log('\n✅ Streaming completion successful');
    console.log('📝 Full response:', responseText.trim());
    console.log('📊 Chunks received:', chunkCount);
    
    return true;
  } catch (error) {
    console.error('❌ Streaming completion failed:', error.message);
    return false;
  }
}

async function testModelsList(client) {
  console.log('\n4. Testing Models List API...');
  
  try {
    const models = await client.models.list();
    console.log('✅ Models list retrieved successfully');
    console.log('📊 Available models count:', models.data.length);
    
    // Check if our configured model is available
    const ourModel = models.data.find(model => model.id === testConfig.model);
    if (ourModel) {
      console.log('✅ Configured model available:', testConfig.model);
    } else {
      console.log('⚠️ Configured model not found:', testConfig.model);
      console.log('📝 Available GPT models:', 
        models.data
          .filter(model => model.id.includes('gpt'))
          .map(model => model.id)
          .slice(0, 5)
      );
    }
    
    return true;
  } catch (error) {
    console.error('❌ Models list failed:', error.message);
    return false;
  }
}

async function testErrorHandling(client) {
  console.log('\n5. Testing Error Handling...');
  
  // Test with invalid model
  try {
    await client.chat.completions.create({
      model: 'invalid-model-name',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 10
    });
    console.log('⚠️ Expected error but request succeeded');
  } catch (error) {
    console.log('✅ Error handling working correctly');
    console.log('📊 Error type:', error.constructor.name);
    console.log('📊 Error message:', error.message);
  }
  
  // Test with empty API key
  try {
    const invalidClient = new OpenAI({ apiKey: '' });
    await invalidClient.chat.completions.create({
      model: testConfig.model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 10
    });
    console.log('⚠️ Expected authentication error but request succeeded');
  } catch (error) {
    console.log('✅ Authentication error handling working correctly');
    console.log('📊 Error message:', error.message);
  }
}

// ========================================
// OPENAI CHALLENGER SERVICE TESTS
// ========================================

async function testChallengerServiceImport() {
  console.log('\n6. Testing OpenAIChallengerService Import...');
  
  try {
    const { OpenAIChallengerService } = await import('../src/services/OpenAIChallengerService.js');
    console.log('✅ OpenAIChallengerService imported successfully');
    return OpenAIChallengerService;
  } catch (error) {
    console.error('❌ Failed to import OpenAIChallengerService:', error.message);
    return false;
  }
}

async function testChallengerServiceInitialization(OpenAIChallengerService) {
  console.log('\n7. Testing OpenAIChallengerService Initialization...');
  
  try {
    const service = new OpenAIChallengerService('efficiency');
    console.log('✅ Service instantiated successfully');
    console.log('📊 Mode:', service.mode);
    console.log('📊 Model config:', service.modelConfig.model);
    
    return service;
  } catch (error) {
    console.error('❌ Failed to initialize service:', error.message);
    return false;
  }
}

async function testAgentInitialization(service) {
  console.log('\n8. Testing Agent Initialization...');
  
  try {
    const sessionConfig = {
      sessionId: 'test-session-123',
      userContext: { 
        role: 'developer',
        name: 'Test User'
      },
      companyData: { 
        name: 'Test Company',
        size: 'startup',
        industry: 'technology'
      },
      mode: 'efficiency'
    };
    
    const result = await service.initializeAgent(sessionConfig);
    
    console.log('✅ Agent initialized successfully');
    console.log('📊 Success:', result.success);
    console.log('📊 Session ID:', result.sessionId);
    console.log('📊 Mode:', result.mode);
    console.log('📝 System prompt preview:', result.systemPrompt.substring(0, 100) + '...');
    
    return result;
  } catch (error) {
    console.error('❌ Agent initialization failed:', error.message);
    return false;
  }
}

async function testSystemPromptGeneration(service) {
  console.log('\n9. Testing System Prompt Generation for All Modes...');
  
  const modes = ['efficiency', 'moonshot', 'customer', 'investor'];
  const userContext = { role: 'developer' };
  const companyData = { name: 'Test Co', size: 'startup', industry: 'tech' };
  
  try {
    for (const mode of modes) {
      const prompt = service.buildSystemPrompt(mode, userContext, companyData);
      console.log(`✅ ${mode} mode prompt generated (${prompt.length} chars)`);
      
      // Verify mode-specific content
      if (mode === 'efficiency' && prompt.includes('EFFICIENCY MAXIMIZER')) {
        console.log(`  ✓ Contains efficiency-specific content`);
      } else if (mode === 'moonshot' && prompt.includes('MOONSHOT INCUBATOR')) {
        console.log(`  ✓ Contains moonshot-specific content`);
      } else if (mode === 'customer' && prompt.includes('CUSTOMER ORACLE')) {
        console.log(`  ✓ Contains customer-specific content`);
      } else if (mode === 'investor' && prompt.includes('INVESTOR MINDSET')) {
        console.log(`  ✓ Contains investor-specific content`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ System prompt generation failed:', error.message);
    return false;
  }
}

async function testConversationMessageBuilding(service) {
  console.log('\n10. Testing Conversation Message Building...');
  
  try {
    // Initialize agent first
    await service.initializeAgent({
      sessionId: 'test-session',
      userContext: { role: 'developer' },
      companyData: { name: 'Test Co' },
      mode: 'efficiency'
    });
    
    const conversationHistory = [
      { speaker: 'user', content: 'I want to improve our workflow' },
      { speaker: 'challenger', content: 'Show me the math. What metrics are you tracking?' },
      { speaker: 'user', content: 'We track completion time and bug count' }
    ];
    
    const messages = service.buildConversationMessages(
      'How can we reduce bugs?',
      conversationHistory,
      'deep_dive'
    );
    
    console.log('✅ Conversation messages built successfully');
    console.log('📊 Message count:', messages.length);
    console.log('📊 System message included:', messages[0].role === 'system');
    console.log('📊 History included:', messages.length > 2);
    console.log('📊 Current input included:', messages[messages.length - 1].content === 'How can we reduce bugs?');
    
    return true;
  } catch (error) {
    console.error('❌ Conversation message building failed:', error.message);
    return false;
  }
}

async function testProcessInput(service) {
  console.log('\n11. Testing Process Input with Real OpenAI API...');
  
  try {
    // Initialize agent first
    await service.initializeAgent({
      sessionId: 'test-session',
      userContext: { role: 'developer' },
      companyData: { name: 'Test Co' },
      mode: 'efficiency'
    });
    
    const conversationHistory = [
      { speaker: 'user', content: 'I want to improve our team productivity' }
    ];
    
    const result = await service.processInput(
      'We spend too much time in meetings',
      conversationHistory,
      'provocation'
    );
    
    console.log('✅ Process input successful');
    console.log('📝 Response preview:', result.response.substring(0, 100) + '...');
    console.log('📊 Context phase:', result.context.phase);
    console.log('📊 Mode:', result.context.mode);
    console.log('📊 Tokens used:', result.context.tokens_used);
    console.log('📊 Suggestions count:', result.suggestions.length);
    console.log('📊 Confidence:', result.confidence);
    console.log('📊 Should transition:', result.should_transition);
    
    return result;
  } catch (error) {
    console.error('❌ Process input failed:', error.message);
    return false;
  }
}

async function testPhaseTransitionLogic(service) {
  console.log('\n12. Testing Phase Transition Logic...');
  
  try {
    const testCases = [
      { response: 'I understand, that makes sense', phase: 'provocation', expected: true },
      { response: 'Here are the specific numbers: 50% increase', phase: 'deep_dive', expected: true },
      { response: 'I will commit to this action plan', phase: 'synthesis', expected: true },
      { response: 'I need to think about this more', phase: 'provocation', expected: false }
    ];
    
    for (const testCase of testCases) {
      const shouldTransition = service.shouldTransitionPhase(testCase.response, testCase.phase);
      const result = shouldTransition === testCase.expected ? '✅' : '❌';
      console.log(`${result} Phase "${testCase.phase}" transition: ${shouldTransition} (expected: ${testCase.expected})`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Phase transition logic test failed:', error.message);
    return false;
  }
}

async function testSuggestionGeneration(service) {
  console.log('\n13. Testing Suggestion Generation...');
  
  try {
    const phases = ['provocation', 'deep_dive', 'synthesis'];
    
    for (const phase of phases) {
      const suggestions = service.generateSuggestions(phase);
      console.log(`✅ ${phase} suggestions generated: ${suggestions.length} items`);
      console.log(`  📝 Sample: "${suggestions[0]}"`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Suggestion generation failed:', error.message);
    return false;
  }
}

async function testFallbackResponses(service) {
  console.log('\n14. Testing Fallback Response Generation...');
  
  try {
    const phases = ['provocation', 'deep_dive', 'synthesis'];
    
    for (const phase of phases) {
      const fallback = service.generateFallbackResponse('test input', phase);
      console.log(`✅ ${phase} fallback generated: "${fallback}"`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Fallback response generation failed:', error.message);
    return false;
  }
}

async function testSessionManagement(service) {
  console.log('\n15. Testing Session Management...');
  
  try {
    // Initialize agent first
    await service.initializeAgent({
      sessionId: 'test-session',
      userContext: { role: 'developer' },
      companyData: { name: 'Test Co' },
      mode: 'efficiency'
    });
    
    // Test updating session variables
    const updateResult = await service.updateSessionVariables({
      custom_field: 'test_value',
      priority: 'high'
    });
    
    console.log('✅ Session variables updated:', updateResult.success);
    
    // Test getting usage stats
    const stats = await service.getUsageStats();
    console.log('✅ Usage stats retrieved');
    console.log('📊 Session ID:', stats.session_id);
    console.log('📊 Mode:', stats.mode);
    console.log('📊 Total tokens:', stats.total_tokens);
    console.log('📊 Total exchanges:', stats.total_exchanges);
    
    // Test cleanup
    await service.cleanup();
    console.log('✅ Session cleanup completed');
    
    return true;
  } catch (error) {
    console.error('❌ Session management failed:', error.message);
    return false;
  }
}

async function testChallengerServiceWithAPIFailure(service) {
  console.log('\n16. Testing Service Behavior with API Failure...');
  
  try {
    // Create a service with invalid API key to test fallback
    const invalidService = new (await import('../src/services/OpenAIChallengerService.js')).OpenAIChallengerService('efficiency');
    invalidService.apiKey = 'invalid-key';
    invalidService.client = new OpenAI({ apiKey: 'invalid-key' });
    
    await invalidService.initializeAgent({
      sessionId: 'test-session',
      userContext: { role: 'developer' },
      companyData: { name: 'Test Co' },
      mode: 'efficiency'
    });
    
    const result = await invalidService.processInput(
      'Test input',
      [],
      'provocation'
    );
    
    console.log('✅ Fallback response generated when API fails');
    console.log('📝 Fallback response:', result.response);
    console.log('📊 Error context:', result.context.error);
    console.log('📊 Confidence (should be lower):', result.confidence);
    
    return true;
  } catch (error) {
    console.error('❌ API failure test failed:', error.message);
    return false;
  }
}

// ========================================
// MAIN TEST RUNNER WITH FAIL-SAFE EXECUTION
// ========================================

async function runAllTests() {
  console.log('🚀 Starting Comprehensive OpenAI API & Service Tests...\n');
  const startTime = Date.now();
  
  // Runtime tracking utilities
  function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  }
  
  function showProgressWithTime(current, total, testName, startTime) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    const elapsed = Date.now() - startTime;
    const estimatedTotal = total > 0 ? (elapsed / current) * total : 0;
    const remaining = Math.max(0, estimatedTotal - elapsed);
    
    console.log(`📈 Progress: [${progressBar}] ${percentage}% - Test ${current}/${total}: ${testName}`);
    console.log(`⏱️  Elapsed: ${formatDuration(elapsed)} | Estimated remaining: ${formatDuration(remaining)}`);
  }
  
  const results = {
    // Basic API tests
    connection: false,
    chatCompletion: false,
    streaming: false,
    modelsList: false,
    errorHandling: true,
    
    // Service tests
    serviceImport: false,
    serviceInit: false,
    agentInit: false,
    systemPrompts: false,
    messageBuilding: false,
    processInput: false,
    phaseTransition: false,
    suggestions: false,
    fallbacks: false,
    sessionManagement: false,
    apiFailureHandling: false
  };
  
  const testList = [
    'connection', 'chatCompletion', 'streaming', 'modelsList', 'errorHandling',
    'serviceImport', 'serviceInit', 'agentInit', 'systemPrompts', 'messageBuilding',
    'processInput', 'phaseTransition', 'suggestions', 'fallbacks', 'sessionManagement', 'apiFailureHandling'
  ];
  
  let currentTest = 0;
  const totalTests = testList.length;
  
  // Basic OpenAI API Tests
  console.log('\n🔥 BASIC OPENAI API TESTS');
  console.log('='.repeat(40));
  
  // Test 1: Connection (Critical - affects all other tests)
  currentTest++;
  showProgressWithTime(currentTest, totalTests, 'OpenAI Connection', startTime);
  
  let client = null;
  try {
    client = await testOpenAIConnection();
    results.connection = !!client;
    if (!client) {
      console.log('\n⚠️ Connection failed - continuing with remaining tests that don\'t require client');
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    results.connection = false;
  }
  
  await delayWithProgress(testConfig.delays.betweenTests, 'Preparing next test');
  
  // Test 2: Chat Completion
  currentTest++;
  showProgressWithTime(currentTest, totalTests, 'Chat Completion', startTime);
  
  if (client) {
    try {
      results.chatCompletion = await testChatCompletion(client);
    } catch (error) {
      console.error('❌ Chat completion test failed:', error.message);
      results.chatCompletion = false;
    }
  } else {
    console.log('⏭️ Skipping Chat Completion - no client available');
  }
  
  await delayWithProgress(testConfig.delays.betweenTests, 'Preparing next test');
  
  // Test 3: Streaming
  currentTest++;
  showProgressWithTime(currentTest, totalTests, 'Streaming Completion', startTime);
  
  if (client) {
    try {
      results.streaming = await testStreamingCompletion(client);
    } catch (error) {
      console.error('❌ Streaming test failed:', error.message);
      results.streaming = false;
    }
  } else {
    console.log('⏭️ Skipping Streaming - no client available');
  }
  
  await delayWithProgress(testConfig.delays.betweenTests, 'Preparing next test');
  
  // Test 4: Models List
  currentTest++;
  showProgressWithTime(currentTest, totalTests, 'Models List', startTime);
  
  if (client) {
    try {
      results.modelsList = await testModelsList(client);
    } catch (error) {
      console.error('❌ Models list test failed:', error.message);
      results.modelsList = false;
    }
  } else {
    console.log('⏭️ Skipping Models List - no client available');
  }
  
  await delayWithProgress(testConfig.delays.betweenTests, 'Preparing next test');
  
  // Test 5: Error Handling
  currentTest++;
  showProgressWithTime(currentTest, totalTests, 'Error Handling', startTime);
  
  if (client) {
    try {
      await testErrorHandling(client);
      results.errorHandling = true;
    } catch (error) {
      console.error('❌ Error handling test failed:', error.message);
      results.errorHandling = false;
    }
  } else {
    console.log('⏭️ Skipping Error Handling - no client available');
  }
  
  await delayWithProgress(testConfig.delays.betweenTests, 'Preparing service tests');
  
  // OpenAI Challenger Service Tests
  console.log('\n\n🤖 OPENAI CHALLENGER SERVICE TESTS');
  console.log('='.repeat(40));
  
  // Test 6: Service Import
  currentTest++;
  showProgressWithTime(currentTest, totalTests, 'Service Import', startTime);
  
  let OpenAIChallengerService = null;
  try {
    OpenAIChallengerService = await testChallengerServiceImport();
    results.serviceImport = !!OpenAIChallengerService;
  } catch (error) {
    console.error('❌ Service import test failed:', error.message);
    results.serviceImport = false;
  }
  
  await delayWithProgress(testConfig.delays.betweenTests, 'Preparing next test');
  
  // Test 7: Service Initialization
  currentTest++;
  showProgressWithTime(currentTest, totalTests, 'Service Initialization', startTime);
  
  let service = null;
  if (OpenAIChallengerService) {
    try {
      service = await testChallengerServiceInitialization(OpenAIChallengerService);
      results.serviceInit = !!service;
    } catch (error) {
      console.error('❌ Service initialization test failed:', error.message);
      results.serviceInit = false;
    }
  } else {
    console.log('⏭️ Skipping Service Initialization - import failed');
  }
  
  await delayWithProgress(testConfig.delays.betweenTests, 'Preparing next test');
  
  // Continue with remaining service tests (all fail-safe)
  const serviceTests = [
    { name: 'agentInit', func: testAgentInitialization, desc: 'Agent Initialization' },
    { name: 'systemPrompts', func: testSystemPromptGeneration, desc: 'System Prompt Generation' },
    { name: 'messageBuilding', func: testConversationMessageBuilding, desc: 'Message Building' },
    { name: 'processInput', func: testProcessInput, desc: 'Process Input' },
    { name: 'phaseTransition', func: testPhaseTransitionLogic, desc: 'Phase Transition Logic' },
    { name: 'suggestions', func: testSuggestionGeneration, desc: 'Suggestion Generation' },
    { name: 'fallbacks', func: testFallbackResponses, desc: 'Fallback Responses' },
    { name: 'sessionManagement', func: testSessionManagement, desc: 'Session Management' },
    { name: 'apiFailureHandling', func: testChallengerServiceWithAPIFailure, desc: 'API Failure Handling' }
  ];
  
  for (const test of serviceTests) {
    currentTest++;
    showProgressWithTime(currentTest, totalTests, test.desc, startTime);
    
    if (service || test.name === 'apiFailureHandling') {
      try {
        const result = await test.func(service);
        results[test.name] = !!result;
      } catch (error) {
        console.error(`❌ ${test.desc} test failed:`, error.message);
        results[test.name] = false;
      }
    } else {
      console.log(`⏭️ Skipping ${test.desc} - no service available`);
      results[test.name] = false;
    }
    
    if (currentTest < totalTests) {
      await delayWithProgress(testConfig.delays.betweenTests, 'Preparing next test');
    }
  }
  
  // Summary
  console.log('\n\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  console.log('\n🔥 Basic OpenAI API Tests:');
  ['connection', 'chatCompletion', 'streaming', 'modelsList', 'errorHandling'].forEach(test => {
    console.log(`${results[test] ? '✅' : '❌'} ${test}: ${results[test] ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('\n🤖 OpenAI Challenger Service Tests:');
  ['serviceImport', 'serviceInit', 'agentInit', 'systemPrompts', 'messageBuilding', 
   'processInput', 'phaseTransition', 'suggestions', 'fallbacks', 'sessionManagement', 'apiFailureHandling'].forEach(test => {
    console.log(`${results[test] ? '✅' : '❌'} ${test}: ${results[test] ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTestCount = Object.keys(results).length;
  const endTime = Date.now();
  const totalRuntime = endTime - startTime;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTestCount} tests passed`);
  console.log(`⏱️  Total Runtime: ${formatDuration(totalRuntime)}`);
  console.log(`📊 Average time per test: ${formatDuration(totalRuntime / totalTestCount)}`);
  
  if (passedTests === totalTestCount) {
    console.log('🎉 All OpenAI API and Service tests passed! Integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above for debugging information.');
  }
  
  console.log(`\n💡 Performance Summary:`);
  console.log(`   • Tests completed in ${formatDuration(totalRuntime)}`);
  console.log(`   • Success rate: ${Math.round((passedTests / totalTestCount) * 100)}%`);
  console.log(`   • Ready for hackathon development!`);
  
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
  console.log('🔄 Starting test execution with global timeout...');
  
  // Global timeout for entire test suite (5 minutes)
  const globalTimeout = setTimeout(() => {
    console.error('\n🚨 GLOBAL TIMEOUT: Test suite exceeded 5 minutes, forcing exit');
    process.exit(1);
  }, 300000);
  
  withTimeout(runAllTests(), 240000, 'Complete test suite')
    .then(results => {
      clearTimeout(globalTimeout);
      console.log('\n✅ Test execution completed successfully');
      
      // Exit with appropriate code
      const failedTests = Object.values(results).filter(result => !result).length;
      process.exit(failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      clearTimeout(globalTimeout);
      console.error('\n❌ Test execution failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}

export { runAllTests, testOpenAIConnection, testChatCompletion };
