const Bull = require('bull');
const config = require('../config');

const redisOpt = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

const orderQueue = new Bull('orders', {
  redis: redisOpt,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
  },
});

const batchQueue = new Bull('batch', {
  redis: redisOpt,
  defaultJobOptions: {
    removeOnComplete: 50,
  },
});

module.exports = { orderQueue, batchQueue };
