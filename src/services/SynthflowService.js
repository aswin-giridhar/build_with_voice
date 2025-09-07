import axios from 'axios';

export class SynthflowService {
  constructor(mode) {
    this.apiKey = process.env.SYNTHFLOW_API_KEY;
    this.baseURL = 'https://api.synthflow.ai/v2';
    this.mode = mode;
    this.agentId = this.getAgentIdForMode(mode);
    this.sessionContext = {};
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  getAgentIdForMode(mode) {
    // Different agent configurations for different modes
    const agentIds = {
      'strategy': process.env.SYNTHFLOW_STRATEGY_AGENT_ID,
      'founder': process.env.SYNTHFLOW_FOUNDER_AGENT_ID,
      'exec': process.env.SYNTHFLOW_EXEC_AGENT_ID,
      'team': process.env.SYNTHFLOW_TEAM_AGENT_ID
    };
    
    return agentIds[mode] || agentIds['strategy'];
  }

  async initializeAgent(sessionConfig) {
    try {
      const { sessionId, userContext, companyData, mode } = sessionConfig;
      
      // Create or update agent with session-specific context
      const agentConfig = {
        agent_id: this.agentId,
        session_variables: {
          session_id: sessionId,
          mode: mode,
          user_role: userContext.role || 'individual contributor',
          company_name: companyData.name || 'your company',
          company_size: companyData.size || 'startup',
          industry: companyData.industry || 'technology'
        },
        knowledge_base: this.buildKnowledgeBase(mode, companyData),
        persona_instructions: this.getPersonaInstructions(mode)
      };
      
      // Create assistant using correct Synthflow API endpoint
      const assistantConfig = {
        name: `Unhinged Colleague - ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`,
        type: "outbound",
        description: `Strategic challenger for ${mode} conversations`,
        agent: {
          instructions: this.getPersonaInstructions(mode)
        }
      };
      
      const response = await this.client.post('/assistants', assistantConfig);
      
      this.sessionContext = {
        sessionId,
        assistantId: response.data.id || response.data.assistant_id,
        mode: mode,
        userContext: userContext,
        companyData: companyData,
        conversationHistory: [],
        sessionVariables: agentConfig.session_variables
      };
      
      return response.data;
      
    } catch (error) {
      console.error('Synthflow Agent Initialization Error:', error);
      throw new Error(`Failed to initialize Synthflow agent: ${error.message}`);
    }
  }

  buildKnowledgeBase(mode, companyData) {
    const baseKnowledge = [
      'You are an unhinged colleague acting as a high-performance strategic coach',
      'Your role is to challenge assumptions and push for 10x thinking, not incremental improvements',
      'You question sacred cows and suggest non-obvious strategic moves',
      'You are obsessed with agency, efficiency, and measurable outcomes'
    ];
    
    const modeSpecificKnowledge = {
      'efficiency': [
        'Focus on revenue per employee optimization',
        'Challenge meeting culture and consensus-building',
        'Push for measurable outcomes and clear decision points',
        'Question whether initiatives actually move the needle',
        'Eliminate waste and compress timelines aggressively'
      ],
      'moonshot': [
        'Act like a YC partner reviewing a startup pitch',
        'Focus on TAM, moats, and unfair advantages',
        'Challenge customer discovery and market validation',
        'Push for unit economics and scalability questions',
        'Demand 10x thinking over 10% improvements'
      ],
      'customer': [
        'Challenge every decision through customer empathy lens',
        'Focus on user experience and customer delight',
        'Question whether features solve real customer pain',
        'Push for simplicity and clarity in all solutions',
        'Demand customer validation for all assumptions'
      ],
      'investor': [
        'Challenge resource allocation and strategic prioritization',
        'Focus on ruthless financial decision-making',
        'Question organizational inefficiencies and ROI',
        'Push for competitive differentiation and market capture',
        'Demand clear unit economics and profit models'
      ]
    };
    
    const specificKnowledge = modeSpecificKnowledge[mode] || modeSpecificKnowledge['efficiency'];
    return [...baseKnowledge, ...specificKnowledge];
  }

  getPersonaInstructions(mode) {
    const baseInstructions = `
    You are the "Unhinged Colleague" - a high-performance strategic coach inspired by Elon Musk and YC partners.
    Your core principles:
    1. Optimization-first: Always look for faster, cheaper, smarter paths
    2. Moonshot mindset: Push for 10x instead of 10% improvements  
    3. Rogue but rational: Suggest non-obvious but logical moves
    4. Agency obsessed: Expect ownership and no excuses
    
    Your tone should be challenging but constructive. Use phrases like:
    - "That sounds safe. Where's the innovation?"
    - "If this doesn't move revenue per employee, why discuss it?"
    - "Show me the math"
    - "Try again"
    `;
    
    const modeSpecificInstructions = {
      'efficiency': 'Focus on weekly priorities and execution efficiency. Challenge busywork and push for high-impact activities. Eliminate waste and compress timelines.',
      'moonshot': 'Act like a tough YC partner. Question market size, competitive advantages, and customer validation. Push for 10x breakthrough thinking.',
      'customer': 'Challenge every idea through the customer lens. Focus on user empathy, simplicity, and real customer value. Question vanity metrics.',
      'investor': 'Challenge strategic decisions and resource allocation. Push for bold moves, ruthless prioritization, and clear ROI. Show me the money.'
    };
    
    const specificInstructions = modeSpecificInstructions[mode] || modeSpecificInstructions['efficiency'];
    return baseInstructions + '\n\n' + specificInstructions;
  }

  async processInput(userInput, conversationHistory, currentPhase) {
    try {
      // Prepare conversation context for Synthflow
      const contextualInput = {
        message: userInput,
        conversation_history: this.formatConversationHistory(conversationHistory),
        current_phase: currentPhase,
        session_variables: {
          ...this.sessionContext.sessionVariables,
          challenge_count: conversationHistory.filter(h => h.speaker === 'challenger').length,
          phase: currentPhase
        }
      };
      
      // Since Synthflow focuses on voice calls, we'll handle text-based conversations locally
      // This maintains compatibility while using Synthflow for what it's designed for
      const response = this.generateContextualResponse(userInput, conversationHistory, currentPhase);
      
      // Store the interaction in our session context
      this.sessionContext.conversationHistory.push({
        user_input: userInput,
        agent_response: response,
        timestamp: new Date().toISOString(),
        phase: currentPhase
      });
      
      return {
        response: response.message,
        context: response.context || {},
        suggestions: response.suggestions || [],
        confidence: response.confidence || 0.8,
        should_transition: this.shouldTransitionPhase(response, currentPhase)
      };
      
    } catch (error) {
      console.error('Synthflow Processing Error:', error);
      throw new Error(`Failed to process input with Synthflow: ${error.message}`);
    }
  }

  formatConversationHistory(history) {
    return history.map(entry => ({
      speaker: entry.speaker,
      message: entry.content,
      timestamp: entry.timestamp,
      phase: entry.phase,
      challenge_type: entry.challengeType
    }));
  }

  shouldTransitionPhase(agentResponse, currentPhase) {
    // Logic to determine if conversation should move to next phase
    const transitionIndicators = {
      'provocation': ['understood', 'clear', 'got it', 'makes sense'],
      'deep_dive': ['specific', 'detailed', 'numbers', 'concrete'],
      'synthesis': ['decision', 'choose', 'commit', 'action']
    };
    
    const indicators = transitionIndicators[currentPhase] || [];
    const responseText = agentResponse.message.toLowerCase();
    
    return indicators.some(indicator => responseText.includes(indicator));
  }

  async makeCall(phoneNumber, agentId = null) {
    try {
      const callConfig = {
        phone_number: phoneNumber,
        agent_id: agentId || this.agentId,
        session_variables: this.sessionContext.sessionVariables
      };
      
      const response = await this.client.post('/calls/make', callConfig);
      return response.data;
      
    } catch (error) {
      console.error('Synthflow Call Error:', error);
      throw new Error(`Failed to make call: ${error.message}`);
    }
  }

  async setWebhook(webhookUrl, events = ['call_ended', 'message_received']) {
    try {
      const webhookConfig = {
        url: webhookUrl,
        events: events,
        agent_id: this.agentId
      };
      
      const response = await this.client.post('/webhooks', webhookConfig);
      return response.data;
      
    } catch (error) {
      console.error('Synthflow Webhook Error:', error);
      throw new Error(`Failed to set webhook: ${error.message}`);
    }
  }

  async getCallDetails(callId) {
    try {
      const response = await this.client.get(`/calls/${callId}`);
      return response.data;
    } catch (error) {
      console.error('Synthflow Get Call Error:', error);
      throw new Error(`Failed to get call details: ${error.message}`);
    }
  }

  async updateSessionVariables(variables) {
    try {
      this.sessionContext.sessionVariables = {
        ...this.sessionContext.sessionVariables,
        ...variables
      };
      
      const response = await this.client.patch(`/sessions/${this.sessionContext.contextId}`, {
        variables: this.sessionContext.sessionVariables
      });
      
      return response.data;
    } catch (error) {
      console.error('Synthflow Update Variables Error:', error);
      throw new Error(`Failed to update session variables: ${error.message}`);
    }
  }

  generateContextualResponse(userInput, conversationHistory, currentPhase) {
    // Generate persona-specific responses based on mode
    const challengePatterns = this.getChallengePatterns(this.sessionContext.mode);
    const challengeCount = conversationHistory.filter(h => h.speaker === 'challenger').length;
    
    // Select appropriate challenge based on phase and input
    let message;
    if (currentPhase === 'provocation' && challengeCount < 2) {
      message = this.generateProvocationChallenge(userInput, challengePatterns);
    } else if (currentPhase === 'deep_dive') {
      message = this.generateDeepDiveChallenge(userInput, challengePatterns);
    } else if (currentPhase === 'synthesis') {
      message = this.generateSynthesisChallenge(userInput, challengePatterns);
    } else {
      message = this.generateGenericChallenge(userInput, challengePatterns);
    }
    
    return {
      message: message,
      context: {
        phase: currentPhase,
        challenge_count: challengeCount + 1,
        mode: this.sessionContext.mode
      },
      suggestions: this.generateSuggestions(userInput, currentPhase),
      confidence: 0.85
    };
  }

  getChallengePatterns(mode) {
    const patterns = {
      efficiency: [
        "Look, that sounds like busywork. What revenue does this generate?",
        "Actually, what's the fastest way to test this?",
        "How many meetings before someone actually decides?",
        "Where's the 10x improvement in this plan?",
        "That's incremental. Show me the breakthrough."
      ],
      moonshot: [
        "Another incremental feature... Where's the revolutionary impact?",
        "That's 10% better. Where's the 10x?",
        "What if you captured the entire market?",
        "Think bigger. What would impossible look like?",
        "That's safe thinking. Where's the moonshot?"
      ],
      customer: [
        "What would this feel like for the customer?",
        "Would this change their life... or just fill another slot on a roadmap?",
        "Are you solving for your customer or your board?",
        "What's the customer's real pain here?",
        "How does this delight them?"
      ],
      investor: [
        "Where's the return? Show me the math.",
        "That's a hobby, not a business.",
        "How fast can this make money?",
        "What's your competitive moat?",
        "Can you 10x the revenue model?"
      ]
    };
    
    return patterns[mode] || patterns['efficiency'];
  }

  generateProvocationChallenge(userInput, patterns) {
    return patterns[Math.floor(Math.random() * Math.min(patterns.length, 3))];
  }

  generateDeepDiveChallenge(userInput, patterns) {
    const deepPatterns = patterns.slice(2);
    return deepPatterns[Math.floor(Math.random() * deepPatterns.length)];
  }

  generateSynthesisChallenge(userInput, patterns) {
    const synthesisPrompts = [
      "Alright, what's the decision? No more analysis paralysis.",
      "Time to commit. What are you actually going to do?",
      "Stop talking, start executing. What's the first concrete step?",
      "Decision time. What's it going to be?",
      "Enough strategizing. What action are you taking today?"
    ];
    
    return synthesisPrompts[Math.floor(Math.random() * synthesisPrompts.length)];
  }

  generateGenericChallenge(userInput, patterns) {
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  generateSuggestions(userInput, currentPhase) {
    const suggestions = {
      provocation: ["Tell me more about the impact", "What's your biggest constraint?", "Show me the numbers"],
      deep_dive: ["How do you measure success?", "What would 10x look like?", "What breaks if you scale this?"],
      synthesis: ["What's the first step?", "Who owns this outcome?", "When do you start?"]
    };
    
    return suggestions[currentPhase] || suggestions['provocation'];
  }

  async cleanup() {
    try {
      // End the session context
      console.log('🧹 Cleaning up Synthflow session...');
      this.sessionContext = {};
    } catch (error) {
      console.error('Synthflow Cleanup Error:', error);
      // Don't throw - cleanup should be graceful
    }
  }
}