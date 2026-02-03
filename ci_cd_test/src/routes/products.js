const express = require('express');
const db = require('../db/database');
const { cacheOrFetch, getCacheKeys, invalidateProducts } = require('../services/cache');
const config = require('../config');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, fromCache } = await cacheOrFetch('products:list', () => {
      return db.prepare('SELECT * FROM products ORDER BY id').all();
    }, config.cache.ttl);
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '상품 목록 조회 실패' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '잘못된 ID' });

  try {
    const { data: product, fromCache } = await cacheOrFetch(`product:${id}`, () => {
      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      return row || null;
    }, config.cache.ttl);

    if (!product) return res.status(404).json({ error: '상품 없음' });
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '상품 조회 실패' });
  }
});

router.post('/cache/invalidate', async (req, res) => {
  try {
    const before = await getCacheKeys();
    await invalidateProducts();
    const after = await getCacheKeys();
    res.json({
      message: '캐시 무효화 완료',
      deletedKeys: before,
      remainingKeys: after,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '캐시 무효화 실패' });
  }
});

router.get('/cache/status', async (req, res) => {
  try {
    const keys = await getCacheKeys();
    res.json({ cachedKeys: keys, count: keys.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '캐시 상태 조회 실패' });
  }
});

module.exports = router;
