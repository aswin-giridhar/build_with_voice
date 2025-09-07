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
      
      const response = await this.client.post('/agents/configure', agentConfig);
      
      this.sessionContext = {
        sessionId,
        agentId: this.agentId,
        contextId: response.data.context_id,
        conversationHistory: []
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
      'strategy': [
        'Focus on revenue per employee optimization',
        'Challenge meeting culture and consensus-building',
        'Push for measurable outcomes and clear decision points',
        'Question whether initiatives actually move the needle'
      ],
      'founder': [
        'Act like a YC partner reviewing a startup pitch',
        'Focus on TAM, moats, and unfair advantages',
        'Challenge customer discovery and market validation',
        'Push for unit economics and scalability questions'
      ],
      'exec': [
        'Challenge resource allocation and strategic prioritization',
        'Focus on ruthless decision-making and bold moves',
        'Question organizational inefficiencies',
        'Push for competitive differentiation'
      ],
      'team': [
        'Focus on eliminating meetings and politics',
        'Challenge consensus-seeking and decision paralysis',
        'Push for clear accountability and ownership',
        'Question processes that slow down execution'
      ]
    };
    
    return [...baseKnowledge, ...modeSpecificKnowledge[mode]];
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
      'strategy': 'Focus on weekly priorities and execution efficiency. Challenge busywork and push for high-impact activities.',
      'founder': 'Act like a tough YC partner. Question market size, competitive advantages, and customer validation.',
      'exec': 'Challenge strategic decisions and resource allocation. Push for bold moves and ruthless prioritization.',
      'team': 'Focus on eliminating inefficiencies, meetings, and consensus-seeking that slows down execution.'
    };
    
    return baseInstructions + '\n\n' + modeSpecificInstructions[mode];
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
      
      const response = await this.client.post(`/agents/${this.agentId}/chat`, {
        ...contextualInput,
        context_id: this.sessionContext.contextId
      });
      
      // Store the interaction in our session context
      this.sessionContext.conversationHistory.push({
        user_input: userInput,
        agent_response: response.data,
        timestamp: new Date().toISOString(),
        phase: currentPhase
      });
      
      return {
        response: response.data.message,
        context: response.data.context,
        suggestions: response.data.suggestions || [],
        confidence: response.data.confidence || 0.8,
        should_transition: this.shouldTransitionPhase(response.data, currentPhase)
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

  async cleanup() {
    try {
      // End the session context
      if (this.sessionContext.contextId) {
        await this.client.delete(`/sessions/${this.sessionContext.contextId}`);
      }
    } catch (error) {
      console.error('Synthflow Cleanup Error:', error);
      // Don't throw - cleanup should be graceful
    }
  }
}