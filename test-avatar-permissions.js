import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const ANAM_API_KEY = process.env.ANAM_API_KEY;

if (!ANAM_API_KEY) {
  console.error('❌ ANAM_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('🔍 Testing Anam.ai API Permissions and Avatar Access');
console.log('=' .repeat(60));

// Test avatar IDs from environment variables
const avatarIds = {
  efficiency: process.env.ANAM_AVATAR_EFFICIENCY,
  moonshot: process.env.ANAM_AVATAR_MOONSHOT,
  customer: process.env.ANAM_AVATAR_CUSTOMER,
  investor: process.env.ANAM_AVATAR_INVESTOR
};

async function checkApiKeyPermissions() {
  console.log('\n📋 Checking API Key Permissions...');
  
  try {
    // Try different permission endpoints
    const endpoints = [
      'https://api.anam.ai/v1/account/permissions',
      'https://api.anam.ai/v1/account/info',
      'https://api.anam.ai/v1/account',
      'https://api.anam.ai/v1/user/permissions'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${ANAM_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('   Response:', JSON.stringify(data, null, 2));
          
          // Check for video streaming permissions
          if (data.video_streaming !== undefined) {
            console.log(data.video_streaming ? '✅ Video streaming: ENABLED' : '❌ Video streaming: DISABLED');
          }
          if (data.permissions && data.permissions.video_streaming !== undefined) {
            console.log(data.permissions.video_streaming ? '✅ Video streaming: ENABLED' : '❌ Video streaming: DISABLED');
          }
          break; // Found working endpoint
        } else {
          const errorText = await response.text();
          console.log(`   Error: ${errorText}`);
        }
      } catch (error) {
        console.log(`   Failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to check API permissions:', error.message);
  }
}

async function checkServiceHealth() {
  console.log('\n🏥 Checking Anam Service Health...');
  
  const healthEndpoints = [
    'https://api.anam.ai/v1/health',
    'https://api.anam.ai/health',
    'https://api.anam.ai/status',
    'https://api.anam.ai/v1/status'
  ];
  
  for (const endpoint of healthEndpoints) {
    try {
      console.log(`🔄 Trying: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${ANAM_API_KEY}`
        },
        timeout: 5000
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   Health Status:', JSON.stringify(data, null, 2));
        break;
      }
    } catch (error) {
      console.log(`   Failed: ${error.message}`);
    }
  }
}

async function testSessionTokenGeneration(persona, avatarId) {
  console.log(`\n🎭 Testing Session Token for ${persona} (${avatarId})`);
  
  try {
    const payload = {
      personaConfig: {
        avatarId: avatarId,
        voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
        llmId: "0934d97d-0c3a-4f33-91b0-5e136a0ef466",
        systemPrompt: `Test prompt for ${persona} persona`
      }
    };
    
    console.log('📤 Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANAM_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Session token generated successfully');
      console.log(`   Token length: ${data.sessionToken?.length || 'N/A'}`);
      console.log(`   Token preview: ${data.sessionToken?.substring(0, 20)}...`);
      
      // Test if we can get avatar info with this token
      await testAvatarAccess(data.sessionToken, avatarId);
      
      return { success: true, token: data.sessionToken };
    } else {
      const errorText = await response.text();
      console.log('❌ Session token generation failed');
      console.log(`   Error: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log('❌ Session token generation failed');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAvatarAccess(sessionToken, avatarId) {
  console.log(`🎥 Testing Avatar Access for ${avatarId}`);
  
  // Try different avatar-related endpoints
  const avatarEndpoints = [
    `https://api.anam.ai/v1/avatars/${avatarId}`,
    `https://api.anam.ai/v1/avatar/${avatarId}`,
    `https://api.anam.ai/v1/avatars/${avatarId}/stream`,
    `https://api.anam.ai/v1/stream/${avatarId}`
  ];
  
  for (const endpoint of avatarEndpoints) {
    try {
      console.log(`🔄 Trying: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Avatar accessible');
        console.log('   Avatar info:', JSON.stringify(data, null, 2));
        return true;
      } else if (response.status === 404) {
        console.log('❌ Avatar not found');
      } else if (response.status === 403) {
        console.log('❌ Avatar access forbidden');
      } else {
        const errorText = await response.text();
        console.log(`❌ Avatar access failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`   Failed: ${error.message}`);
    }
  }
  
  return false;
}

async function testVideoStreamingCapability(sessionToken, avatarId) {
  console.log(`📹 Testing Video Streaming Capability for ${avatarId}`);
  
  // Try different streaming endpoints
  const streamEndpoints = [
    `https://api.anam.ai/v1/stream/video/${avatarId}`,
    `https://api.anam.ai/v1/avatars/${avatarId}/video`,
    `https://api.anam.ai/v1/video/stream`,
    `https://stream.anam.ai/v1/${avatarId}`
  ];
  
  for (const endpoint of streamEndpoints) {
    try {
      console.log(`🔄 Trying: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatarId }),
        timeout: 15000
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ Video streaming endpoint accessible');
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        return true;
      } else if (response.status === 500) {
        console.log('❌ Server error - service may be unavailable');
      } else if (response.status === 403) {
        console.log('❌ Video streaming forbidden - check permissions');
      } else {
        const errorText = await response.text();
        console.log(`❌ Video streaming failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`   Failed: ${error.message}`);
    }
  }
  
  return false;
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Avatar Testing...');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🔑 API Key: ${ANAM_API_KEY.substring(0, 20)}...`);
  
  // Step 1: Check API permissions
  await checkApiKeyPermissions();
  
  // Step 2: Check service health
  await checkServiceHealth();
  
  // Step 3: Test each avatar
  const results = {};
  
  for (const [persona, avatarId] of Object.entries(avatarIds)) {
    if (!avatarId) {
      console.log(`\n⚠️ Skipping ${persona}: No avatar ID configured`);
      continue;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎭 TESTING PERSONA: ${persona.toUpperCase()}`);
    console.log('='.repeat(60));
    
    // Test session token generation
    const tokenResult = await testSessionTokenGeneration(persona, avatarId);
    results[persona] = { ...tokenResult, avatarId };
    
    if (tokenResult.success) {
      // Test avatar access
      const avatarAccessible = await testAvatarAccess(tokenResult.token, avatarId);
      results[persona].avatarAccessible = avatarAccessible;
      
      // Test video streaming
      const videoStreamingWorks = await testVideoStreamingCapability(tokenResult.token, avatarId);
      results[persona].videoStreamingWorks = videoStreamingWorks;
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Step 4: Summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  
  for (const [persona, result] of Object.entries(results)) {
    console.log(`\n🎭 ${persona.toUpperCase()}`);
    console.log(`   Avatar ID: ${result.avatarId}`);
    console.log(`   Session Token: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Avatar Access: ${result.avatarAccessible ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Video Streaming: ${result.videoStreamingWorks ? '✅ Success' : '❌ Failed'}`);
    
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Step 5: Recommendations
  console.log('\n📋 RECOMMENDATIONS');
  console.log('='.repeat(30));
  
  const workingAvatars = Object.entries(results).filter(([_, result]) => result.videoStreamingWorks);
  const failingAvatars = Object.entries(results).filter(([_, result]) => !result.videoStreamingWorks);
  
  if (workingAvatars.length > 0) {
    console.log('✅ Working avatars found:');
    workingAvatars.forEach(([persona, result]) => {
      console.log(`   - ${persona}: ${result.avatarId}`);
    });
  }
  
  if (failingAvatars.length > 0) {
    console.log('❌ Failing avatars:');
    failingAvatars.forEach(([persona, result]) => {
      console.log(`   - ${persona}: ${result.avatarId}`);
    });
    
    console.log('\n🔧 Next steps for failing avatars:');
    console.log('   1. Try alternative avatar IDs from .env comments');
    console.log('   2. Contact Anam.ai support for video streaming permissions');
    console.log('   3. Test during different hours (service availability)');
    console.log('   4. Try different SDK versions');
  }
  
  if (workingAvatars.length === 0) {
    console.log('\n⚠️ No avatars working for video streaming');
    console.log('🔧 Immediate actions:');
    console.log('   1. Check API key video streaming permissions');
    console.log('   2. Contact Anam.ai support');
    console.log('   3. Try alternative avatar IDs');
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
