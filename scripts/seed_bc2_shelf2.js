#!/usr/bin/env node
// Bookcase 2, Shelf 2 (second row from top). Transcribed left to right
// from the lower of the two shelves in photo 7. Left side is a short
// vertical run; the right side is a horizontal stack laid bottom -> top.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Bookcase 2 · Shelf 2 (photo 7, lower) — philosophy & science';
const BOOKCASE = 2;
const SHELF_POSITION = 2;

const layout = [
  { position: 1, o: 'vertical', w: 0.8, title: 'Aristotle: Nicomachean Ethics', author: 'Broadie & Rowe (Oxford)' },
  {
    position: 2,
    stack: [
      { o: 'vertical', w: 1.0, title: 'Meeting the Shadow', author: 'Zweig & Abrams' },
      { o: 'horizontal', w: 0.9, title: 'Black box / case (decor)', author: null,
        note: 'Black box or case resting on top — not a book' },
    ],
  },
  {
    position: 3,
    stack: [
      { o: 'vertical', w: 1.6, title: "The Complete Software Developer's Career Guide", author: 'John Sonmez' },
      { o: 'horizontal', w: 0.8, title: 'Wooden wedge bookend (decor)', author: null,
        note: 'Wooden wedge/bookend — not a book' },
    ],
  },
  { position: 4, o: 'vertical', w: 0.5, title: 'Outdoor cooking guidebook (reads "...to Outdoor Cooking")', pending: true,
    note: 'Thin book wedged between the standing books and the stack; full title not legible' },

  // Right horizontal stack (one slot, laid bottom -> top).
  {
    position: 5,
    stack: [
      { o: 'horizontal', w: 0.7, title: "why's (poignant) guide to Ruby", author: 'why the lucky stiff' },
      { o: 'horizontal', w: 0.9, title: 'I Am America (And So Can You!)', author: 'Stephen Colbert' },
      { o: 'horizontal', w: 1.0, title: 'Seven Masterpieces of Philosophy', author: 'Steven M. Cahn (ed.)' },
      { o: 'horizontal', w: 0.9, title: 'Moral Minds', author: 'Marc D. Hauser',
        note: 'Also read on bookcase 1 shelf 4 — possible duplicate copy; confirm' },
      { o: 'horizontal', w: 1.1, title: 'A Theory of Justice (Revised ed.)', author: 'John Rawls' },
      { o: 'horizontal', w: 0.9, title: 'Rethinking Intuition', author: 'DePaul & Ramsey (eds.)' },
      { o: 'horizontal', w: 0.9, title: 'The Believing Brain', author: 'Michael Shermer' },
      { o: 'horizontal', w: 0.9, title: "A Thinker's Guide to the Philosophy of Religion", author: 'Stairs & Bernard' },
      { o: 'horizontal', w: 0.9, title: 'The Blind Watchmaker', author: 'Richard Dawkins' },
      { o: 'horizontal', w: 0.9, title: 'The Mating Mind', author: 'Geoffrey Miller' },
      { o: 'horizontal', w: 0.7, title: 'Thin red book / loose papers (on top)', pending: true,
        note: 'Thin red book and/or loose papers resting on top of the stack; not identifiable' },
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
