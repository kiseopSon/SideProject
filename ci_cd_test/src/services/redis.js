const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('error', (err) => console.error('Redis 연결 오류:', err));
redis.on('connect', () => console.log('Redis 연결됨'));

const CACHE_PREFIX = 'ecom:';
const CACHE_TTL = config.cache.ttl;

async function get(key) {
  const data = await redis.get(CACHE_PREFIX + key);
  return data ? JSON.parse(data) : null;
}

async function set(key, value, ttl = CACHE_TTL) {
  await redis.setex(
    CACHE_PREFIX + key,
    ttl,
    JSON.stringify(value)
  );
}

async function del(key) {
  await redis.del(CACHE_PREFIX + key);
}

async function delPattern(pattern) {
  const keys = await redis.keys(CACHE_PREFIX + pattern);
  if (keys.length) await redis.del(...keys);
}

module.exports = { redis, get, set, del, delPattern };
