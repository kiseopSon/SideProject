const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/store.db');

const db = new Database(dbPath);

module.exports = db;
