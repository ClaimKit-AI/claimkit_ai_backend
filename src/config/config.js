require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-pro',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-coder',
    },
    claimkit: {
      baseUrl: process.env.CLAIMKIT_API_BASE_URL || 'https://stingray-app-hnhkb.ondigitalocean.app',
      timeout: parseInt(process.env.CLAIMKIT_API_TIMEOUT) || 60000,
      maxRetries: parseInt(process.env.CLAIMKIT_API_MAX_RETRIES) || 3,
      defaultModel: process.env.CLAIMKIT_API_DEFAULT_MODEL || 'chatgpt-4o-latest',
    },
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/claimkit_ai',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  },
};

module.exports = config; 