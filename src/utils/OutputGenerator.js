export class OutputGenerator {
  constructor(mode) {
    this.mode = mode;
    this.templates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      'strategy': {
        title: 'Weekly Strategy Brief',
        sections: [
          'THE BIG BET',
          'THE MATH', 
          'THE RISK',
          'THE DECISION POINT',
          'WHAT YOU\'RE NOT DOING'
        ]
      },
      'founder': {
        title: 'GTM Strategy Brief',
        sections: [
          'THE HYPOTHESIS',
          'THE PROOF POINTS',
          'THE MOAT',
          'THE NUMBERS',
          'THE RISKS',
          'THE 90-DAY TEST'
        ]
      },
      'exec': {
        title: 'Executive Decision Framework',
        sections: [
          'THE BIG BET',
          'RESOURCE REALLOCATION',
          'THE CONTROVERSIAL DECISIONS',
          '90-DAY COMMITMENTS',
          'THE FORCING FUNCTIONS'
        ]
      },
      'team': {
        title: 'Team Efficiency Protocol',
        sections: [
          'DECISION FRAMEWORK',
          'MEETING ELIMINATION',
          'SINGLE METRICS',
          'COMMUNICATION RULES',
          'ACCOUNTABILITY SYSTEM'
        ]
      }
    };
  }

  async generateDocument(conversationHistory, mode, userContext, companyData) {
    try {
      const template = this.templates[mode];
      if (!template) {
        throw new Error(`No template found for mode: ${mode}`);
      }

      // Extract key insights from conversation
      const insights = this.extractInsights(conversationHistory, mode);
      
      // Generate sections based on template and insights
      const sections = await this.generateSections(template.sections, insights, userContext, companyData);
      
      // Compile final document
      const document = this.compileDocument(template.title, sections, insights, userContext, companyData);
      
      return document;
      
    } catch (error) {
      console.error('Output Generation Error:', error);
      throw new Error(`Failed to generate output document: ${error.message}`);
    }
  }

  extractInsights(conversationHistory, mode) {
    const userInputs = conversationHistory.filter(h => h.speaker === 'user');
    const challengerResponses = conversationHistory.filter(h => h.speaker === 'challenger');
    
    return {
      userGoals: this.extractUserGoals(userInputs),
      challengedAssumptions: this.extractChallengedAssumptions(challengerResponses),
      keyDecisions: this.extractKeyDecisions(conversationHistory),
      nextSteps: this.extractNextSteps(conversationHistory),
      riskFactors: this.extractRiskFactors(challengerResponses),
      metrics: this.extractMetrics(conversationHistory),
      timeline: this.extractTimeline(conversationHistory)
    };
  }

  extractUserGoals(userInputs) {
    // Simple keyword extraction for user goals
    const goals = [];
    
    userInputs.forEach(input => {
      const content = input.content.toLowerCase();
      
      // Look for goal-indicating phrases
      if (content.includes('want to') || content.includes('plan to') || content.includes('goal is')) {
        const goalMatch = content.match(/(want to|plan to|goal is to)\s+([^.!?]+)/);
        if (goalMatch) {
          goals.push(goalMatch[2].trim());
        }
      }
      
      // Look for action verbs
      const actionVerbs = ['build', 'create', 'launch', 'improve', 'increase', 'reduce', 'optimize'];
      actionVerbs.forEach(verb => {
        if (content.includes(verb)) {
          const verbMatch = content.match(new RegExp(`${verb}\\s+([^.!?]+)`));
          if (verbMatch) {
            goals.push(`${verb} ${verbMatch[1].trim()}`);
          }
        }
      });
    });
    
    return [...new Set(goals)]; // Remove duplicates
  }

  extractChallengedAssumptions(challengerResponses) {
    const assumptions = [];
    
    challengerResponses.forEach(response => {
      const content = response.content;
      
      // Look for challenger questions that reveal assumptions
      if (content.includes('?')) {
        const questions = content.split('?').filter(q => q.trim().length > 0);
        questions.forEach(question => {
          if (question.toLowerCase().includes('why') || 
              question.toLowerCase().includes('how do you know') ||
              question.toLowerCase().includes('what if')) {
            assumptions.push(question.trim() + '?');
          }
        });
      }
    });
    
    return assumptions.slice(0, 5); // Limit to top 5
  }

  extractKeyDecisions(conversationHistory) {
    const decisions = [];
    
    conversationHistory.forEach(entry => {
      const content = entry.content.toLowerCase();
      
      // Look for decision-indicating phrases
      if (content.includes('decide') || content.includes('choose') || content.includes('commit')) {
        decisions.push(entry.content);
      }
      
      // Look for definitive statements
      if (content.includes('will') && (content.includes('we will') || content.includes('i will'))) {
        decisions.push(entry.content);
      }
    });
    
    return decisions.slice(-3); // Get the last 3 decisions
  }

  extractNextSteps(conversationHistory) {
    const steps = [];
    
    conversationHistory.forEach(entry => {
      const content = entry.content;
      
      // Look for action-oriented language
      if (content.toLowerCase().includes('next') || 
          content.toLowerCase().includes('will do') ||
          content.toLowerCase().includes('going to')) {
        steps.push(content);
      }
    });
    
    return steps.slice(-3); // Get the last 3 action items
  }

  extractRiskFactors(challengerResponses) {
    const risks = [];
    
    challengerResponses.forEach(response => {
      const content = response.content;
      
      // Look for risk-indicating language
      if (content.toLowerCase().includes('what if') ||
          content.toLowerCase().includes('risk') ||
          content.toLowerCase().includes('what breaks') ||
          content.toLowerCase().includes('what happens when')) {
        risks.push(content);
      }
    });
    
    return risks.slice(0, 3); // Top 3 risks
  }

  extractMetrics(conversationHistory) {
    const metrics = [];
    
    conversationHistory.forEach(entry => {
      const content = entry.content;
      
      // Look for numbers and measurement language
      const numberMatches = content.match(/\b\d+[%$]?\b/g);
      if (numberMatches) {
        numberMatches.forEach(match => {
          metrics.push(match);
        });
      }
      
      // Look for KPI-related terms
      const kpiTerms = ['revenue', 'conversion', 'retention', 'growth', 'users', 'customers'];
      kpiTerms.forEach(term => {
        if (content.toLowerCase().includes(term)) {
          metrics.push(term);
        }
      });
    });
    
    return [...new Set(metrics)]; // Remove duplicates
  }

  extractTimeline(conversationHistory) {
    const timeline = [];
    
    conversationHistory.forEach(entry => {
      const content = entry.content.toLowerCase();
      
      // Look for time-related phrases
      const timeMatches = content.match(/\b(this week|next week|this month|in \d+ days|by \w+day|\d+ weeks?)\b/g);
      if (timeMatches) {
        timeMatches.forEach(match => {
          timeline.push(match);
        });
      }
    });
    
    return [...new Set(timeline)]; // Remove duplicates
  }

  async generateSections(sections, insights, userContext, companyData) {
    const generatedSections = {};
    
    for (const section of sections) {
      generatedSections[section] = await this.generateSectionContent(section, insights, userContext, companyData);
    }
    
    return generatedSections;
  }

  async generateSectionContent(sectionName, insights, userContext, companyData) {
    // Generate content based on section name and available insights
    switch (sectionName) {
      case 'THE BIG BET':
        return this.generateBigBet(insights);
      
      case 'THE MATH':
        return this.generateMath(insights);
      
      case 'THE RISK':
        return this.generateRisk(insights);
      
      case 'THE DECISION POINT':
        return this.generateDecisionPoint(insights);
      
      case "WHAT YOU'RE NOT DOING":
        return this.generateNotDoing(insights);
      
      case 'THE HYPOTHESIS':
        return this.generateHypothesis(insights);
      
      case 'THE PROOF POINTS':
        return this.generateProofPoints(insights);
      
      case 'THE MOAT':
        return this.generateMoat(insights);
      
      case 'THE NUMBERS':
        return this.generateNumbers(insights);
      
      case 'THE 90-DAY TEST':
        return this.generate90DayTest(insights);
      
      case 'RESOURCE REALLOCATION':
        return this.generateResourceReallocation(insights);
      
      case 'THE CONTROVERSIAL DECISIONS':
        return this.generateControversialDecisions(insights);
      
      case 'THE FORCING FUNCTIONS':
        return this.generateForcingFunctions(insights);
      
      case 'DECISION FRAMEWORK':
        return this.generateDecisionFramework(insights);
      
      case 'MEETING ELIMINATION':
        return this.generateMeetingElimination(insights);
      
      case 'ACCOUNTABILITY SYSTEM':
        return this.generateAccountabilitySystem(insights);
      
      default:
        return this.generateGenericContent(sectionName, insights);
    }
  }

  generateBigBet(insights) {
    const goal = insights.userGoals[0] || 'optimize current strategy';
    return `You're betting that ${goal} will drive measurable business impact within the next 90 days.`;
  }

  generateMath(insights) {
    const metrics = insights.metrics.length > 0 ? insights.metrics.join(', ') : 'key performance indicators';
    return `Expected impact: ${metrics}. Success defined by measurable improvement in core business metrics within defined timeline.`;
  }

  generateRisk(insights) {
    const risk = insights.riskFactors[0] || 'Execution may take longer than expected';
    const mitigation = 'Weekly progress checkpoints and pivot triggers established.';
    return `Primary risk: ${risk}. Mitigation: ${mitigation}`;
  }

  generateDecisionPoint(insights) {
    const timeline = insights.timeline[0] || 'end of month';
    return `Decision point: ${timeline}. If progress indicators aren't met, pivot to alternative approach or reallocate resources.`;
  }

  generateNotDoing(insights) {
    return `Explicitly NOT doing: Lower-priority initiatives, consensus-building meetings, and incremental optimizations that don't move the needle.`;
  }

  generateHypothesis(insights) {
    const goal = insights.userGoals[0] || 'target market opportunity';
    return `Market hypothesis: ${goal} represents significant unmet need with customers willing to pay for solution.`;
  }

  generateProofPoints(insights) {
    return `Evidence: Customer conversations, market research, competitive analysis, and initial validation tests support core hypothesis.`;
  }

  generateMoat(insights) {
    return `Competitive advantage: Unique approach, superior execution speed, exclusive partnerships, or proprietary technology/data.`;
  }

  generateNumbers(insights) {
    const metrics = insights.metrics.length > 0 ? insights.metrics.join(', ') : 'revenue, CAC, LTV';
    return `Key metrics: ${metrics}. Unit economics must be positive within 6 months of launch.`;
  }

  generate90DayTest(insights) {
    return `90-day validation: Specific customer acquisition targets, revenue milestones, and product-market fit indicators.`;
  }

  generateResourceReallocation(insights) {
    return `Resource shifts: Double down on highest-impact initiatives, eliminate or reduce funding for underperforming projects.`;
  }

  generateControversialDecisions(insights) {
    return `Bold moves: Decisions that competitors won't make, conventional wisdom challenges, aggressive market positioning.`;
  }

  generateForcingFunctions(insights) {
    const timeline = insights.timeline[0] || 'monthly';
    return `Urgency mechanisms: ${timeline} reviews, public commitments, and automatic escalation triggers for delayed decisions.`;
  }

  generateDecisionFramework(insights) {
    return `Decision process: Single owner for each outcome, 48-hour maximum for reversible decisions, escalation path for conflicts.`;
  }

  generateMeetingElimination(insights) {
    return `Meeting reduction: Cancel status meetings, replace with async updates, limit attendees to decision-makers only.`;
  }

  generateAccountabilitySystem(insights) {
    return `Tracking: Weekly outcome reviews, public progress dashboards, individual ownership of specific results.`;
  }

  generateGenericContent(sectionName, insights) {
    return `${sectionName}: Specific actions and commitments based on strategic discussion and challenger feedback.`;
  }

  compileDocument(title, sections, insights, userContext, companyData) {
    const timestamp = new Date().toISOString();
    const userName = userContext.name || 'Strategic Leader';
    const companyName = companyData.name || 'Your Organization';
    
    let document = `# ${title}\n\n`;
    document += `**Generated:** ${new Date(timestamp).toLocaleDateString()}\n`;
    document += `**For:** ${userName} at ${companyName}\n`;
    document += `**Session Type:** Strategic Challenge Session\n\n`;
    
    document += `---\n\n`;
    
    // Add sections
    Object.entries(sections).forEach(([sectionName, content]) => {
      document += `## ${sectionName}\n`;
      document += `${content}\n\n`;
    });
    
    // Add session summary
    document += `---\n\n`;
    document += `## SESSION SUMMARY\n`;
    document += `- **Key Challenges Addressed:** ${insights.challengedAssumptions.length}\n`;
    document += `- **Decisions Forced:** ${insights.keyDecisions.length}\n`;
    document += `- **Action Items:** ${insights.nextSteps.length}\n`;
    document += `- **Risk Factors Identified:** ${insights.riskFactors.length}\n\n`;
    
    document += `*"The only way to make the right decision is to be challenged by someone who disagrees with you."*\n`;
    document += `\n**Next Challenge Session:** Schedule weekly follow-up to track progress and maintain momentum.\n`;
    
    return {
      title: title,
      content: document,
      sections: sections,
      insights: insights,
      metadata: {
        timestamp: timestamp,
        userName: userName,
        companyName: companyName,
        sessionType: this.mode,
        wordCount: document.split(' ').length
      }
    };
  }
}