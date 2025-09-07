/**
 * Demo Script for Hackathon Presentation
 * "Unhinged Colleague" - Your Strategic Challenger
 */

import dotenv from 'dotenv';
import { UnhingedColleagueSession } from './services/UnhingedColleagueSession.js';
import { validateApiKeys } from './utils/validation.js';

dotenv.config();

class HackathonDemo {
  constructor() {
    this.demoScenarios = this.initializeDemoScenarios();
    this.currentScenario = 0;
  }

  initializeDemoScenarios() {
    return [
      {
        name: "Weekly Strategy Session",
        mode: "strategy",
        userInput: "I'm planning to focus on improving our website design this week",
        expectedChallenges: [
          "That sounds like busywork. What revenue does this actually generate?",
          "Show me the math. How does this move the needle?",
          "Can you buy, borrow, or steal this instead of building it?"
        ]
      },
      {
        name: "Founder Mode Challenge",
        mode: "founder", 
        userInput: "We're launching a new feature to improve user engagement",
        expectedChallenges: [
          "Cute. Another incremental feature. Where's the moat?",
          "How many customers have you talked to this week?",
          "What's your unfair advantage that can't be copied?"
        ]
      },
      {
        name: "Executive Decision",
        mode: "exec",
        userInput: "We need to align the team on our Q4 priorities",
        expectedChallenges: [
          "Align? That's code for 'no one wants to make the hard call.'",
          "What ruthless decision are you avoiding?",
          "Which team should you kill to double down on this?"
        ]
      },
      {
        name: "Team Efficiency",
        mode: "team",
        userInput: "We should have a brainstorming meeting about the project",
        expectedChallenges: [
          "How many meetings will this take before someone actually decides?",
          "Which of this week's meetings could be a Slack message?",
          "What decisions are you 'socializing' instead of making?"
        ]
      }
    ];
  }

  async runHackathonDemo() {
    console.log('🎯 UNHINGED COLLEAGUE - HACKATHON DEMO');
    console.log('=====================================');
    console.log('Your Strategic Challenger for High-Performance Thinking\n');

    try {
      // Validate setup
      validateApiKeys();
      console.log('✅ API Keys validated\n');

      // Run through demo scenarios
      for (const scenario of this.demoScenarios) {
        await this.runScenario(scenario);
        console.log('\n' + '='.repeat(50) + '\n');
      }

      // Show enterprise value proposition
      this.showEnterpriseValue();

      console.log('🏆 DEMO COMPLETE - Ready for Hackathon Judging!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      process.exit(1);
    }
  }

  async runScenario(scenario) {
    console.log(`📊 SCENARIO: ${scenario.name.toUpperCase()}`);
    console.log(`Mode: ${scenario.mode}`);
    console.log(`User Input: "${scenario.userInput}"`);
    console.log('-'.repeat(40));

    // Simulate the challenging conversation
    console.log('\n🤖 CHALLENGER RESPONSES:');
    scenario.expectedChallenges.forEach((challenge, index) => {
      console.log(`${index + 1}. "${challenge}"`);
    });

    // Show conversation progression
    console.log('\n📈 CONVERSATION PROGRESSION:');
    console.log('Phase 1: Provocation → Immediate challenge to assumption');
    console.log('Phase 2: Deep Dive → Systematic questioning'); 
    console.log('Phase 3: Synthesis → Force clarity and commitment');
    console.log('Phase 4: Output → Generate actionable strategy document');

    // Show expected output
    console.log('\n📄 GENERATED OUTPUT PREVIEW:');
    const outputPreview = this.generateOutputPreview(scenario);
    console.log(outputPreview);
  }

  generateOutputPreview(scenario) {
    const templates = {
      'strategy': `
# Weekly Strategy Brief

**THE BIG BET**: Focus on high-impact website optimizations that drive measurable conversion improvements

**THE MATH**: Target 15% increase in conversion rate = $50K additional monthly revenue

**THE RISK**: Design changes without user data could decrease conversions

**THE DECISION POINT**: A/B testing results in 2 weeks - pivot if no improvement

**WHAT YOU'RE NOT DOING**: Cosmetic changes, consensus-building meetings, feature creep
      `,
      'founder': `
# GTM Strategy Brief

**THE HYPOTHESIS**: New engagement feature addresses key user retention gap

**THE PROOF POINTS**: 50 customer interviews, 23% mention this specific pain point

**THE MOAT**: Proprietary usage data gives unique insight into user behavior

**THE NUMBERS**: $50 CAC, $500 LTV, 30% improvement in retention expected

**THE 90-DAY TEST**: 1000 active users, 20% week-over-week engagement increase
      `,
      'exec': `
# Executive Decision Framework

**THE BIG BET**: Double down on top-performing product line, cut underperformers

**RESOURCE REALLOCATION**: 60% of engineering to core product, eliminate 2 side projects

**THE CONTROVERSIAL DECISIONS**: End partnerships generating <$100K annually

**90-DAY COMMITMENTS**: 40% increase in core product revenue, team size reduced by 15%

**THE FORCING FUNCTIONS**: Monthly board updates, public revenue targets, team lead accountability
      `,
      'team': `
# Team Efficiency Protocol

**DECISION FRAMEWORK**: Single owner per outcome, 24-hour max for reversible decisions

**MEETING ELIMINATION**: Cancel weekly status meetings, replace with async Slack updates

**SINGLE METRICS**: Each team member optimizes for 1 key result only

**COMMUNICATION RULES**: Meetings only for decisions, Slack for updates, direct for conflicts

**ACCOUNTABILITY SYSTEM**: Daily progress dashboard, weekly 1:1s focused on outcomes only
      `
    };

    return templates[scenario.mode] || 'Strategy document generated based on conversation insights.';
  }

  showEnterpriseValue() {
    console.log('💼 ENTERPRISE VALUE PROPOSITION');
    console.log('================================');
    console.log('');
    console.log('🎯 FOR LEADERS/BUYERS:');
    console.log('• Optimizes revenue per employee through sharper, faster strategy');
    console.log('• Reduces meeting load - 20min session replaces multiple brainstorming meetings');
    console.log('• Creates high-agency culture - employees defend ideas before pulling in colleagues');
    console.log('• Scales across teams - weekly mandatory "Challenger sessions"');
    console.log('');
    console.log('🎯 FOR EMPLOYEES/USERS:');
    console.log('• Safe space to explore big ideas without judgment');
    console.log('• Teaches founder/C-Suite thinking through practice');
    console.log('• Produces clear, exportable outputs for immediate action');
    console.log('• Builds confidence in strategic decision-making');
    console.log('');
    console.log('💰 PRICING MODEL:');
    console.log('• $99/user/month for unlimited sessions (SaaS)');
    console.log('• $50K/year for <100 users (Private Cloud)');
    console.log('• $0.50/session (API integration)');
    console.log('');
    console.log('🏆 HACKATHON CRITERIA FIT:');
    console.log('• MOST INNOVATIVE: "Mandatory AI sparring partner" for enterprises');
    console.log('• MOST VIRAL: Live demo of being challenged creates memorable moments');
    console.log('• MOST UNHINGED GENIUS: Elon-style efficiency obsession in corporate tool');
  }

  showTechnicalArchitecture() {
    console.log('\n🔧 TECHNICAL ARCHITECTURE');
    console.log('==========================');
    console.log('');
    console.log('Voice Input → Anam.ai Avatar → Synthflow Brain → Custom Challenger Logic → ElevenLabs Voice → Visual Delivery');
    console.log('');
    console.log('🎭 Anam.ai: Executive presence avatar with sub-1s latency');
    console.log('🧠 Synthflow: Conversation orchestration, memory, enterprise integration');
    console.log('🗣️ ElevenLabs: High-quality voice generation with emotional modulation');
    console.log('⚡ Custom Logic: Mode-specific challenging patterns and persona engine');
    console.log('');
    console.log('📊 Enterprise Features:');
    console.log('• SSO integration (Google/Microsoft/Okta)');
    console.log('• Slack/Teams output delivery');
    console.log('• Analytics dashboard for engagement tracking');
    console.log('• API-first architecture for custom integrations');
  }

  async runLiveDemo() {
    console.log('\n🎬 LIVE DEMO SIMULATION');
    console.log('=======================');
    console.log('');
    console.log('[DEMO SCRIPT FOR HACKATHON PRESENTATION]');
    console.log('');
    console.log('1. "Let me show you what happens when I tell my AI colleague about a typical startup idea..."');
    console.log('');
    console.log('   USER: "We\'re building an app for food delivery"');
    console.log('   CHALLENGER: "Oh great, another Uber Eats clone. What makes you think the world needs this?"');
    console.log('');
    console.log('2. "Watch how it pushes back on vague strategies..."');
    console.log('');
    console.log('   USER: "We want to improve customer satisfaction"');
    console.log('   CHALLENGER: "That\'s not a strategy, that\'s a hope. Show me the math. What specific metric improves by how much by when?"');
    console.log('');
    console.log('3. "And here\'s the magic - it generates an actual strategy document..."');
    console.log('');
    console.log('[Display generated strategy brief on screen]');
    console.log('');
    console.log('4. "This is what every startup needs - someone who won\'t let you get away with fuzzy thinking."');
    console.log('');
    console.log('💡 VIRAL MOMENT SETUP:');
    console.log('• Have a judge volunteer their actual business challenge');
    console.log('• Let the AI challenge them live in front of the audience');
    console.log('• Show their reaction when it questions their assumptions');
    console.log('• Generate their real strategy document in real-time');
  }
}

// Main demo execution
async function main() {
  const demo = new HackathonDemo();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--live')) {
    await demo.runLiveDemo();
  } else if (args.includes('--architecture')) {
    demo.showTechnicalArchitecture();
  } else {
    await demo.runHackathonDemo();
  }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { HackathonDemo };