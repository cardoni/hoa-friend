#!/usr/bin/env node
// Bookcase 2, Shelf 5 (fifth row). Transcribed left to right from the
// upper of the two shelves in photo 9 (EXIF-corrected). A left vertical
// run (yearbooks, logic, writing) and a right horizontal stack laid
// bottom -> top.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Bookcase 2 · Shelf 5 (photo 9, top) — yearbooks, logic & classics';
const BOOKCASE = 2;
const SHELF_POSITION = 5;

const layout = [
  { position: 1, o: 'vertical', w: 0.6, title: 'Red binder', pending: true,
    note: 'Plain red binder/book at the left end; no spine text visible' },
  { position: 2, o: 'vertical', w: 0.9, title: 'Los Cerritos Middle School Yearbook 2008', author: null },
  { position: 3, o: 'vertical', w: 0.9, title: 'Los Cerritos Yearbook 1999', author: null },
  { position: 4, o: 'vertical', w: 0.8, title: 'Speeches That Changed the World', author: 'Quercus' },
  { position: 5, o: 'vertical', w: 0.7, title: "The Philosophy Student's Writer's Manual", author: 'Graybosch, Scott & Garrison' },
  { position: 6, o: 'vertical', w: 0.8, title: 'A Logic Book: Fundamentals of Reasoning', author: 'Robert M. Johnson' },
  { position: 7, o: 'vertical', w: 0.8, title: 'The Dance of Anger', author: 'Harriet Lerner' },

  // Right horizontal stack (one slot, laid bottom -> top).
  {
    position: 8,
    stack: [
      { o: 'horizontal', w: 0.9, title: 'Breaking the Spell: Religion as a Natural Phenomenon', author: 'Daniel C. Dennett' },
      { o: 'horizontal', w: 0.8, title: 'Delivering Happiness', author: 'Tony Hsieh',
        note: 'Also on bookcase 1 shelf 3 — possible duplicate copy; confirm' },
      { o: 'horizontal', w: 0.9, title: 'Story Sense', author: 'Paul Lucey' },
      { o: 'horizontal', w: 0.8, title: 'Leviathan', author: 'Thomas Hobbes (Hackett)' },
      { o: 'horizontal', w: 0.9, title: 'Justice', author: 'Michael J. Sandel' },
      { o: 'horizontal', w: 0.9, title: "Don't Know Much About the Bible", author: 'Kenneth C. Davis' },
      { o: 'horizontal', w: 0.9, title: 'Getting Things Done', author: 'David Allen',
        note: 'Also on bookcase 1 shelf 2 — possible duplicate copy; confirm' },
      { o: 'horizontal', w: 0.8, title: 'Doublespeak', author: 'William Lutz' },
      { o: 'horizontal', w: 1.0, title: 'The Origin of Species & The Voyage of the Beagle', author: 'Charles Darwin' },
      { o: 'horizontal', w: 0.9, title: 'Mythology', author: 'Edith Hamilton' },
      { o: 'horizontal', w: 0.9, title: 'Bluetooth speaker (decor)', author: null,
        note: 'Small speaker sitting on top of the stack — not a book' },
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
