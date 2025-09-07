export class ChallengerPersona {
  constructor(persona, logger) {
    this.persona = persona; // Changed from mode to persona
    this.logger = logger;
    
    // Core challenger patterns by persona
    this.challengePatterns = this.initializeChallengePatterns();
    
    // Track challenging intensity
    this.intensityLevel = 0.7; // Start at 70% intensity
    this.maxIntensity = 1.0;
    
    // Persona-specific configurations
    this.personaConfigs = this.initializePersonaConfigs();
  }

  initializeChallengePatterns() {
    return {
      'efficiency': {
        provocation: [
          "Look, that sounds like busywork. What revenue does this actually generate?",
          "Actually, what's the fastest way to test this?",
          "How many meetings will this take before someone actually decides?"
        ],
        deep_dive: [
          "What's the highest-leverage use of your time right now?",
          "Can you 10x the timeline on this?",
          "Who owns this outcome, specifically?",
          "What breaks if you compress this by 75%?"
        ],
        synthesis: [
          "So what are you cutting to focus on this?",
          "What's the fastest path to results?",
          "Who's accountable if this doesn't work?"
        ]
      },
      'moonshot': {
        provocation: [
          "Another incremental feature... Where's the revolutionary impact?",
          "That's 10% better. Where's the 10x breakthrough?",
          "What if you captured the entire market with this?"
        ],
        deep_dive: [
          "Think bigger... What's the impossible version of this?",
          "What would this look like if you had unlimited resources?",
          "How does this transform the entire industry?",
          "What breaks when you scale this 1000x?"
        ],
        synthesis: [
          "Where's your unfair advantage in this moonshot?",
          "How do you make the impossible inevitable?",
          "What would the 10x version of this success look like?"
        ]
      },
      'customer': {
        provocation: [
          "What would this feel like for the customer?",
          "Would this change their life... or just fill another roadmap slot?",
          "Are you solving for your customer or your board?"
        ],
        deep_dive: [
          "Go deeper... What's the customer's real pain here?",
          "How does this simplify their experience?",
          "What would delight them about this?",
          "Are you creating something they'll evangelize?"
        ],
        synthesis: [
          "How will you validate this solves their real problem?",
          "What's the customer's emotional response to this?",
          "Would they pay for this or just say it's nice to have?"
        ]
      },
      'investor': {
        provocation: [
          "Where's the return? Show me the math.",
          "That's a hobby, not a business.",
          "How fast can this make money?"
        ],
        deep_dive: [
          "What's your unit economics look like?",
          "Where's your competitive moat in this?",
          "Can you 10x the revenue model?",
          "What's the exit strategy here?"
        ],
        synthesis: [
          "How do you defend this business model?",
          "What's your path to profitability?",
          "Where's the scalable value creation?"
        ]
      }
    };
  }

  initializePersonaConfigs() {
    return {
      'efficiency': {
        name: 'Efficiency Maximizer',
        avatar: 'Elena',
        focusAreas: ['waste elimination', 'timeline compression', 'ownership', 'execution speed'],
        challengeStyle: 'urgent and direct',
        commonPhrases: ['Look,', 'Actually,', 'What\'s the fastest way...', 'Who owns this?']
      },
      'moonshot': {
        name: 'Moonshot Incubator', 
        avatar: 'Stephanie',
        focusAreas: ['10x thinking', 'breakthrough innovation', 'market transformation', 'bold vision'],
        challengeStyle: 'passionate and visionary',
        commonPhrases: ['Think bigger...', 'What if...', 'Revolutionary', 'Transform the entire...']
      },
      'customer': {
        name: 'Customer Oracle',
        avatar: 'Omari',
        focusAreas: ['customer empathy', 'user experience', 'simplification', 'delight'],
        challengeStyle: 'empathetic but commanding',
        commonPhrases: ['What would this feel like...', 'Go deeper...', 'For the customer', 'Would they evangelize this?']
      },
      'investor': {
        name: 'Investor Mindset',
        avatar: 'Robert', 
        focusAreas: ['business viability', 'financial returns', 'unit economics', 'scalability'],
        challengeStyle: 'sharp and financially focused',
        commonPhrases: ['Show me the math', 'Where\'s the return?', 'That\'s a hobby', 'What\'s the exit?']
      }
    };
  }

  async generateChallenge(userInput, synthflowResponse, conversationHistory, currentPhase) {
    try {
      this.logger.info(`Generating ${this.persona} persona challenge for phase: ${currentPhase}`);
      
      // Get persona and phase-specific patterns
      const patterns = this.challengePatterns[this.persona]?.[currentPhase] || [];
      
      if (patterns.length === 0) {
        // Fallback to generic challenge
        return this.generateGenericChallenge(userInput, synthflowResponse);
      }
      
      // Select pattern based on conversation context and persona style
      const selectedPattern = this.selectPatternByContext(patterns, userInput, conversationHistory);
      
      // Apply persona-specific modifications
      const personalizedChallenge = this.applyPersonaStyle(selectedPattern, userInput);
      
      // Apply intensity scaling
      const challenge = this.applyIntensityScaling(personalizedChallenge, userInput);
      
      // Determine if we should transition to next phase
      const shouldTransition = this.shouldTransitionPhase(currentPhase, conversationHistory);
      
      return {
        text: challenge,
        challengeType: this.getChallengeType(currentPhase),
        emotion: this.getEmotionForPersona(this.persona, currentPhase),
        shouldTransition: shouldTransition,
        facialExpression: this.getFacialExpression(currentPhase, this.persona),
        persona: this.persona
      };
      
    } catch (error) {
      this.logger.error(`Failed to generate challenge:`, error);
      return this.generateFallbackChallenge();
    }
  }

  applyPersonaStyle(basePattern, userInput) {
    const config = this.personaConfigs[this.persona];
    const phrases = config.commonPhrases;
    
    // Add persona-specific speech patterns
    switch (this.persona) {
      case 'efficiency':
        // Add urgency indicators
        if (Math.random() > 0.5) {
          const urgencyPhrase = phrases[Math.floor(Math.random() * phrases.length)];
          return `${urgencyPhrase} ${basePattern.toLowerCase()}`;
        }
        return basePattern;
        
      case 'moonshot':
        // Add visionary language
        return basePattern.replace(/better/g, 'revolutionary').replace(/improve/g, 'transform');
        
      case 'customer':
        // Add empathy while maintaining challenge
        if (!basePattern.includes('customer')) {
          return `${basePattern} Think about it from the customer's perspective.`;
        }
        return basePattern;
        
      case 'investor':
        // Add financial focus
        if (!basePattern.includes('money') && !basePattern.includes('return') && Math.random() > 0.6) {
          return `${basePattern} What's the ROI on this?`;
        }
        return basePattern;
        
      default:
        return basePattern;
    }
  }

  getEmotionForPersona(persona, phase) {
    const emotionMap = {
      'efficiency': {
        provocation: 'impatient',
        deep_dive: 'focused',
        synthesis: 'decisive'
      },
      'moonshot': {
        provocation: 'inspiring',
        deep_dive: 'passionate', 
        synthesis: 'visionary'
      },
      'customer': {
        provocation: 'empathetic',
        deep_dive: 'thoughtful',
        synthesis: 'caring'
      },
      'investor': {
        provocation: 'skeptical',
        deep_dive: 'analytical',
        synthesis: 'business-focused'
      }
    };
    
    return emotionMap[persona]?.[phase] || 'challenging';
  }

  getFacialExpression(phase, persona) {
    const expressionMap = {
      'efficiency': {
        provocation: 'slightly-frowning',
        deep_dive: 'intense-focus',
        synthesis: 'determined'
      },
      'moonshot': {
        provocation: 'raised-eyebrows',
        deep_dive: 'inspired',
        synthesis: 'visionary-smile'
      },
      'customer': {
        provocation: 'concerned',
        deep_dive: 'empathetic-focus',
        synthesis: 'understanding'
      },
      'investor': {
        provocation: 'skeptical-squint',
        deep_dive: 'calculating',
        synthesis: 'evaluating'
      }
    };
    
    return expressionMap[persona]?.[phase] || 'challenging';
  }

  selectPatternByContext(patterns, userInput, conversationHistory) {
    // Simple selection for now - could be enhanced with NLP analysis
    const inputLower = userInput.toLowerCase();
    
    // Keywords that might indicate specific challenge opportunities
    const keywordMap = {
      'meeting': patterns.find(p => p.includes('meeting')) || patterns[0],
      'time': patterns.find(p => p.includes('time') || p.includes('timeline')) || patterns[0],
      'team': patterns.find(p => p.includes('team')) || patterns[0],
      'customer': patterns.find(p => p.includes('customer')) || patterns[0],
      'revenue': patterns.find(p => p.includes('revenue') || p.includes('money')) || patterns[0],
      'strategy': patterns.find(p => p.includes('strategy')) || patterns[0]
    };
    
    // Check for keyword matches
    for (const [keyword, pattern] of Object.entries(keywordMap)) {
      if (inputLower.includes(keyword)) {
        return pattern;
      }
    }
    
    // Random selection if no specific match
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  applyIntensityScaling(challenge, userInput) {
    // Scale challenge intensity based on user engagement level
    const engagementIndicators = ['specific', 'numbers', 'data', 'metrics', 'concrete'];
    const hasEngagement = engagementIndicators.some(indicator => 
      userInput.toLowerCase().includes(indicator)
    );
    
    if (hasEngagement && this.intensityLevel < this.maxIntensity) {
      this.intensityLevel = Math.min(this.intensityLevel + 0.1, this.maxIntensity);
    }
    
    // Add intensity modifiers based on level
    if (this.intensityLevel > 0.8) {
      return `${challenge} Try again.`;
    }
    
    return challenge;
  }

  shouldTransitionPhase(currentPhase, conversationHistory) {
    const phaseOrder = ['provocation', 'deep_dive', 'synthesis', 'output'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    
    if (currentIndex === -1) return false;
    
    // Simple rule: transition after 2-3 exchanges in current phase
    const phaseHistory = conversationHistory.filter(h => h.phase === currentPhase);
    return phaseHistory.length >= 4; // 2 user + 2 challenger messages
  }

  getChallengeType(phase) {
    const typeMap = {
      'provocation': 'assumption_challenge',
      'deep_dive': 'analytical_challenge',
      'synthesis': 'decision_forcing',
      'output': 'action_oriented'
    };
    
    return typeMap[phase] || 'generic_challenge';
  }

  generateGenericChallenge(userInput, synthflowResponse) {
    const genericChallenges = [
      "That's the obvious answer. What's the non-obvious one?",
      "Show me the math on that.",
      "What would your smartest competitor do instead?",
      "That sounds safe. Where's the innovation?",
      "Try again, but think bigger."
    ];
    
    return {
      text: genericChallenges[Math.floor(Math.random() * genericChallenges.length)],
      challengeType: 'generic_challenge',
      emotion: 'challenging',
      shouldTransition: false,
      facialExpression: 'questioning',
      persona: this.persona
    };
  }

  generateFallbackChallenge() {
    return {
      text: "I'm here to challenge your thinking. Tell me more about your strategy.",
      challengeType: 'fallback',
      emotion: 'neutral',
      shouldTransition: false,
      facialExpression: 'attentive',
      persona: this.persona
    };
  }

  generateNextSteps(conversationHistory, persona) {
    const nextSteps = {
      'efficiency': [
        "Eliminate one unnecessary meeting this week",
        "Define single person accountability for each deliverable",
        "Set up daily progress check-ins, not weekly",
        "Create 48-hour decision deadlines for pending choices"
      ],
      'moonshot': [
        "Identify the 10x version of your current solution",
        "Research breakthrough innovations in adjacent industries", 
        "Build a prototype that demonstrates transformative potential",
        "Map out the path from incremental to revolutionary"
      ],
      'customer': [
        "Interview 5 customers about their real pain points",
        "Create user journey maps for your proposed solution",
        "Test your assumption with actual user behavior data",
        "Design the simplest possible user experience"
      ],
      'investor': [
        "Calculate unit economics with realistic assumptions",
        "Model 3 different revenue scenarios",
        "Identify your top 3 competitive advantages",
        "Create a 12-month path to profitability"
      ]
    };
    
    return nextSteps[persona] || nextSteps['efficiency'];
  }

  // Utility method to get persona information
  getPersonaInfo() {
    return this.personaConfigs[this.persona] || this.personaConfigs['efficiency'];
  }

  // Method to adjust intensity based on user feedback
  adjustIntensity(feedback) {
    if (feedback === 'too_intense') {
      this.intensityLevel = Math.max(this.intensityLevel - 0.2, 0.3);
    } else if (feedback === 'not_challenging_enough') {
      this.intensityLevel = Math.min(this.intensityLevel + 0.2, this.maxIntensity);
    }
    
    this.logger.info(`Adjusted challenge intensity to ${this.intensityLevel} for persona ${this.persona}`);
  }
}