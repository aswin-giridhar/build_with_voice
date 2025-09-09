import axios from 'axios';

export class AnamService {
  constructor() {
    this.apiKey = process.env.ANAM_API_KEY;
    this.baseURL = 'https://api.anam.ai/v1';
    
    this.currentSessionToken = null;
    this.isInitialized = false;
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async initializeAvatar(personaType = 'efficiency') {
    try {
      // Get persona configuration for the modern API
      const personaConfig = this.getPersonaConfig(personaType);
      
      // Create session token using the correct modern API endpoint
      const response = await this.client.post('/auth/session-token', {
        personaConfig: {
          name: personaConfig.name,
          avatarId: personaConfig.avatarId,
          voiceId: personaConfig.voiceId,
          llmId: personaConfig.llmId,
          systemPrompt: personaConfig.systemPrompt
        }
      });
      
      this.currentSessionToken = response.data.sessionToken;
      this.isInitialized = true;
      
      return {
        sessionToken: this.currentSessionToken,
        personaConfig: personaConfig
      };
      
    } catch (error) {
      console.error('Anam Avatar Initialization Error:', error);
      throw new Error(`Failed to initialize avatar: ${error.message}`);
    }
  }

  getPersonaConfig(personaType) {
    const configs = {
      'efficiency': {
        name: 'Efficiency Maximizer',
        avatarId: process.env.ANAM_EFFICIENCY_AVATAR_ID || '481542ce-2746-4989-bd70-1c3e8ebd069e', // Elena
        voiceId: process.env.ANAM_EFFICIENCY_VOICE_ID || '16148043-eed4-4bb8-ac0f-78ffd744ffcb',
        llmId: process.env.ANAM_EFFICIENCY_LLM_ID || '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
        systemPrompt: 'You are an Efficiency Maximizer, a strategic challenger focused on optimization and waste elimination. Be direct, provocative, and challenge assumptions. Push for specifics and demand evidence. Your goal is to force ownership and compress timelines while maintaining professional respect.'
      },
      'moonshot': {
        name: 'Moonshot Incubator',
        avatarId: process.env.ANAM_MOONSHOT_AVATAR_ID || 'e5fe7c2f-57cb-43e2-9e4c-e5c00d0c7185', // Stephanie
        voiceId: process.env.ANAM_MOONSHOT_VOICE_ID || '4ebbaadb-cf9e-4e55-b133-1062f8d4f153',
        llmId: process.env.ANAM_MOONSHOT_LLM_ID || '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
        systemPrompt: 'You are a Moonshot Incubator, pushing for 10x breakthrough thinking. Refuse incremental improvements and challenge the status quo. Provoke new thinking and inspire breakthrough innovation. Question everything and push comfort zones while encouraging bold risk-taking.'
      },
      'customer': {
        name: 'The Relentless Operator',
        avatarId: process.env.ANAM_CUSTOMER_AVATAR_ID || 'c019729a-be4c-4b21-af11-2179612c732b', // Mary
        voiceId: process.env.ANAM_CUSTOMER_VOICE_ID || 'e932be57-1316-4550-b80e-aac122a19f5b',
        llmId: process.env.ANAM_CUSTOMER_LLM_ID || '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
        systemPrompt: 'You are a Customer Oracle, obsessed with customer validation and user-centric decisions. Force empathy and challenge assumptions about customer needs. Demand evidence of customer value and push for user-focused solutions. Be the voice of the customer in every decision.'
      },
      'investor': {
        name: 'Investor Mindset',
        avatarId: process.env.ANAM_INVESTOR_AVATAR_ID || '4b622e32-93c7-4b88-b93a-8b0df888eeb3', // Robert
        voiceId: process.env.ANAM_INVESTOR_VOICE_ID || '8f16de20-df0a-40f9-96aa-d29e4a05fb25',
        llmId: process.env.ANAM_INVESTOR_LLM_ID || '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
        systemPrompt: 'You are an Investor Mindset challenger with sharp business focus. Evaluate every idea for viability and returns. Challenge financial assumptions and demand clear business cases. Focus on scalability, profitability, and market opportunity while maintaining strategic thinking.'
      }
    };
    
    return configs[personaType] || configs['efficiency'];
  }

  // Get shareable link for persona (backup solution)
  getShareableLink(personaType) {
    const shareableLinks = {
      'efficiency': process.env.ANAM_EFFICIENCY_SHARE_URL || 'https://lab.anam.ai/share/w2Sp6ArKZ0kIAUdIIJ2CN',
      'moonshot': process.env.ANAM_MOONSHOT_SHARE_URL || 'https://lab.anam.ai/share/aBZL9qawRPbhcXz7vFUK3',
      'customer': process.env.ANAM_CUSTOMER_SHARE_URL || 'https://lab.anam.ai/share/DBLkgIkZqOzO3mJTa7cVF',
      'investor': process.env.ANAM_INVESTOR_SHARE_URL || 'https://lab.anam.ai/share/XlLT-u_1mbQQvio6GSbSm'
    };
    
    return shareableLinks[personaType] || shareableLinks['efficiency'];
  }

  // Fallback method using shareable links when SDK/API fails
  async initializeWithShareableLink(personaType = 'efficiency') {
    try {
      const shareableLink = this.getShareableLink(personaType);
      const personaConfig = this.getPersonaConfig(personaType);
      
      console.log(`🔗 Using Anam shareable link fallback for ${personaType}: ${shareableLink}`);
      
      return {
        fallbackMode: true,
        shareableLink: shareableLink,
        personaConfig: personaConfig,
        instructions: 'Open this link in a new tab for the Anam.ai avatar experience'
      };
      
    } catch (error) {
      console.error('Shareable link fallback error:', error);
      throw new Error(`Failed to initialize with shareable link: ${error.message}`);
    }
  }

  // Get session token for client-side SDK usage
  getSessionToken() {
    return this.currentSessionToken;
  }

  // Check if service is initialized
  isReady() {
    return this.isInitialized && this.currentSessionToken !== null;
  }

  // Clean up resources
  async cleanup() {
    try {
      this.currentSessionToken = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Anam Cleanup Error:', error);
      // Don't throw - cleanup should be graceful
    }
  }
}
