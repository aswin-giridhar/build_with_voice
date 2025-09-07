import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAllTests as runOpenAITests } from './test-openai-api.js';
import { runAllTests as runElevenLabsTests } from './test-elevenlabs-api.js';
import { runAllTests as runAnamTests } from './test-anam-api.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 COMPREHENSIVE API TESTING SUITE');
console.log('===================================');
console.log('Testing all API integrations for the hackathon project\n');

async function runComprehensiveTests() {
  const startTime = Date.now();
  const allResults = {};
  
  console.log('📋 ENVIRONMENT CHECK');
  console.log('====================');
  
  // Check environment variables
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY', 
    'ANAM_API_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('💡 Please check your .env file and ensure all API keys are set');
    return;
  } else {
    console.log('✅ All required environment variables found');
  }
  
  console.log('\n🔍 API KEYS STATUS:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`✅ ${varName}: ${value ? value.substring(0, 20) + '...' : 'NOT SET'}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Test 1: OpenAI API
  try {
    console.log('\n🤖 TESTING OPENAI API');
    console.log('='.repeat(30));
    allResults.openai = await runOpenAITests();
  } catch (error) {
    console.error('❌ OpenAI tests failed with error:', error.message);
    allResults.openai = { error: error.message };
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 2: ElevenLabs API
  try {
    console.log('\n🎤 TESTING ELEVENLABS API');
    console.log('='.repeat(30));
    allResults.elevenlabs = await runElevenLabsTests();
  } catch (error) {
    console.error('❌ ElevenLabs tests failed with error:', error.message);
    allResults.elevenlabs = { error: error.message };
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 3: Anam.ai API
  try {
    console.log('\n🎭 TESTING ANAM.AI API');
    console.log('='.repeat(30));
    allResults.anam = await runAnamTests();
  } catch (error) {
    console.error('❌ Anam.ai tests failed with error:', error.message);
    allResults.anam = { error: error.message };
  }
  
  // Generate comprehensive report
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  
  const serviceResults = [];
  
  // Analyze OpenAI results
  if (allResults.openai?.error) {
    serviceResults.push({
      service: 'OpenAI',
      status: 'ERROR',
      details: allResults.openai.error,
      critical: true
    });
  } else if (allResults.openai) {
    const passed = Object.values(allResults.openai).filter(Boolean).length;
    const total = Object.keys(allResults.openai).length;
    serviceResults.push({
      service: 'OpenAI',
      status: passed === total ? 'PASS' : 'PARTIAL',
      details: `${passed}/${total} tests passed`,
      critical: passed < 3 // Connection, chat completion, and at least one more
    });
  }
  
  // Analyze ElevenLabs results
  if (allResults.elevenlabs?.error) {
    serviceResults.push({
      service: 'ElevenLabs',
      status: 'ERROR',
      details: allResults.elevenlabs.error,
      critical: true
    });
  } else if (allResults.elevenlabs) {
    const passed = Object.values(allResults.elevenlabs).filter(Boolean).length;
    const total = Object.keys(allResults.elevenlabs).length;
    serviceResults.push({
      service: 'ElevenLabs',
      status: passed >= total - 1 ? 'PASS' : 'PARTIAL', // Allow 1 failure
      details: `${passed}/${total} tests passed`,
      critical: !allResults.elevenlabs.connection || !allResults.elevenlabs.textToSpeech
    });
  }
  
  // Analyze Anam.ai results
  if (allResults.anam?.error) {
    serviceResults.push({
      service: 'Anam.ai',
      status: 'ERROR',
      details: allResults.anam.error,
      critical: true
    });
  } else if (allResults.anam) {
    const passed = Object.values(allResults.anam).filter(Boolean).length;
    const total = Object.keys(allResults.anam).length;
    const hasSessionToken = allResults.anam.sessionToken || allResults.anam.alternativeEndpoints;
    serviceResults.push({
      service: 'Anam.ai',
      status: hasSessionToken ? 'PASS' : 'FAIL',
      details: `${passed}/${total} tests passed`,
      critical: !hasSessionToken
    });
  }
  
  // Display results
  serviceResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'PARTIAL' ? '⚠️' : '❌';
    const criticalFlag = result.critical ? ' 🚨 CRITICAL' : '';
    console.log(`${icon} ${result.service}: ${result.status} - ${result.details}${criticalFlag}`);
  });
  
  console.log(`\n⏱️ Total test time: ${totalTime} seconds`);
  
  // Overall assessment
  const criticalFailures = serviceResults.filter(r => r.critical).length;
  const totalServices = serviceResults.length;
  const workingServices = serviceResults.filter(r => r.status === 'PASS').length;
  
  console.log('\n🎯 OVERALL ASSESSMENT');
  console.log('='.repeat(30));
  
  if (criticalFailures === 0) {
    console.log('🎉 ALL CRITICAL SYSTEMS OPERATIONAL!');
    console.log(`✅ ${workingServices}/${totalServices} services fully functional`);
    console.log('💡 Your hackathon project APIs are ready to go!');
  } else if (criticalFailures < totalServices) {
    console.log('⚠️ SOME CRITICAL ISSUES FOUND');
    console.log(`❌ ${criticalFailures} critical failure(s) detected`);
    console.log(`✅ ${workingServices}/${totalServices} services working`);
    console.log('🔧 Check the detailed logs above for specific issues to fix');
  } else {
    console.log('🚨 MULTIPLE CRITICAL FAILURES');
    console.log('❌ Most or all services are experiencing issues');
    console.log('🔧 Review API keys, network connectivity, and service configurations');
  }
  
  // Specific recommendations
  console.log('\n💡 NEXT STEPS & RECOMMENDATIONS');
  console.log('='.repeat(40));
  
  serviceResults.forEach(result => {
    if (result.critical) {
      console.log(`\n🔧 ${result.service} Issues:`);
      
      if (result.service === 'OpenAI') {
        console.log('- Verify OPENAI_API_KEY is valid and has sufficient credits');
        console.log('- Check if the configured model (gpt-4) is accessible');
        console.log('- Ensure network connectivity to OpenAI servers');
      }
      
      if (result.service === 'ElevenLabs') {
        console.log('- Verify ELEVENLABS_API_KEY is valid and active');
        console.log('- Check if voice ID exists in your ElevenLabs account');
        console.log('- Ensure you have sufficient character quota');
      }
      
      if (result.service === 'Anam.ai') {
        console.log('- Verify ANAM_API_KEY is correct and active');
        console.log('- Check if avatar/voice/LLM IDs exist in your account');
        console.log('- Verify API endpoint structure hasn\'t changed');
        console.log('- Consider checking Anam.ai documentation for updates');
      }
    }
  });
  
  if (criticalFailures === 0) {
    console.log('\n🚀 Ready for hackathon development!');
    console.log('📁 Audio test files saved in: tests/audio_output/');
    console.log('📝 Run individual test files for more detailed debugging if needed');
  }
  
  return {
    results: allResults,
    summary: serviceResults,
    criticalFailures,
    totalTime
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests()
    .then(results => {
      console.log('\n✅ Test suite completed');
      process.exit(results.criticalFailures > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveTests };
