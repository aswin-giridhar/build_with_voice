export function validateApiKeys() {
  const requiredKeys = {
    'ELEVENLABS_API_KEY': process.env.ELEVENLABS_API_KEY,
    'SYNTHFLOW_API_KEY': process.env.SYNTHFLOW_API_KEY,
    'ANAM_API_KEY': process.env.ANAM_API_KEY
  };

  const missing = [];
  
  for (const [keyName, keyValue] of Object.entries(requiredKeys)) {
    if (!keyValue || keyValue.trim() === '' || keyValue === `your_${keyName.toLowerCase()}_here`) {
      missing.push(keyName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing or invalid API keys: ${missing.join(', ')}. Please check your .env file.`);
  }

  // Validate key formats
  if (!process.env.ELEVENLABS_API_KEY.startsWith('sk_')) {
    console.warn('Warning: ElevenLabs API key should start with "sk_"');
  }

  return true;
}

export function validateUserInput(input, inputType = 'text') {
  if (!input) {
    throw new Error('Input cannot be empty');
  }

  if (inputType === 'text') {
    if (typeof input !== 'string') {
      throw new Error('Text input must be a string');
    }
    
    if (input.length > 2000) {
      throw new Error('Text input too long (max 2000 characters)');
    }
    
    if (input.trim().length < 3) {
      throw new Error('Text input too short (min 3 characters)');
    }
  }

  if (inputType === 'voice') {
    if (typeof input !== 'string') {
      throw new Error('Voice input must be a base64 encoded string');
    }
    
    // Basic base64 validation
    if (!/^[A-Za-z0-9+/]+=*$/.test(input)) {
      throw new Error('Voice input must be valid base64 encoding');
    }
  }

  return true;
}

export function validateSessionConfig(config) {
  const { userContext = {}, mode, companyData = {} } = config;
  
  const validModes = ['strategy', 'founder', 'exec', 'team'];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
  }

  // Validate user context
  if (userContext.role && typeof userContext.role !== 'string') {
    throw new Error('User role must be a string');
  }

  // Validate company data
  if (companyData.size && !['startup', 'small', 'medium', 'large', 'enterprise'].includes(companyData.size)) {
    console.warn('Warning: Unrecognized company size. Using "startup" as default.');
  }

  return true;
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove potentially harmful characters
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  return sanitized;
}

export function validateEnvironment() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
  }

  // Check if running in development or production
  const env = process.env.NODE_ENV || 'development';
  console.log(`Running in ${env} mode`);

  // Validate required directories exist
  const requiredDirs = ['logs'];
  requiredDirs.forEach(dir => {
    try {
      const fs = require('fs');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (error) {
      console.warn(`Warning: Could not create directory ${dir}:`, error.message);
    }
  });

  return true;
}