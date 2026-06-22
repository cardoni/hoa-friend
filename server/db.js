const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'bookshelf.sqlite');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS shelves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bookcase INTEGER NOT NULL DEFAULT 1,
    position REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shelf_id INTEGER NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
    position REAL NOT NULL,
    stack_order INTEGER NOT NULL DEFAULT 0,
    orientation TEXT NOT NULL DEFAULT 'vertical' CHECK (orientation IN ('vertical', 'horizontal')),
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    cover_url TEXT,
    spine_color TEXT,
    width_ratio REAL NOT NULL DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'pending_isbn')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf_id, position, stack_order);
`);

// Migration: add shelves.bookcase to databases created before bookcases
// existed (CREATE TABLE IF NOT EXISTS won't alter an existing table).
const shelfCols = db.prepare(`PRAGMA table_info(shelves)`).all();
if (!shelfCols.some((c) => c.name === 'bookcase')) {
  db.exec(`ALTER TABLE shelves ADD COLUMN bookcase INTEGER NOT NULL DEFAULT 1`);
}

module.exports = db;
