#!/usr/bin/env node
// Seeds the first photographed shelf into the database, transcribed from a
// head-on photo, left to right, preserving real orientation and the two
// horizontal groupings (books lying flat on top of the standing run, and
// the big flat stack in the center-right).
//
// Inserts data only -- no network. Run `node scripts/cli.js enrich`
// afterwards (with internet access) to pull cover art by title.
//
// Re-running replaces this shelf's books, so it's safe to tweak and rerun.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Shelf 1 (photo 1) — philosophy, Harry Potter & magic';

// Each entry: position (left->right), then either a single book or a stack.
// orientation: 'vertical' (standing) | 'horizontal' (lying flat).
// stack: array laid bottom -> top within one position (stack_order ascending).
// pending: true => unidentified, gets a "?" badge until a barcode resolves it.
const layout = [
  {
    position: 1,
    stack: [
      { o: 'vertical', w: 1.6, title: 'Unidentified blue book', pending: true,
        note: 'Tall blue hardcover behind the Zappos book; title obscured (reads "...OPEN... SPIRIT... LE... BRA...")' },
      { o: 'horizontal', w: 1.2, title: 'Zappos.com 2010 Culture Book', author: 'Zappos' },
    ],
  },
  { position: 2, o: 'vertical', w: 0.7, title: 'Debunking 9/11 Myths', author: 'Popular Mechanics' },
  {
    position: 3,
    stack: [
      { o: 'vertical', w: 0.7, title: 'A Discourse on Inequality', author: 'Jean-Jacques Rousseau' },
      { o: 'horizontal', w: 1.3, title: 'Comedy Writing Secrets', author: 'Mel Helitzer' },
    ],
  },
  {
    position: 4,
    stack: [
      { o: 'vertical', w: 1.8, title: 'The Stuff of Thought', author: 'Steven Pinker' },
      { o: 'horizontal', w: 1.3, title: 'Unfu*k Yourself', author: 'Gary John Bishop' },
    ],
  },
  { position: 5, o: 'vertical', w: 1.0, title: 'The End of Faith', author: 'Sam Harris' },
  { position: 6, o: 'vertical', w: 0.8, title: 'The Twilight of Atheism', author: 'Alister McGrath' },
  { position: 7, o: 'vertical', w: 0.9, title: 'The Language of God', author: 'Francis Collins' },
  { position: 8, o: 'vertical', w: 1.0, title: 'Atheist Manifesto', author: 'Michel Onfray' },
  { position: 9, o: 'vertical', w: 1.4, title: 'Harry Potter and the Order of the Phoenix', author: 'J.K. Rowling' },
  { position: 10, o: 'vertical', w: 1.3, title: 'Harry Potter and the Half-Blood Prince', author: 'J.K. Rowling' },
  {
    position: 11,
    stack: [
      { o: 'vertical', w: 0.7, title: 'Perspectives in the Philosophy of Language', author: 'Robert Stainton (ed.)' },
      { o: 'horizontal', w: 1.1, title: 'Fahrenheit 451', author: 'Ray Bradbury' },
    ],
  },
  { position: 12, o: 'vertical', w: 0.8, title: 'Jazz Anecdotes: Second Time Around', author: 'Bill Crow' },
  { position: 13, o: 'vertical', w: 0.7, title: 'Foundations of Critical Thinking', author: 'Jones' },
  { position: 14, o: 'vertical', w: 1.4, title: 'Harry Potter and the Goblet of Fire', author: 'J.K. Rowling' },

  // Center-right horizontal stack (one slot, laid bottom -> top).
  {
    position: 15,
    stack: [
      { o: 'horizontal', w: 1.1, title: 'Language, Proof and Logic', author: 'Barwise & Etchemendy' },
      { o: 'horizontal', w: 1.0, title: 'Spiral-bound black workbook', pending: true,
        note: 'Wire-o bound black book in the stack; no readable spine text' },
      { o: 'horizontal', w: 0.9, title: 'Me of Little Faith', author: 'Lewis Black' },
      { o: 'horizontal', w: 0.9, title: 'Why Darwin Matters', author: 'Michael Shermer' },
      { o: 'horizontal', w: 0.9, title: "Descartes' Error", author: 'Antonio Damasio' },
      { o: 'horizontal', w: 1.2, title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky' },
      { o: 'horizontal', w: 0.9, title: 'Your Handbook of Everyday Law', author: 'George Gordon Coughlin, Jr.' },
      { o: 'horizontal', w: 0.8, title: 'Letter to a Christian Nation', author: 'Sam Harris' },
      { o: 'horizontal', w: 1.0, title: 'Wooden', author: 'John Wooden with Steve Jamison' },
      { o: 'horizontal', w: 1.0, title: 'Brown leather classic', pending: true,
        note: 'Brown leather-bound book with gold lettering near top of stack; title not legible' },
      { o: 'horizontal', w: 0.9, title: 'White/cream book', pending: true,
        note: 'Pale cream/white book on top of the stack; spine not legible' },
    ],
  },

  { position: 16, o: 'vertical', w: 1.2, title: 'Muppet plush (decor)', author: null,
    note: 'Decorative stuffed Muppet sitting on the shelf — not a book' },
  { position: 17, o: 'vertical', w: 0.7, title: 'The Chick Corea Elektrik Band (songbook)', author: 'Chick Corea' },
  { position: 18, o: 'vertical', w: 0.8, title: "Penn & Teller's magic book", pending: true,
    note: 'Yellow Penn & Teller book; exact title not legible (reads "...MAGIC ... Cox")' },
  { position: 19, o: 'vertical', w: 0.9, title: 'Curb Your Enthusiasm: The Complete Third Season (DVD)', author: 'HBO' },
  { position: 20, o: 'vertical', w: 0.8, title: 'Never Let Me Go', author: 'Kazuo Ishiguro' },
  { position: 21, o: 'vertical', w: 0.7, title: 'Girl, Interrupted', author: 'Susanna Kaysen' },
  { position: 22, o: 'vertical', w: 0.7, title: 'Did God Use Evolution to Create?', author: 'Chris Choi' },
  {
    position: 23,
    stack: [
      { o: 'vertical', w: 1.0, title: 'Burn Book', author: 'Kara Swisher' },
      { o: 'horizontal', w: 1.1, title: 'Green book (reads "...A OF C...")', pending: true,
        note: 'Green book lying flat on top with playing cards; title not legible' },
    ],
  },
  { position: 24, o: 'vertical', w: 1.6, title: 'The Practical Encyclopedia of Magic', author: 'Nicholas Einhorn' },
];

function insertBook(shelfId, position, stackOrder, b) {
  db.prepare(
    `INSERT INTO books
       (shelf_id, position, stack_order, orientation, title, author, isbn, cover_url, spine_color, width_ratio, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    shelfId,
    position,
    stackOrder,
    b.o,
    b.title,
    b.author ?? null,
    null,
    null,
    spineColorFor(b.title),
    b.w ?? 1.0,
    b.pending ? 'pending_isbn' : 'identified',
    b.note ?? null
  );
}

// Reset this shelf (and only this shelf) so the script is rerunnable.
const existing = db.prepare('SELECT id FROM shelves WHERE name = ?').get(SHELF_NAME);
if (existing) {
  db.prepare('DELETE FROM books WHERE shelf_id = ?').run(existing.id);
  db.prepare('DELETE FROM shelves WHERE id = ?').run(existing.id);
}

const position =
  db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM shelves').get().p;
const shelfId = db
  .prepare('INSERT INTO shelves (name, position) VALUES (?, ?)')
  .run(SHELF_NAME, position).lastInsertRowid;

let count = 0;
for (const entry of layout) {
  if (entry.stack) {
    entry.stack.forEach((b, i) => {
      insertBook(shelfId, entry.position, i, b);
      count++;
    });
  } else {
    insertBook(shelfId, entry.position, 0, entry);
    count++;
  }
}

const pending = db
  .prepare("SELECT COUNT(*) AS c FROM books WHERE shelf_id = ? AND status = 'pending_isbn'")
  .get(shelfId).c;

console.log(`Seeded "${SHELF_NAME}" (shelf id ${shelfId}) with ${count} items, ${pending} pending identification.`);
