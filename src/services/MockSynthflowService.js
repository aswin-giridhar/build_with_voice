export class MockSynthflowService {
  constructor(mode = 'strategy') {
    this.mode = mode;
    this.apiKey = process.env.SYNTHFLOW_API_KEY;
    this.baseURL = 'https://api.synthflow.ai/v2';
    this.webhookUrl = process.env.SYNTHFLOW_WEBHOOK_URL;
    
    this.conversationState = {
      sessionId: null,
      messageCount: 0,
      currentPhase: 'provocation',
      context: {}
    };
    
    console.log(`✅ Mock Synthflow service initialized for ${mode} mode`);
  }

  async initializeAgent(sessionData) {
    console.log('🤖 Mock Synthflow: Initializing conversation agent...');
    console.log('📋 Session data:', {
      sessionId: sessionData.sessionId,
      mode: sessionData.mode,
      user: sessionData.userContext?.name,
      company: sessionData.companyData?.name
    });
    
    this.conversationState = {
      sessionId: sessionData.sessionId,
      messageCount: 0,
      currentPhase: 'provocation',
      context: {
        userRole: sessionData.userContext?.role || 'leader',
        companyName: sessionData.companyData?.name || 'Company',
        companySize: sessionData.companyData?.size || 'startup',
        industry: sessionData.companyData?.industry || 'technology',
        mode: sessionData.mode
      }
    };
    
    // Mock successful agent configuration
    const mockResponse = {
      agent_id: `mock-agent-${Date.now()}`,
      session_id: sessionData.sessionId,
      status: 'configured',
      persona: 'unhinged_colleague',
      mode: this.mode,
      capabilities: ['conversation_memory', 'context_tracking', 'phase_management']
    };
    
    console.log('✅ Mock Synthflow: Agent configured successfully');
    return mockResponse;
  }

  async processInput(userInput, conversationHistory = [], currentPhase = 'provocation') {
    console.log(`💬 Mock Synthflow: Processing input in ${currentPhase} phase`);
    console.log(`📝 User input: "${userInput}"`);
    
    this.conversationState.messageCount++;
    this.conversationState.currentPhase = currentPhase;
    
    // Generate mock strategic context and memory
    const contextualResponse = this.generateContextualResponse(userInput, currentPhase);
    
    // Determine if we should transition phases
    const shouldTransition = this.shouldTransitionPhase(conversationHistory, currentPhase);
    
    const response = {
      processed_input: userInput,
      context_enriched: contextualResponse.enrichedContext,
      memory_updated: true,
      suggested_response: contextualResponse.suggestedResponse,
      should_transition: shouldTransition,
      next_phase: shouldTransition ? this.getNextPhase(currentPhase) : currentPhase,
      conversation_state: {
        message_count: this.conversationState.messageCount,
        engagement_level: this.calculateEngagementLevel(conversationHistory),
        strategic_depth: contextualResponse.strategicDepth
      }
    };
    
    console.log('🧠 Mock Synthflow: Context and memory processed');
    console.log('🔄 Phase transition?', shouldTransition ? 'Yes' : 'No');
    
    return response;
  }

  generateContextualResponse(userInput, phase) {
    const responses = {
      provocation: {
        enrichedContext: `User discussing ${this.extractBusinessTopic(userInput)} - needs provocative challenge`,
        suggestedResponse: `That sounds safe. Where's the 10x opportunity hiding in what you just said?`,
        strategicDepth: 'surface_level'
      },
      deep_dive: {
        enrichedContext: `Deeper exploration of ${this.extractBusinessTopic(userInput)} - push for specifics`,
        suggestedResponse: `Show me the math on that. What are the actual numbers?`,
        strategicDepth: 'analytical'
      },
      synthesis: {
        enrichedContext: `Decision-making phase for ${this.extractBusinessTopic(userInput)} - force choices`,
        suggestedResponse: `Enough analysis. What are you actually going to do about this?`,
        strategicDepth: 'decision_focused'
      },
      output: {
        enrichedContext: `Finalizing strategic direction on ${this.extractBusinessTopic(userInput)}`,
        suggestedResponse: `Let's document your decision and the next concrete steps.`,
        strategicDepth: 'execution_ready'
      }
    };
    
    return responses[phase] || responses.provocation;
  }

  extractBusinessTopic(input) {
    // Mock topic extraction
    if (input.toLowerCase().includes('revenue')) return 'revenue strategy';
    if (input.toLowerCase().includes('market')) return 'market expansion';
    if (input.toLowerCase().includes('team')) return 'team optimization';
    if (input.toLowerCase().includes('customer')) return 'customer strategy';
    if (input.toLowerCase().includes('product')) return 'product strategy';
    return 'business strategy';
  }

  shouldTransitionPhase(conversationHistory, currentPhase) {
    // Mock phase transition logic
    const messageCount = conversationHistory.filter(h => h.speaker === 'user').length;
    
    switch (currentPhase) {
      case 'provocation':
        return messageCount >= 2;
      case 'deep_dive':
        return messageCount >= 4;
      case 'synthesis':
        return messageCount >= 6;
      default:
        return false;
    }
  }

  getNextPhase(currentPhase) {
    const phases = {
      'provocation': 'deep_dive',
      'deep_dive': 'synthesis',
      'synthesis': 'output'
    };
    return phases[currentPhase] || 'output';
  }

  calculateEngagementLevel(conversationHistory) {
    // Mock engagement calculation
    const userMessages = conversationHistory.filter(h => h.speaker === 'user').length;
    if (userMessages >= 6) return 'high';
    if (userMessages >= 3) return 'medium';
    return 'low';
  }

  async updateConversationMemory(newMemory) {
    console.log('💾 Mock Synthflow: Updating conversation memory');
    this.conversationState.context = { ...this.conversationState.context, ...newMemory };
    return { success: true, memory_updated: true };
  }

  async getConversationSummary() {
    console.log('📊 Mock Synthflow: Generating conversation summary');
    
    return {
      session_id: this.conversationState.sessionId,
      total_exchanges: this.conversationState.messageCount,
      current_phase: this.conversationState.currentPhase,
      key_topics: ['strategic thinking', 'optimization', 'decision making'],
      engagement_score: 85,
      strategic_insights_generated: 3,
      decisions_pushed: 2
    };
  }

  async cleanup() {
    console.log('🧹 Mock Synthflow: Cleaning up conversation state');
    this.conversationState = {
      sessionId: null,
      messageCount: 0,
      currentPhase: 'provocation',
      context: {}
    };
    
    return { success: true };
  }

  // Utility methods
  getAgentCapabilities() {
    return [
      'conversation_memory',
      'context_tracking',
      'phase_management',
      'strategic_analysis',
      'decision_forcing'
    ];
  }

  getCurrentState() {
    return {
      ...this.conversationState,
      mode: this.mode,
      capabilities: this.getAgentCapabilities()
    };
  }
}