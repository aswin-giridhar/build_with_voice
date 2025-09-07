import axios from 'axios';
import WebSocket from 'ws';

export class AnamService {
  constructor() {
    this.apiKey = process.env.ANAM_API_KEY;
    this.baseURL = 'https://api.anam.ai/v1';
    this.streamURL = process.env.ANAM_STREAM_URL;
    
    this.currentPersona = null;
    this.websocket = null;
    this.isConnected = false;
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async initializeAvatar(personaType = 'senior_strategic_advisor') {
    try {
      // Create or get persona configuration
      const personaConfig = this.getPersonaConfig(personaType);
      
      const response = await this.client.post('/personas', {
        name: personaConfig.name,
        description: personaConfig.description,
        appearance: personaConfig.appearance,
        voice_settings: personaConfig.voiceSettings,
        behavioral_traits: personaConfig.behavioralTraits
      });
      
      this.currentPersona = response.data;
      
      // Initialize WebSocket connection for real-time interaction
      await this.initializeWebSocket();
      
      return this.currentPersona;
      
    } catch (error) {
      console.error('Anam Avatar Initialization Error:', error);
      throw new Error(`Failed to initialize avatar: ${error.message}`);
    }
  }

  getPersonaConfig(personaType) {
    const configs = {
      'senior_strategic_advisor': {
        name: 'Unhinged Colleague',
        description: 'Strategic challenger who pushes your thinking and questions assumptions',
        appearance: {
          avatar_id: 'executive_male_confident', // Anam stock avatar - confident executive
          clothing: 'business_casual_sharp',
          background: 'modern_office_blur',
          lighting: 'professional_warm'
        },
        voiceSettings: {
          tone: 'challenging_but_constructive',
          pace: 'measured_with_emphasis',
          emphasis: 'high_on_key_points',
          clarity: 'maximum'
        },
        behavioralTraits: {
          eye_contact: 'intense_direct',
          gestures: 'emphatic_strategic',
          posture: 'forward_leaning_engaged',
          expressions: 'questioning_skeptical',
          personality_traits: [
            'optimization_obsessed',
            'moonshot_mindset', 
            'agency_focused',
            'anti_consensus'
          ]
        }
      },
      'provocative_coach': {
        name: 'Unhinged Challenger',
        description: 'Provocative coach who pushes boundaries',
        appearance: {
          avatar_id: 'executive_female_2',
          clothing: 'business_casual_edgy',
          background: 'office_startup',
          lighting: 'dynamic'
        },
        voiceSettings: {
          tone: 'provocative',
          pace: 'varied',
          emphasis: 'very_high',
          clarity: 'maximum'
        },
        behavioralTraits: {
          eye_contact: 'intense',
          gestures: 'emphatic',
          posture: 'forward_leaning',
          expressions: 'skeptical'
        }
      }
    };
    
    return configs[personaType] || configs['senior_strategic_advisor'];
  }

  async initializeWebSocket() {
    try {
      if (this.websocket) {
        this.websocket.close();
      }
      
      this.websocket = new WebSocket(`${this.streamURL}?persona_id=${this.currentPersona.id}`);
      
      return new Promise((resolve, reject) => {
        this.websocket.on('open', () => {
          console.log('Anam WebSocket connected');
          this.isConnected = true;
          resolve();
        });
        
        this.websocket.on('message', (data) => {
          this.handleWebSocketMessage(JSON.parse(data.toString()));
        });
        
        this.websocket.on('error', (error) => {
          console.error('Anam WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        });
        
        this.websocket.on('close', () => {
          console.log('Anam WebSocket disconnected');
          this.isConnected = false;
        });
      });
      
    } catch (error) {
      console.error('Anam WebSocket Initialization Error:', error);
      throw error;
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'avatar_ready':
        console.log('Avatar is ready for interaction');
        break;
      case 'speech_complete':
        console.log('Avatar finished speaking');
        break;
      case 'expression_change':
        console.log('Avatar expression changed:', message.expression);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  async deliverResponse(audioStream, emotion = 'challenging', facialExpression = null) {
    try {
      if (!this.isConnected) {
        throw new Error('Anam WebSocket not connected');
      }
      
      // Prepare the delivery payload
      const deliveryPayload = {
        type: 'deliver_speech',
        persona_id: this.currentPersona.id,
        audio_data: audioStream.audioBuffer.toString('base64'),
        audio_format: audioStream.format,
        emotion: emotion,
        facial_expression: facialExpression || this.mapEmotionToExpression(emotion),
        lip_sync: true,
        real_time: true
      };
      
      // Send to avatar for delivery
      this.websocket.send(JSON.stringify(deliveryPayload));
      
      // Return delivery confirmation
      return {
        status: 'delivered',
        persona_id: this.currentPersona.id,
        emotion: emotion,
        facial_expression: deliveryPayload.facial_expression,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Anam Delivery Error:', error);
      throw new Error(`Failed to deliver response through avatar: ${error.message}`);
    }
  }

  mapEmotionToExpression(emotion) {
    const expressionMap = {
      'challenging': 'skeptical_raised_eyebrow',
      'provocative': 'stern_questioning',
      'analytical': 'thoughtful_focused',
      'decisive': 'confident_assertive',
      'disappointed': 'disapproving_head_shake',
      'impressed': 'approving_nod'
    };
    
    return expressionMap[emotion] || 'neutral_professional';
  }

  async updatePersonaExpression(expression, duration = 3000) {
    try {
      if (!this.isConnected) {
        throw new Error('Anam WebSocket not connected');
      }
      
      const expressionPayload = {
        type: 'set_expression',
        persona_id: this.currentPersona.id,
        expression: expression,
        duration: duration,
        transition: 'smooth'
      };
      
      this.websocket.send(JSON.stringify(expressionPayload));
      
      return { status: 'expression_updated', expression, duration };
      
    } catch (error) {
      console.error('Anam Expression Update Error:', error);
      throw error;
    }
  }

  async sendSystemMessage(message, displayDuration = 5000) {
    try {
      const systemPayload = {
        type: 'system_message',
        persona_id: this.currentPersona.id,
        message: message,
        display_duration: displayDuration,
        style: 'overlay_text'
      };
      
      this.websocket.send(JSON.stringify(systemPayload));
      
      return { status: 'message_sent', message };
      
    } catch (error) {
      console.error('Anam System Message Error:', error);
      throw error;
    }
  }

  async getPersonaStats() {
    try {
      const response = await this.client.get(`/personas/${this.currentPersona.id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Anam Stats Error:', error);
      throw error;
    }
  }

  async createCustomAvatar(config) {
    try {
      const response = await this.client.post('/avatars/custom', {
        name: config.name,
        description: config.description,
        base_avatar: config.baseAvatar,
        customizations: config.customizations,
        voice_profile: config.voiceProfile
      });
      
      return response.data;
    } catch (error) {
      console.error('Anam Custom Avatar Error:', error);
      throw error;
    }
  }

  async startConversation(sessionId) {
    try {
      if (!this.isConnected) {
        await this.initializeWebSocket();
      }
      
      const startPayload = {
        type: 'start_conversation',
        persona_id: this.currentPersona.id,
        session_id: sessionId,
        conversation_mode: 'strategic_challenge',
        auto_lip_sync: true,
        real_time_processing: true
      };
      
      this.websocket.send(JSON.stringify(startPayload));
      
      return { status: 'conversation_started', session_id: sessionId };
      
    } catch (error) {
      console.error('Anam Conversation Start Error:', error);
      throw error;
    }
  }

  async endConversation(sessionId) {
    try {
      const endPayload = {
        type: 'end_conversation',
        persona_id: this.currentPersona.id,
        session_id: sessionId
      };
      
      if (this.isConnected) {
        this.websocket.send(JSON.stringify(endPayload));
      }
      
      return { status: 'conversation_ended', session_id: sessionId };
      
    } catch (error) {
      console.error('Anam Conversation End Error:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.websocket && this.isConnected) {
        this.websocket.close();
      }
      
      this.currentPersona = null;
      this.isConnected = false;
      
    } catch (error) {
      console.error('Anam Cleanup Error:', error);
      // Don't throw - cleanup should be graceful
    }
  }
}