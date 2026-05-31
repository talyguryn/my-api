export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  auth: {
    bearerToken: process.env.API_BEARER_TOKEN || '',
  },
  cache: {
    driver: process.env.CACHE_DRIVER || 'memory',
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    memcache: {
      servers: (process.env.MEMCACHE_SERVERS || 'localhost:11211').split(','),
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});
