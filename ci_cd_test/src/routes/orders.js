const express = require('express');
const db = require('../db/database');
const { orderQueue, batchQueue } = require('../services/queue');

const router = express.Router();

router.post('/', async (req, res) => {
  const { items } = req.body; // [{ productId, quantity }]
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '주문 항목이 필요합니다' });
  }

  try {
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const { productId, quantity } = item;
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
      if (!product) throw new Error(`상품 없음: ${productId}`);
      if (product.stock < quantity) throw new Error(`재고 부족: ${product.name}`);
      total += product.price * quantity;
      orderItems.push({ productId, quantity, price: product.price, name: product.name });
    }

    const result = db.prepare(
      'INSERT INTO orders (items, total, status) VALUES (?, ?, ?)'
    ).run(JSON.stringify(orderItems), total, 'pending');

    const orderId = result.lastInsertRowid;

    await orderQueue.add(
      { orderId, items: orderItems },
      { jobId: orderId }
    );

    res.status(201).json({
      message: '주문 접수됨 (비동기 처리 중)',
      orderId,
      total,
      status: 'processing',
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const orders = db.prepare(
      'SELECT * FROM orders ORDER BY id DESC LIMIT 50'
    ).all();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '주문 목록 조회 실패' });
  }
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '잘못된 ID' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: '주문 없음' });
  res.json(order);
});

router.post('/batch/report', async (req, res) => {
  try {
    const jobId = `batch-report-${Date.now()}`;
    const job = await batchQueue.add({ type: 'daily_report' }, { jobId });
    res.json({ message: '일일 리포트 배치 작업 시작', jobId: job.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '배치 작업 시작 실패' });
  }
});

router.get('/batch/report/status', async (req, res) => {
  try {
    const [latestJob] = await batchQueue.getJobs(['completed', 'active', 'waiting'], 0, 0);
    if (!latestJob) {
      return res.json({ status: 'no_job', message: '아직 배치 작업이 실행된 적 없음' });
    }
    const state = await latestJob.getState();
    const result = {
      jobId: latestJob.id,
      status: state,
      progress: latestJob.progress(),
    };
    if (state === 'completed') {
      result.report = await latestJob.returnvalue;
    } else if (state === 'failed') {
      result.failedReason = latestJob.failedReason;
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '배치 상태 조회 실패' });
  }
});

module.exports = router;
