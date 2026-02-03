const express = require('express');
const config = require('./config');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
app.use(express.json());

app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
  });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류' });
});

const server = app.listen(config.port, () => {
  console.log(`서버 시작: http://localhost:${config.port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM 수신, 종료 중...');
  server.close(() => process.exit(0));
});
