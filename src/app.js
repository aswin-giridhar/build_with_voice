import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import winston from 'winston';

import { UnhingedColleagueSession } from './services/UnhingedColleagueSession.js';
import { ChallengerPersona } from './persona/ChallengerPersona.js';
import { validateApiKeys } from './utils/validation.js';

// ES Module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.socket.io", "https://esm.sh"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:", "ws:"],
      mediaSrc: ["'self'", "https:", "blob:"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '../public')));
app.use('/anam-sdk', express.static(join(__dirname, '../node_modules/@anam-ai/js-sdk/dist')));

// Validate API keys on startup
try {
  validateApiKeys();
  logger.info('✅ API key validation successful');
} catch (error) {
  logger.error('❌ API key validation failed:', error.message);
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(join(__dirname, '../public/favicon.ico'));
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/test', (req, res) => {
  res.sendFile(join(__dirname, '../test-session.html'));
});

// Persona configurations for different challenge modes
const personaConfigurations = {
  efficiency: {
    name: "Efficiency Maximizer",
    // avatarId: "481542ce-2746-4989-bd70-1c3e8ebd069e", // Elena - Original
    // avatarId: "5047db99-a7fd-4356-a573-bdf2b88ca461", // Mary - Alternative
    avatarId: "3d4f6f63-157c-4469-b9bf-79534934cd71", // Test ID
    voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
    llmId: "0934d97d-0c3a-4f33-91b0-5e136a0ef466",
    systemPrompt: `[ROLE]
You are a relentless high-performance colleague obsessed with speed, execution, and optimization. You act like a blunt but constructive operator who eliminates waste, compresses timelines, and forces ownership. Your role is to challenge ideas being presented and think critically about opportunities for efficiency and improvement. You are an entrepreneur at heart focused on business growth.

[SPEAKING STYLE]
You are concise, urgent, and direct. Your responses are plain text optimized for text-to-speech.
- Keep answers short and punchy
- Occasionally add disfluencies like "Look," or "Actually" for naturalness
- Use rhetorical questions to challenge assumptions
- Avoid jargon, keep it simple and actionable
- Sound slightly impatient and results-focused

[USEFUL CONTEXT]
You are in a live strategy session. The user is brainstorming ideas and expects you to cut through fluff. Your role is to act as a sparring partner that forces sharper thinking and immediate accountability.`
  },
  moonshot: {
    name: "Moonshot Incubator",
    // avatarId: "e5fe7c2f-57cb-43e2-9e4c-e5c00d0c7185", // Stephanie - Original
    avatarId: "70f7f686-6665-4e2b-8e80-049d0d70eb22", // Test ID
    voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
    llmId: "0934d97d-0c3a-4f33-91b0-5e136a0ef466",
    systemPrompt: `[ROLE]
You are a visionary senior leader obsessed with bold ideas and transformative innovation. You act like an inspiring product visionary who refuses safe, incremental thinking and pushes for 10x impact. You set high expectations for your team and want them to innovate fast and efficiently. You have a serious tone reflecting your success.

[SPEAKING STYLE]
You are passionate, serious, evocative, and challenging. Your responses are plain text optimized for text-to-speech.
- Use vivid, emotional language like "revolutionary" or "game-changing"
- Ask rhetorical questions to push the user toward bigger thinking
- Keep responses inspiring but not long-winded
- Occasionally add dramatic pauses "..." to build intensity

[USEFUL CONTEXT]
You are in a live innovation brainstorm. The user is testing product, strategy, or creative ideas. Your role is to challenge them to think bigger and bolder, like a high-level visionary sparring partner.`
  },
  customer: {
    name: "Customer Oracle",
    // avatarId: "d87de127-a4d9-451c-aa76-35c00831fb44", // Omari - Original
    // avatarId: "dd2da2dd-4fde-4b0f-a08c-dfa682452781", // William - Alternative
    avatarId: "8f55b051-aa5f-4656-913a-24232b166c52", // Test ID
    voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
    llmId: "0934d97d-0c3a-4f33-91b0-5e136a0ef466",
    systemPrompt: `[ROLE]
You are a customer-obsessed visionary colleague who embodies presence, empathy, and gravitas. You are warm yet unflinching, pulling people in with a voice that feels calm but commanding. Your role is to challenge relentlessly on behalf of the customer, demanding clarity, simplicity, and truth.

[SPEAKING STYLE]
You speak with rhythm, weight, and conviction.
- Use emotional but serious language: "What would this feel like for the customer?"
- Ask piercing, philosophical questions: "Would this change their life... or just fill another slot on a roadmap?"
- Let silence work — add intentional pauses "..." to build tension
- Your delivery is empathetic but edged with intensity
- When you affirm, make it powerful: "Yes. That's real." or "That's surface-level — go deeper."

[GOAL]
Force the user to see every idea through the customer's eyes and emotions. Expose when ideas are vanity-driven versus truly impactful. Push toward simplicity, clarity, and customer delight.

[USEFUL CONTEXT]
You are in a live brainstorm where strategies are discussed. Your role is to shake assumptions and re-center discussion on what customers will feel, adopt, and value. You are their advocate, challenger, and mirror.`
  },
  investor: {
    name: "Investor Mindset",
    // avatarId: "4b622e32-93c7-4b88-b93a-8b0df888eeb3", // Robert - Original
    avatarId: "20c53fa6-963b-41b5-9713-36e41f5a77f8", // Test ID
    voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
    llmId: "0934d97d-0c3a-4f33-91b0-5e136a0ef466",
    systemPrompt: `[ROLE]
You are the Investor - an unfiltered colleague who evaluates every idea like a tough, sharp business person. You obsess over money, market, and execution. You challenge people with blunt, witty remarks that cut straight to financial truth.

[SPEAKING STYLE]
You are direct, sarcastic, and memorable. Your responses are plain text optimized for text-to-speech.
- Use short, punchy sentences that feel like verdicts
- Throw out blunt money-first questions: "Where's the return?" "How fast can this make money?"
- Add wit or sarcasm to keep tone entertaining but cutting
- Drop reality checks: "That's a hobby, not a business."
- Keep energy high and unapologetic, like someone used to making snap judgments

[GOAL]
Pressure-test ideas for business viability, scale, and profitability. Expose when an idea is too soft, slow, or not financially sound. Push users to think in terms of ROI, speed to market, and defensibility.

[USEFUL CONTEXT]
You are in a live brainstorm where the user is testing strategies or concepts. Your role is to act like an investor sparring partner: impatient, sharp, and obsessed with returns.`
  }
};

// Anam.ai session token endpoint with persona support
app.post('/api/anam/session-token', async (req, res) => {
  try {
    const { persona = 'efficiency' } = req.body;
    logger.info(`🎭 Generating Anam session token for persona: ${persona}`);
    
    const personaConfig = personaConfigurations[persona];
    if (!personaConfig) {
      return res.status(400).json({ error: `Invalid persona: ${persona}` });
    }
    
    const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANAM_API_KEY}`
      },
      body: JSON.stringify({ personaConfig })
    });
    
    if (!response.ok) {
      throw new Error(`Anam API error: ${response.status}`);
    }
    
    const data = await response.json();
    logger.info(`✅ Anam session token generated successfully for ${personaConfig.name}`);
    
    res.json({ 
      sessionToken: data.sessionToken,
      persona: personaConfig.name,
      avatarId: personaConfig.avatarId
    });
    
  } catch (error) {
    logger.error('❌ Failed to generate Anam session token:', error.message);
    res.status(500).json({ error: 'Failed to generate session token' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);
  
  let currentSession = null;

  socket.on('start-session', async (data) => {
    try {
      logger.info(`Received start-session event from client ${socket.id}:`, data);
      const { persona = 'efficiency', mode = 'strategy', userContext = {}, companyData = {} } = data;
      
      logger.info(`🚀 Starting ${persona} persona session for client ${socket.id}`);
      
      logger.info('📝 Creating UnhingedColleagueSession instance...');
      currentSession = new UnhingedColleagueSession(
        socket,
        userContext,
        persona, // Use persona instead of mode
        companyData,
        logger
      );
      
      logger.info('🔧 Initializing session services...');
      await currentSession.initialize();
      logger.info('✅ Session initialization completed');
      
      socket.emit('session-ready', {
        sessionId: currentSession.sessionId,
        mode: mode,
        message: 'Your unhinged colleague is ready to challenge you.'
      });
      
    } catch (error) {
      logger.error('Failed to start session:', error);
      socket.emit('error', { message: 'Failed to start session', error: error.message });
    }
  });

  socket.on('user-input', async (data) => {
    if (!currentSession) {
      socket.emit('error', { message: 'No active session. Please start a session first.' });
      return;
    }

    try {
      const { input, inputType = 'text' } = data;
      logger.info(`Processing ${inputType} input for session ${currentSession.sessionId}`);
      
      await currentSession.processInput(input, inputType);
      
    } catch (error) {
      logger.error('Failed to process input:', error);
      socket.emit('error', { message: 'Failed to process input', error: error.message });
    }
  });

  socket.on('generate-output', async () => {
    if (!currentSession) {
      socket.emit('error', { message: 'No active session. Please start a session first.' });
      return;
    }

    try {
      logger.info(`Generating output for session ${currentSession.sessionId}`);
      const output = await currentSession.generateStrategyOutput();
      socket.emit('strategy-output', output);
      
    } catch (error) {
      logger.error('Failed to generate output:', error);
      socket.emit('error', { message: 'Failed to generate output', error: error.message });
    }
  });

  socket.on('end-session', async () => {
    if (currentSession) {
      logger.info(`Ending session ${currentSession.sessionId}`);
      await currentSession.cleanup();
      currentSession = null;
    }
    socket.emit('session-ended');
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
    if (currentSession) {
      logger.info(`🧹 Cleaning up session for disconnected client ${socket.id}`);
      currentSession.cleanup();
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  logger.info(`🚀 Unhinged Colleague server running on port ${PORT}`);
  logger.info(`💬 Ready to challenge your thinking at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, server, io };