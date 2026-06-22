#!/usr/bin/env node
// Bookcase 2, Shelf 6 (sixth/bottom row) -- completes bookcase 2.
// Transcribed left to right from the lower of the two shelves in photo 9.
// All standing books: a tech run flowing into history/philosophy/religion.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Bookcase 2 · Shelf 6 (photo 9, lower) — tech, history & religion';
const BOOKCASE = 2;
const SHELF_POSITION = 6;

const layout = [
  { position: 1, o: 'vertical', w: 0.5, title: 'When Bad Things Happen to Good People', author: 'Harold S. Kushner' },
  { position: 2, o: 'vertical', w: 0.8, title: 'Microservice Architecture', author: 'Nadareishvili, Mitra, McLarty & Amundsen' },
  { position: 3, o: 'vertical', w: 0.8, title: 'Building Microservices', author: 'Sam Newman' },
  { position: 4, o: 'vertical', w: 0.9, title: 'Sails.js in Action', author: 'Mike McNeil & Irl Nathan' },
  { position: 5, o: 'vertical', w: 0.9, title: 'Angel', author: 'Jason Calacanis' },
  { position: 6, o: 'vertical', w: 0.7, title: 'JavaScript: The Good Parts', author: 'Douglas Crockford' },
  { position: 7, o: 'vertical', w: 0.8, title: 'SDN: Software Defined Networks', author: 'Nadeau & Gray' },
  { position: 8, o: 'vertical', w: 0.9, title: 'Hitch-22', author: 'Christopher Hitchens' },
  { position: 9, o: 'vertical', w: 0.9, title: 'Myths, Lies, and Downright Stupidity', author: 'John Stossel' },
  { position: 10, o: 'vertical', w: 0.9, title: 'Guns, Germs, and Steel', author: 'Jared Diamond' },
  { position: 11, o: 'vertical', w: 1.0, title: 'The Better Angels of Our Nature', author: 'Steven Pinker' },
  { position: 12, o: 'vertical', w: 1.0, title: 'The Satanic Verses', author: 'Salman Rushdie' },
  { position: 13, o: 'vertical', w: 0.5, title: 'Night', author: 'Elie Wiesel' },
  { position: 14, o: 'vertical', w: 0.7, title: 'The Muslim Next Door', author: 'Sumbul Ali-Karamali' },
  { position: 15, o: 'vertical', w: 0.8, title: 'Believing God', author: 'Beth Moore' },
  { position: 16, o: 'vertical', w: 0.8, title: 'The Sopranos and Philosophy', author: 'Greene & Vernezze (eds.)' },
  { position: 17, o: 'vertical', w: 0.6, title: 'The Veracity of Torah', author: 'Tal Sessler',
    note: 'Spine read as "The Veracity of Torah / Tal Sessler" — worth confirming' },
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
