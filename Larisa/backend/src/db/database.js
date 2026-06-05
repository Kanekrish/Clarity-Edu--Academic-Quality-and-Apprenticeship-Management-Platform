const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../clarity.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

db.pragma('journal_mode = DELETE');
db.pragma('foreign_keys = ON');

const usersDef = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
if (usersDef && usersDef.sql && !usersDef.sql.includes('ofsted_inspector')) {
  db.exec(`
    ALTER TABLE users RENAME TO users_old;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('programme_lead','academic_staff','coach','employer','ofsted_inspector','system_admin')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO users SELECT * FROM users_old;
    DROP TABLE users_old;
  `);
  console.log('✅ Users table migrated to support 6 roles');
}

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

console.log('✅ Clarity database connected');

module.exports = db;
