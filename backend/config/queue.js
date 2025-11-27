const Queue = require('bull');
const config = require('./config');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

// Create queues
const encodingQueue = new Queue('audio-encoding', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

const emailQueue = new Queue('email', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true
  }
});

const cleanupQueue = new Queue('cleanup', {
  redis: redisConfig,
  defaultJobOptions: {
    repeat: {
      every: 24 * 60 * 60 * 1000 // Daily
    }
  }
});

const supportQueue = new Queue('support', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

module.exports = {
  encodingQueue,
  emailQueue,
  cleanupQueue,
  supportQueue
};

