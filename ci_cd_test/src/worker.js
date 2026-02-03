const { orderQueue, batchQueue } = require('./services/queue');
const db = require('./db/database');
const { invalidateProduct } = require('./services/cache');

// 주문 처리 워커: 재고 차감, 주문 상태 업데이트
orderQueue.process(async (job) => {
  const { orderId, items } = job.data;
  console.log(`[Worker] 주문 처리 시작: #${orderId}`);

  try {
    const conn = db;
    for (const item of items) {
      conn.prepare(
        'UPDATE products SET stock = stock - ? WHERE id = ?'
      ).run(item.quantity, item.productId);
      await invalidateProduct(item.productId);
    }
    conn.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', orderId);
    console.log(`[Worker] 주문 #${orderId} 처리 완료`);
    return { orderId, status: 'completed' };
  } catch (err) {
    console.error(`[Worker] 주문 #${orderId} 실패:`, err);
    throw err;
  }
});

// 배치 워커: 일일 리포트 생성 (시뮬레이션)
batchQueue.process(async (job) => {
  const { type } = job.data;
  console.log(`[Worker] 배치 작업 시작: ${type}`);

  if (type === 'daily_report') {
    const orders = db.prepare(
      `SELECT * FROM orders WHERE date(created_at) = date('now', 'localtime')`
    ).all();
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const report = {
      date: new Date().toISOString().slice(0, 10),
      orderCount: orders.length,
      totalSales,
      generatedAt: new Date().toISOString(),
    };
    console.log('[Worker] 일일 리포트:', report);
    return report;
  }
});

orderQueue.on('completed', (job, result) => {
  console.log(`[Queue] 주문 #${job.data.orderId} 완료`);
});

orderQueue.on('failed', (job, err) => {
  console.error(`[Queue] 주문 #${job?.data?.orderId} 실패:`, err.message);
});

batchQueue.on('completed', (job, result) => {
  console.log('[Queue] 배치 작업 완료:', result);
});

console.log('Worker 시작 - 주문 큐, 배치 큐 대기 중');
