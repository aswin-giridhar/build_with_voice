import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = 8081;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from tests directory
app.use(express.static(__dirname));

// Proxy endpoint for Anam.ai session token generation
app.post('/api/anam/session-token', async (req, res) => {
  try {
    console.log('🔄 Proxy: Generating session token for persona:', req.body.persona);
    
    const { persona } = req.body;
    
    // Get persona configuration from environment variables
    const personaConfigs = {
      efficiency: {
        name: 'Efficiency Maximizer',
        avatarId: process.env.ANAM_EFFICIENCY_AVATAR_ID,
        voiceId: process.env.ANAM_EFFICIENCY_VOICE_ID,
        llmId: process.env.ANAM_EFFICIENCY_LLM_ID
      },
      moonshot: {
        name: 'Moonshot Incubator',
        avatarId: process.env.ANAM_MOONSHOT_AVATAR_ID,
        voiceId: process.env.ANAM_MOONSHOT_VOICE_ID,
        llmId: process.env.ANAM_MOONSHOT_LLM_ID
      },
      customer: {
        name: 'Customer Oracle',
        avatarId: process.env.ANAM_CUSTOMER_AVATAR_ID,
        voiceId: process.env.ANAM_CUSTOMER_VOICE_ID,
        llmId: process.env.ANAM_CUSTOMER_LLM_ID
      },
      investor: {
        name: 'Investor Mindset',
        avatarId: process.env.ANAM_INVESTOR_AVATAR_ID,
        voiceId: process.env.ANAM_INVESTOR_VOICE_ID,
        llmId: process.env.ANAM_INVESTOR_LLM_ID
      }
    };
    
    const personaConfig = personaConfigs[persona];
    if (!personaConfig) {
      return res.status(400).json({ error: 'Invalid persona specified' });
    }
    
    // Make request to Anam.ai API
    const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personaConfig: {
          name: personaConfig.name,
          avatarId: personaConfig.avatarId,
          voiceId: personaConfig.voiceId,
          llmId: personaConfig.llmId,
          systemPrompt: `You are a ${personaConfig.name} - a strategic challenger focused on high-performance thinking.`
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Anam API Error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `Anam API Error: ${response.status}`,
        details: errorData
      });
    }
    
    const data = await response.json();
    console.log('✅ Session token generated successfully for', persona);
    
    res.json({
      sessionToken: data.sessionToken,
      persona: personaConfig.name
    });
    
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKey: process.env.ANAM_API_KEY ? 'configured' : 'missing'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Local proxy server running on http://localhost:${PORT}`);
  console.log(`📋 API Key status: ${process.env.ANAM_API_KEY ? 'configured' : 'missing'}`);
  console.log(`🎭 Persona validation page: http://localhost:${PORT}/persona-validation.html`);
});
