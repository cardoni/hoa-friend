#!/usr/bin/env node
// Bookcase 2, Shelf 1 (top row). Transcribed left to right from the upper
// of the two shelves in photo 7 (read after EXIF-correcting the image to
// portrait). All standing books, with Paint by Sticker lying flat on top.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Bookcase 2 · Shelf 1 (photo 7, top) — self-help & skepticism';
const BOOKCASE = 2;
const SHELF_POSITION = 1;

const layout = [
  { position: 1, o: 'vertical', w: 0.9, title: 'Scientific Inquiry', author: 'Robert Klee' },
  { position: 2, o: 'vertical', w: 0.8, title: 'Why People Believe Weird Things', author: 'Michael Shermer' },
  { position: 3, o: 'vertical', w: 0.8, title: 'Nonviolent Communication', author: 'Marshall B. Rosenberg' },
  { position: 4, o: 'vertical', w: 0.8, title: 'The Higher Law', author: 'Henry David Thoreau' },
  { position: 5, o: 'vertical', w: 0.9, title: 'Leading with My Chin', author: 'Jay Leno' },
  { position: 6, o: 'vertical', w: 0.9, title: 'How Would You Move Mount Fuji?', author: 'William Poundstone' },
  { position: 7, o: 'vertical', w: 0.6, title: 'The Worst-Case Scenario Survival Handbook', author: 'Piven & Borgenicht' },
  { position: 8, o: 'vertical', w: 0.8, title: 'The User Illusion', author: 'Tor Nørretranders' },
  { position: 9, o: 'vertical', w: 0.8, title: "What Got You Here Won't Get You There", author: 'Marshall Goldsmith' },
  { position: 10, o: 'vertical', w: 0.9, title: 'Creativity, Inc.', author: 'Ed Catmull' },
  { position: 11, o: 'vertical', w: 0.8, title: 'Do More Faster', author: 'David Cohen & Brad Feld' },
  { position: 12, o: 'vertical', w: 0.9, title: 'Self-Coaching', author: 'Joseph J. Luciani' },
  { position: 13, o: 'vertical', w: 0.9, title: 'Addicted to Unhappiness', author: 'Pieper & Pieper' },
  { position: 14, o: 'vertical', w: 0.8, title: 'Seven Choices', author: 'Elizabeth Harper Neeld' },
  {
    position: 15,
    stack: [
      { o: 'vertical', w: 1.0, title: "What They Still Don't Teach You at Harvard Business School", author: 'Mark H. McCormack' },
      { o: 'horizontal', w: 1.1, title: 'Paint by Sticker', author: 'Workman' },
    ],
  },
];

function insertBook(shelfId, position, stackOrder, b) {
  db.prepare(
    `INSERT INTO books
       (shelf_id, position, stack_order, orientation, title, author, isbn, cover_url, spine_color, width_ratio, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    shelfId, position, stackOrder, b.o, b.title, b.author ?? null, null, null,
    spineColorFor(b.title), b.w ?? 1.0, b.pending ? 'pending_isbn' : 'identified', b.note ?? null
  );
}

const existing = db.prepare('SELECT id FROM shelves WHERE name = ?').get(SHELF_NAME);
if (existing) {
  db.prepare('DELETE FROM books WHERE shelf_id = ?').run(existing.id);
  db.prepare('DELETE FROM shelves WHERE id = ?').run(existing.id);
}

const shelfId = db
  .prepare('INSERT INTO shelves (name, bookcase, position) VALUES (?, ?, ?)')
  .run(SHELF_NAME, BOOKCASE, SHELF_POSITION).lastInsertRowid;

let count = 0;
for (const entry of layout) {
  if (entry.stack) {
    entry.stack.forEach((b, i) => { insertBook(shelfId, entry.position, i, b); count++; });
  } else {
    insertBook(shelfId, entry.position, 0, entry); count++;
  }
}

const pending = db
  .prepare("SELECT COUNT(*) AS c FROM books WHERE shelf_id = ? AND status = 'pending_isbn'")
  .get(shelfId).c;

console.log(`Seeded "${SHELF_NAME}" (shelf id ${shelfId}) with ${count} items, ${pending} pending identification.`);
