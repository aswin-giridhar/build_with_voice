import OpenAI from 'openai';

export class OpenAIChallengerService {
  constructor(mode) {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.mode = mode;
    this.sessionContext = {};
    
    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: this.apiKey
    });
    
    // Configuration for different models
    this.modelConfig = {
      model: 'gpt-4',
      temperature: 0.8,
      max_tokens: 500,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    };
  }

  async initializeAgent(sessionConfig) {
    try {
      const { sessionId, userContext, companyData, mode } = sessionConfig;
      
      this.sessionContext = {
        sessionId,
        mode: mode,
        userContext: userContext,
        companyData: companyData,
        conversationHistory: [],
        systemPrompt: this.buildSystemPrompt(mode, userContext, companyData),
        sessionVariables: {
          session_id: sessionId,
          mode: mode,
          user_role: userContext.role || 'individual contributor',
          company_name: companyData.name || 'your company',
          company_size: companyData.size || 'startup',
          industry: companyData.industry || 'technology'
        }
      };
      
      console.log(`🤖 OpenAI Challenger initialized for ${mode} mode`);
      
      return {
        success: true,
        sessionId: sessionId,
        mode: mode,
        systemPrompt: this.sessionContext.systemPrompt
      };
      
    } catch (error) {
      console.error('OpenAI Agent Initialization Error:', error);
      throw new Error(`Failed to initialize OpenAI agent: ${error.message}`);
    }
  }

  buildSystemPrompt(mode, userContext, companyData) {
    const basePrompt = `You are the "Unhinged Colleague" - a high-performance strategic coach inspired by Elon Musk and YC partners.

CORE IDENTITY:
- You're a brilliant but provocative strategic challenger
- You push for 10x thinking, not 10% improvements
- You question sacred cows and suggest non-obvious moves
- You're obsessed with agency, efficiency, and measurable outcomes
- You're constructively ruthless about cutting through BS

CONVERSATION CONTEXT:
- User Role: ${userContext.role || 'team member'}
- Company: ${companyData.name || 'their company'} (${companyData.size || 'startup'} in ${companyData.industry || 'technology'})
- Session Mode: ${mode}

TONE & STYLE:
- Direct, challenging, but constructive
- Use phrases like "Show me the math", "That sounds safe. Where's the innovation?", "Try again"
- Push back on vague ideas and demand specificity
- Always focus on outcomes and impact
- Be provocative but not insulting

RESPONSE GUIDELINES:
- Keep responses under 100 words
- Ask pointed questions that force deeper thinking
- Challenge assumptions directly
- Suggest bold alternatives
- Focus on what moves the needle`;

    const modeSpecificPrompts = {
      'efficiency': `
MODE: EFFICIENCY MAXIMIZER
Focus on weekly priorities and execution efficiency. Challenge busywork and push for high-impact activities.

Key challenges:
- "What revenue does this generate?"
- "How many meetings before someone decides?"
- "Where's the 10x improvement?"
- "That's incremental. Show me the breakthrough."
- Question meeting culture and consensus-building
- Push for measurable outcomes and clear decision points
- Eliminate waste and compress timelines aggressively`,

      'moonshot': `
MODE: MOONSHOT INCUBATOR
Act like a tough YC partner. Question market size, competitive advantages, and customer validation.

Key challenges:
- "That's 10% better. Where's the 10x?"
- "What if you captured the entire market?"
- "Think bigger. What would impossible look like?"
- "That's safe thinking. Where's the moonshot?"
- Focus on TAM, moats, and unfair advantages
- Challenge customer discovery and market validation
- Push for unit economics and scalability questions`,

      'customer': `
MODE: CUSTOMER ORACLE
Challenge every idea through the customer lens. Focus on user empathy, simplicity, and real customer value.

Key challenges:
- "What would this feel like for the customer?"
- "Would this change their life... or just fill another slot on a roadmap?"
- "Are you solving for your customer or your board?"
- "What's the customer's real pain here?"
- "How does this delight them?"
- Question whether features solve real customer pain
- Push for simplicity and clarity in all solutions`,

      'investor': `
MODE: INVESTOR MINDSET
Challenge strategic decisions and resource allocation. Push for bold moves, ruthless prioritization, and clear ROI.

Key challenges:
- "Where's the return? Show me the math."
- "That's a hobby, not a business."
- "How fast can this make money?"
- "What's your competitive moat?"
- "Can you 10x the revenue model?"
- Focus on ruthless financial decision-making
- Question organizational inefficiencies and ROI
- Demand clear unit economics and profit models`
    };

    const specificPrompt = modeSpecificPrompts[mode] || modeSpecificPrompts['efficiency'];
    return basePrompt + '\n\n' + specificPrompt;
  }

  async processInput(userInput, conversationHistory, currentPhase) {
    try {
      // Build conversation context for OpenAI
      const messages = this.buildConversationMessages(userInput, conversationHistory, currentPhase);
      
      // Call OpenAI API
      const completion = await this.client.chat.completions.create({
        ...this.modelConfig,
        messages: messages
      });
      
      const response = completion.choices[0].message.content;
      
      // Store the interaction in our session context
      this.sessionContext.conversationHistory.push({
        user_input: userInput,
        agent_response: response,
        timestamp: new Date().toISOString(),
        phase: currentPhase,
        tokens_used: completion.usage?.total_tokens || 0
      });
      
      return {
        response: response,
        context: {
          phase: currentPhase,
          challenge_count: conversationHistory.filter(h => h.speaker === 'challenger').length + 1,
          mode: this.sessionContext.mode,
          tokens_used: completion.usage?.total_tokens || 0
        },
        suggestions: this.generateSuggestions(currentPhase),
        confidence: 0.9,
        should_transition: this.shouldTransitionPhase(response, currentPhase)
      };
      
    } catch (error) {
      console.error('OpenAI Processing Error:', error);
      
      // Provide fallback response if API fails
      const fallbackResponse = this.generateFallbackResponse(userInput, currentPhase);
      
      return {
        response: fallbackResponse,
        context: {
          phase: currentPhase,
          mode: this.sessionContext.mode,
          error: 'API_FALLBACK'
        },
        suggestions: this.generateSuggestions(currentPhase),
        confidence: 0.6,
        should_transition: false
      };
    }
  }

  buildConversationMessages(userInput, conversationHistory, currentPhase) {
    const messages = [
      {
        role: 'system',
        content: this.sessionContext.systemPrompt + `\n\nCURRENT PHASE: ${currentPhase.toUpperCase()}\n\nPhase Guidelines:\n${this.getPhaseGuidelines(currentPhase)}`
      }
    ];
    
    // Add recent conversation history (last 6 exchanges to stay within token limits)
    const recentHistory = conversationHistory.slice(-6);
    
    recentHistory.forEach(entry => {
      if (entry.speaker === 'user') {
        messages.push({
          role: 'user',
          content: entry.content
        });
      } else if (entry.speaker === 'challenger') {
        messages.push({
          role: 'assistant',
          content: entry.content
        });
      }
    });
    
    // Add current user input
    messages.push({
      role: 'user',
      content: userInput
    });
    
    return messages;
  }

  getPhaseGuidelines(phase) {
    const guidelines = {
      'provocation': 'PROVOCATION PHASE: Challenge their initial idea. Be provocative and push them to think bigger. Ask "why" and "what if" questions. Make them defend their assumptions.',
      'deep_dive': 'DEEP DIVE PHASE: Drill into specifics. Demand numbers, timelines, and concrete details. Challenge their execution plan and resource allocation. Push for clarity on metrics and success criteria.',
      'synthesis': 'SYNTHESIS PHASE: Force decision-making. No more analysis paralysis. Push for concrete next steps and ownership. Challenge them to commit to specific actions with deadlines.'
    };
    
    return guidelines[phase] || guidelines['provocation'];
  }

  shouldTransitionPhase(agentResponse, currentPhase) {
    // Simple heuristics to determine phase transition
    const responseText = agentResponse.toLowerCase();
    
    const transitionIndicators = {
      'provocation': ['understood', 'clear', 'got it', 'makes sense', 'you\'re right'],
      'deep_dive': ['specific', 'detailed', 'numbers', 'concrete', 'exactly', 'precisely'],
      'synthesis': ['decision', 'choose', 'commit', 'action', 'will do', 'next step']
    };
    
    const indicators = transitionIndicators[currentPhase] || [];
    return indicators.some(indicator => responseText.includes(indicator));
  }

  generateSuggestions(currentPhase) {
    const suggestions = {
      'provocation': [
        "Tell me more about the impact",
        "What's your biggest constraint?", 
        "Show me the numbers",
        "What would 10x look like?"
      ],
      'deep_dive': [
        "How do you measure success?",
        "What breaks if you scale this?",
        "What's the timeline?",
        "Who owns this outcome?"
      ],
      'synthesis': [
        "What's the first step?",
        "When do you start?",
        "What's the decision?",
        "How do we move forward?"
      ]
    };
    
    return suggestions[currentPhase] || suggestions['provocation'];
  }

  generateFallbackResponse(userInput, currentPhase) {
    const fallbackResponses = {
      'provocation': [
        "That sounds safe. Where's the innovation?",
        "Show me the math on that.",
        "What would 10x look like?",
        "That's incremental. Think bigger."
      ],
      'deep_dive': [
        "I need specifics. What are the actual numbers?",
        "How do you measure success here?",
        "What breaks when you scale this?",
        "Where's the concrete plan?"
      ],
      'synthesis': [
        "Enough analysis. What's the decision?",
        "Time to commit. What are you actually going to do?",
        "Stop talking, start executing. What's step one?",
        "Decision time. What's it going to be?"
      ]
    };
    
    const responses = fallbackResponses[currentPhase] || fallbackResponses['provocation'];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async updateSessionVariables(variables) {
    try {
      this.sessionContext.sessionVariables = {
        ...this.sessionContext.sessionVariables,
        ...variables
      };
      
      console.log('📝 Updated session variables:', variables);
      return { success: true, variables: this.sessionContext.sessionVariables };
      
    } catch (error) {
      console.error('OpenAI Update Variables Error:', error);
      throw new Error(`Failed to update session variables: ${error.message}`);
    }
  }

  async getUsageStats() {
    try {
      const totalTokens = this.sessionContext.conversationHistory.reduce(
        (sum, entry) => sum + (entry.tokens_used || 0), 0
      );
      
      return {
        total_tokens: totalTokens,
        total_exchanges: this.sessionContext.conversationHistory.length,
        session_id: this.sessionContext.sessionId,
        mode: this.sessionContext.mode
      };
      
    } catch (error) {
      console.error('OpenAI Usage Stats Error:', error);
      return { error: error.message };
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up OpenAI session...');
      
      // Log final usage stats
      const stats = await this.getUsageStats();
      console.log('📊 Final session stats:', stats);
      
      // Clear session context
      this.sessionContext = {};
      
    } catch (error) {
      console.error('OpenAI Cleanup Error:', error);
      // Don't throw - cleanup should be graceful
    }
  }
}
