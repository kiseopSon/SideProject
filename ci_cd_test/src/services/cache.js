const { get, set, del, delPattern, redis } = require('./redis');

async function cacheOrFetch(key, fetchFn, ttl) {
  const cached = await get(key);
  if (cached !== null) return { data: cached, fromCache: true };
  const data = await fetchFn();
  await set(key, data, ttl);
  return { data, fromCache: false };
}

async function getCacheKeys() {
  const keys = await redis.keys('ecom:product*');
  return keys.map((k) => k.replace('ecom:', ''));
}

function invalidateProducts() {
  // products:list, product:1, product:2 등 모두 무효화
  return delPattern('product*');
}

function invalidateProduct(id) {
  return del(`product:${id}`);
}

module.exports = { cacheOrFetch, getCacheKeys, invalidateProducts, invalidateProduct };
