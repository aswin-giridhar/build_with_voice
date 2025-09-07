import { v4 as uuidv4 } from 'uuid';
import { ElevenLabsService } from './ElevenLabsService.js';
import { OpenAIChallengerService } from './OpenAIChallengerService.js';
import { MockElevenLabsService } from './MockElevenLabsService.js';
import { ChallengerPersona } from '../persona/ChallengerPersona.js';
import { OutputGenerator } from '../utils/OutputGenerator.js';

export class UnhingedColleagueSession {
  constructor(socket, userContext, mode, companyData, logger) {
    this.sessionId = uuidv4();
    this.socket = socket;
    this.userContext = userContext;
    this.mode = mode;
    this.companyData = companyData;
    this.logger = logger;
    this.startTime = new Date();
    
    this.logger.info(`🆕 UnhingedColleagueSession constructor called: sessionId=${this.sessionId}, mode=${mode}`);
    
    // Conversation state
    this.conversationHistory = [];
    this.currentPhase = 'provocation'; // provocation -> deep_dive -> synthesis -> output
    this.challengeCount = 0;
    
    // Service instances
    this.elevenLabsService = null;
    this.openaiService = null;
    this.anamService = null;
    this.challengerPersona = null;
    this.outputGenerator = null;
  }

  async initialize() {
    try {
      this.logger.info(`🔧 Initializing session ${this.sessionId} in ${this.mode} mode`);
      
      // Initialize services with real APIs first, fallback to mocks
      try {
        this.logger.info('🎙️ Initializing ElevenLabs service...');
        if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'your_elevenlabs_key') {
          this.elevenLabsService = new ElevenLabsService();
          this.logger.info('✅ Real ElevenLabs service initialized');
        } else {
          this.elevenLabsService = new MockElevenLabsService();
          this.logger.info('✅ Mock ElevenLabs service initialized (no API key)');
        }
      } catch (error) {
        this.logger.warn('⚠️ Real ElevenLabs failed, using mock:', error.message);
        this.elevenLabsService = new MockElevenLabsService();
      }
      
      try {
        this.logger.info('🧠 Initializing OpenAI service...');
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key') {
          this.openaiService = new OpenAIChallengerService(this.mode);
          this.logger.info('✅ Real OpenAI service initialized');
        } else {
          throw new Error('OpenAI API key not configured');
        }
      } catch (error) {
        this.logger.error('❌ OpenAI service failed to initialize:', error.message);
        throw new Error(`OpenAI service is required but failed to initialize: ${error.message}`);
      }
      
      // Skip Anam service initialization - it will be handled on the frontend
      this.logger.info('ℹ️ Anam service will be initialized on frontend');
      this.anamService = {
        deliverResponse: async () => ({ success: true }),
        cleanup: async () => ({ success: true })
      };
      
      // Initialize persona with mode-specific configuration
      this.challengerPersona = new ChallengerPersona(this.mode, this.logger);
      
      // Initialize output generator
      this.outputGenerator = new OutputGenerator(this.mode);
      
      // Set up OpenAI service
      await this.openaiService.initializeAgent({
        sessionId: this.sessionId,
        userContext: this.userContext,
        companyData: this.companyData,
        mode: this.mode
      });
      
      this.logger.info(`Session ${this.sessionId} initialized successfully`);
      
    } catch (error) {
      this.logger.error(`Failed to initialize session ${this.sessionId}:`, error);
      throw error;
    }
  }

  async processInput(input, inputType = 'text') {
    try {
      this.logger.info(`Processing ${inputType} input in phase ${this.currentPhase}`);
      
      // Convert voice to text if needed
      let textInput = input;
      if (inputType === 'voice') {
        // Convert base64 to buffer for ElevenLabs STT
        const audioBuffer = Buffer.from(input, 'base64');
        textInput = await this.elevenLabsService.speechToText(audioBuffer);
        this.logger.info(`Transcribed voice input: "${textInput}"`);
      }
      
      // Add to conversation history
      this.conversationHistory.push({
        timestamp: new Date(),
        speaker: 'user',
        content: textInput,
        phase: this.currentPhase
      });
      
      // Process through OpenAI for intelligent challenging
      const openaiResponse = await this.openaiService.processInput(
        textInput,
        this.conversationHistory,
        this.currentPhase
      );
      
      // Update conversation phase if needed
      this.updateConversationPhase(openaiResponse);
      
      // Add challenger response to history
      this.conversationHistory.push({
        timestamp: new Date(),
        speaker: 'challenger',
        content: openaiResponse.response,
        phase: this.currentPhase,
        challengeType: 'openai_challenge'
      });
      
      // Generate voice response with ElevenLabs
      const audioStream = await this.elevenLabsService.generateSpeech(
        openaiResponse.response,
        'challenging'
      );
      
      // Deliver through Anam.ai avatar
      await this.anamService.deliverResponse(
        audioStream,
        'challenging',
        'focused'
      );
      
      // Send response to client
      this.socket.emit('challenger-response', {
        text: openaiResponse.response,
        challengeType: 'openai_challenge',
        phase: this.currentPhase,
        audioStream: audioStream,
        sessionStats: this.getSessionStats(),
        suggestions: openaiResponse.suggestions || [],
        context: openaiResponse.context || {}
      });
      
      this.challengeCount++;
      
    } catch (error) {
      this.logger.error(`Failed to process input in session ${this.sessionId}:`, error);
      throw error;
    }
  }

  updateConversationPhase(challengerResponse) {
    const phaseTransitions = {
      'provocation': 'deep_dive',
      'deep_dive': 'synthesis', 
      'synthesis': 'output'
    };
    
    // Transition based on challenge count and response type
    if (challengerResponse.shouldTransition) {
      const nextPhase = phaseTransitions[this.currentPhase];
      if (nextPhase) {
        this.currentPhase = nextPhase;
        this.logger.info(`Session ${this.sessionId} transitioned to phase: ${this.currentPhase}`);
        
        this.socket.emit('phase-transition', {
          newPhase: this.currentPhase,
          message: this.getPhaseMessage(this.currentPhase)
        });
      }
    }
  }

  getPhaseMessage(phase) {
    const messages = {
      'provocation': 'Let\'s dig into this...',
      'deep_dive': 'Now I\'m really going to challenge you...',
      'synthesis': 'Time to make decisions...',
      'output': 'Let\'s generate your strategy document...'
    };
    return messages[phase] || '';
  }

  async generateStrategyOutput() {
    try {
      this.logger.info(`Generating strategy output for session ${this.sessionId}`);
      
      const output = await this.outputGenerator.generateDocument(
        this.conversationHistory,
        this.mode,
        this.userContext,
        this.companyData
      );
      
      // Send to enterprise integrations if configured
      await this.sendToEnterpriseIntegrations(output);
      
      return {
        sessionId: this.sessionId,
        mode: this.mode,
        output: output,
        conversationSummary: this.getConversationSummary(),
        nextSteps: this.generateNextSteps(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error(`Failed to generate output for session ${this.sessionId}:`, error);
      throw error;
    }
  }

  async sendToEnterpriseIntegrations(output) {
    // Send to Slack if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        // Implementation for Slack webhook
        this.logger.info('Sending output to Slack');
      } catch (error) {
        this.logger.error('Failed to send to Slack:', error);
      }
    }
  }

  getConversationSummary() {
    const userInputs = this.conversationHistory.filter(h => h.speaker === 'user').length;
    const challengerResponses = this.conversationHistory.filter(h => h.speaker === 'challenger').length;
    
    return {
      totalExchanges: Math.min(userInputs, challengerResponses),
      duration: Math.round((new Date() - this.startTime) / 1000 / 60), // minutes
      challengesIssued: this.challengeCount,
      mode: this.mode,
      finalPhase: this.currentPhase
    };
  }

  generateNextSteps() {
    // Generate contextual next steps based on conversation
    const nextSteps = this.challengerPersona.generateNextSteps(
      this.conversationHistory,
      this.mode
    );
    
    return nextSteps;
  }

  getSessionStats() {
    return {
      sessionId: this.sessionId,
      challengeCount: this.challengeCount,
      currentPhase: this.currentPhase,
      duration: Math.round((new Date() - this.startTime) / 1000),
      exchangeCount: Math.floor(this.conversationHistory.length / 2)
    };
  }

  async cleanup() {
    try {
      this.logger.info(`Cleaning up session ${this.sessionId}`);
      
      // Cleanup services
      if (this.anamService) {
        await this.anamService.cleanup();
      }
      
      if (this.openaiService) {
        await this.openaiService.cleanup();
      }
      
      // Log session completion
      const summary = this.getConversationSummary();
      this.logger.info(`Session ${this.sessionId} completed:`, summary);
      
    } catch (error) {
      this.logger.error(`Error during cleanup of session ${this.sessionId}:`, error);
    }
  }
}
