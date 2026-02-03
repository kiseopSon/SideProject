const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/store.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
`);

// 샘플 데이터
const stmt = db.prepare('SELECT COUNT(*) as cnt FROM products');
if (stmt.get().cnt === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)'
  );
  const products = [
    ['무선 이어폰', 59000, 100],
    ['스마트워치', 129000, 50],
    ['블루투스 스피커', 45000, 80],
    ['휴대용 충전기', 35000, 120],
    ['웹캠 HD', 78000, 30],
  ];
  products.forEach((p) => insert.run(...p));
  console.log('샘플 상품 데이터 생성 완료');
}

console.log('DB 초기화 완료:', dbPath);
db.close();
