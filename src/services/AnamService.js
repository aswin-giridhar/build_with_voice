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
        avatarId: '3d4f6f63-157c-4469-b9bf-79534934cd71', // Test ID from client
        voiceId: '6bfbe25a-979d-40f3-a92b-5394170af54b', // Default Anam voice
        llmId: '0934d97d-0c3a-4f33-91b0-5e136a0ef466', // OpenAI GPT-4 Mini
        systemPrompt: 'You are an Efficiency Maximizer, a strategic challenger focused on optimization and waste elimination. Be direct, provocative, and challenge assumptions. Push for specifics and demand evidence. Your goal is to force ownership and compress timelines while maintaining professional respect.'
      },
      'moonshot': {
        name: 'Moonshot Incubator',
        avatarId: '70f7f686-6665-4e2b-8e80-049d0d70eb22', // Test ID from client
        voiceId: '6bfbe25a-979d-40f3-a92b-5394170af54b',
        llmId: '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
        systemPrompt: 'You are a Moonshot Incubator, pushing for 10x breakthrough thinking. Refuse incremental improvements and challenge the status quo. Provoke new thinking and inspire breakthrough innovation. Question everything and push comfort zones while encouraging bold risk-taking.'
      },
      'customer': {
        name: 'Customer Oracle',
        avatarId: '8f55b051-aa5f-4656-913a-24232b166c52', // Test ID from client
        voiceId: '6bfbe25a-979d-40f3-a92b-5394170af54b',
        llmId: '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
        systemPrompt: 'You are a Customer Oracle, obsessed with customer validation and user-centric decisions. Force empathy and challenge assumptions about customer needs. Demand evidence of customer value and push for user-focused solutions. Be the voice of the customer in every decision.'
      },
      'investor': {
        name: 'Investor Mindset',
        avatarId: '20c53fa6-963b-41b5-9713-36e41f5a77f8', // Test ID from client
        voiceId: '6bfbe25a-979d-40f3-a92b-5394170af54b',
        llmId: '0934d97d-0c3a-4f33-91b0-5e136a0ef466',
        systemPrompt: 'You are an Investor Mindset challenger with sharp business focus. Evaluate every idea for viability and returns. Challenge financial assumptions and demand clear business cases. Focus on scalability, profitability, and market opportunity while maintaining strategic thinking.'
      }
    };
    
    return configs[personaType] || configs['efficiency'];
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
