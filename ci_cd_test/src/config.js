module.exports = {
  port: process.env.PORT || 3000,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5분
  },
  dbPath: process.env.DB_PATH || './data/store.db',
};
