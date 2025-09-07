import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testAnamAPI() {
    console.log('🧪 Testing Anam.ai API Configuration...');
    
    const apiKey = process.env.ANAM_API_KEY;
    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT SET');
    
    if (!apiKey) {
        console.error('❌ ANAM_API_KEY not found in environment variables');
        return;
    }
    
    // Test different avatar IDs to see which ones work
    const testAvatarIds = [
        '3d4f6f63-157c-4469-b9bf-79534934cd71', // Current test ID
        '481542ce-2746-4989-bd70-1c3e8ebd069e', // Original Elena
        '5047db99-a7fd-4356-a573-bdf2b88ca461', // Alternative Mary
        'default-avatar-id' // Fallback
    ];
    
    for (const avatarId of testAvatarIds) {
        console.log(`\n🎭 Testing Avatar ID: ${avatarId}`);
        
        const payload = {
            personaConfig: {
                avatarId: avatarId,
                voiceId: '6bfbe25a-979d-40f3-a92b-5394170af54b',
                llmId: '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
                systemPrompt: 'You are a helpful assistant.'
            }
        };
        
        try {
            const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });
            
            console.log(`📊 Response Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ SUCCESS! Session token generated');
                console.log('🔍 Token length:', data.sessionToken?.length);
                break; // Found working avatar ID
            } else {
                const errorText = await response.text();
                console.log('❌ Error Response:', errorText);
            }
            
        } catch (error) {
            console.error('❌ Request failed:', error.message);
        }
    }
    
    // Test API key validity with a simple endpoint
    console.log('\n🔍 Testing API key validity...');
    try {
        const response = await fetch('https://api.anam.ai/v1/avatars', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        console.log(`📊 Avatars endpoint status: ${response.status}`);
        
        if (response.ok) {
            const avatars = await response.json();
            console.log('✅ API key is valid');
            console.log('🎭 Available avatars:', avatars.length || 'Unknown count');
            
            if (avatars.length > 0) {
                console.log('📋 First few avatars:');
                avatars.slice(0, 3).forEach(avatar => {
                    console.log(`   - ${avatar.name || 'Unnamed'} (ID: ${avatar.id})`);
                });
            }
        } else {
            const errorText = await response.text();
            console.log('❌ API key validation failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ API key test failed:', error.message);
    }
}

testAnamAPI().catch(console.error);
