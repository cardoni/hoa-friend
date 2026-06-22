#!/usr/bin/env node
// Bookcase 2, Shelf 4 (fourth row). Transcribed left to right from the
// lower of the two shelves in photo 8. All standing books, with a brown
// leather classic lying flat on top at the left end.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Bookcase 2 · Shelf 4 (photo 8, lower) — philosophy of religion & reference';
const BOOKCASE = 2;
const SHELF_POSITION = 4;

const layout = [
  {
    position: 1,
    stack: [
      { o: 'vertical', w: 0.9, title: 'Philosophy of Religion: A Guide and Anthology', author: 'Brian Davies (Oxford)' },
      { o: 'horizontal', w: 1.0, title: 'Brown leather classic (on top)', pending: true,
        note: 'Leather-bound book with gold detailing lying flat on top; spine not legible' },
    ],
  },
  { position: 2, o: 'vertical', w: 0.9, title: 'The Art of Intrusion', author: 'Kevin Mitnick & William Simon' },
  { position: 3, o: 'vertical', w: 0.8, title: 'Not Taco Bell Material', author: 'Adam Carolla' },
  { position: 4, o: 'vertical', w: 1.0, title: 'Houdini!!!', author: 'Kenneth Silverman' },
  { position: 5, o: 'vertical', w: 1.0, title: 'Philosophy of Religion: Selected Readings', author: 'Peterson, Hasker, Reichenbach & Basinger (Oxford)' },
  { position: 6, o: 'vertical', w: 0.9, title: 'The Catholic Youth Bible (NRSV Catholic Edition)', author: "Saint Mary's Press" },
  { position: 7, o: 'vertical', w: 0.8, title: 'God: The Failed Hypothesis', author: 'Victor J. Stenger' },
  { position: 8, o: 'vertical', w: 0.8, title: 'Six Impossible Things Before Breakfast', author: 'Lewis Wolpert' },
  { position: 9, o: 'vertical', w: 0.9, title: "The Reader's Digest Illustrated Tool Book", author: null },
  { position: 10, o: 'vertical', w: 1.0, title: 'Law and Society (8th ed.)', author: 'Steven Vago' },
  { position: 11, o: 'vertical', w: 0.9, title: 'The Associated Press Stylebook', author: 'Associated Press' },
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
