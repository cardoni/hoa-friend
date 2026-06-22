#!/usr/bin/env node
// Bookcase 2, Shelf 3 (third row). Transcribed left to right from the
// upper of the two shelves in photo 8 (EXIF-corrected to portrait). All
// standing books, with On Bullshit, Pocket Partner and Pocket Ref lying
// flat on top.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Bookcase 2 · Shelf 3 (photo 8, top) — ethics, business & philosophy';
const BOOKCASE = 2;
const SHELF_POSITION = 3;

const layout = [
  { position: 1, o: 'vertical', w: 0.9, title: 'Ethics for Life (2nd ed.)', author: 'Judith Boss' },
  { position: 2, o: 'vertical', w: 0.9, title: "Today's Moral Issues (2nd ed.)", author: 'Daniel Bonevac' },
  { position: 3, o: 'vertical', w: 0.9, title: 'The Mind of the Market', author: 'Michael Shermer' },
  {
    position: 4,
    stack: [
      { o: 'vertical', w: 1.0, title: 'Reality Check', author: 'Guy Kawasaki' },
      { o: 'horizontal', w: 0.6, title: 'On Bullshit', author: 'Harry G. Frankfurt' },
      { o: 'horizontal', w: 0.7, title: 'Yellow hardcover (on top)', pending: true,
        note: 'Yellow book lying flat on top near On Bullshit; possibly another Frankfurt title (On Truth?) — unconfirmed' },
    ],
  },
  { position: 5, o: 'vertical', w: 0.5, title: 'To Do, Doing, Done!', author: 'G. Lynne Snead & Joyce Wycoff' },
  { position: 6, o: 'vertical', w: 0.9, title: "You Mean I'm Not Lazy, Stupid or Crazy?!", author: 'Kate Kelly & Peggy Ramundo' },
  { position: 7, o: 'vertical', w: 1.0, title: 'Major Works', author: 'Ludwig Wittgenstein' },
  { position: 8, o: 'vertical', w: 0.8, title: 'How to Win Friends & Influence People', author: 'Dale Carnegie' },
  { position: 9, o: 'vertical', w: 0.9, title: 'Neuro-linguistic Programming for Dummies', author: 'Romilla Ready & Kate Burton' },
  { position: 10, o: 'vertical', w: 0.8, title: 'Strangers to Ourselves', author: 'Timothy D. Wilson' },
  { position: 11, o: 'vertical', w: 0.8, title: 'Rework', author: 'Jason Fried & David Heinemeier Hansson' },
  {
    position: 12,
    stack: [
      { o: 'vertical', w: 1.0, title: 'The Lean Startup', author: 'Eric Ries' },
      { o: 'horizontal', w: 0.8, title: 'Pocket Partner (3rd ed.)', author: null },
      { o: 'horizontal', w: 0.8, title: 'Pocket Ref (3rd ed.)', author: 'Thomas J. Glover' },
    ],
  },
  { position: 13, o: 'vertical', w: 0.8, title: 'Fierce Leadership', author: 'Susan Scott' },
  { position: 14, o: 'vertical', w: 0.8, title: 'An Introduction to the Philosophy of Language', author: 'Michael Morris' },
  { position: 15, o: 'vertical', w: 1.0, title: 'Introducing Philosophy (8th ed.)', author: 'Robert C. Solomon' },
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
