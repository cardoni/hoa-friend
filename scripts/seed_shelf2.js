#!/usr/bin/env node
// Seeds the second photographed shelf (row 2 from the top), transcribed
// left to right from a head-on photo. Same modeling as shelf 1: standing
// books are vertical, the center pile is a single position laid flat
// (bottom -> top), and a couple of flat books rest on top of the right run.
//
// Data only, no network. Run `node scripts/cli.js enrich` afterwards for
// covers. Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Shelf 2 (photo 2) — philosophy, business & misc';
const SHELF_POSITION = 2;

const layout = [
  { position: 1, o: 'vertical', w: 1.8, title: "West's Business Law", author: 'Clarkson, Miller, Jentz & Cross' },
  {
    position: 2,
    stack: [
      { o: 'vertical', w: 0.9, title: 'Roots of Wisdom', author: 'Helen Buss Mitchell' },
      { o: 'horizontal', w: 0.7, title: 'Small brown box', pending: true,
        note: 'Small reddish-brown box/slipcase resting on top; contents/title not legible' },
    ],
  },
  { position: 3, o: 'vertical', w: 1.0, title: 'A Historical Introduction to Philosophy', author: 'Albert B. Hakim' },
  { position: 4, o: 'vertical', w: 1.0, title: 'The Republic', author: 'Plato (trans. Allan Bloom)' },
  { position: 5, o: 'vertical', w: 0.9, title: 'Give Me a Break', author: 'John Stossel' },
  { position: 6, o: 'vertical', w: 0.8, title: 'Game-Based Marketing', author: 'Gabe Zichermann & Joselin Linder' },
  { position: 7, o: 'vertical', w: 0.9, title: 'Reflections on Philosophy: Introductory Essays', author: 'McHenry & Adams (eds.)' },

  // Center horizontal stack (one slot, laid bottom -> top).
  {
    position: 8,
    stack: [
      { o: 'horizontal', w: 0.9, title: 'Triggers', author: 'Marshall Goldsmith & Mark Reiter' },
      { o: 'horizontal', w: 0.9, title: 'The Making of a Manager', author: 'Julie Zhuo' },
      { o: 'horizontal', w: 0.9, title: 'Getting Things Done', author: 'David Allen' },
      { o: 'horizontal', w: 0.9, title: 'Questions That Matter (Introduction to Philosophy)', pending: true,
        note: 'Grey spine in the stack reads "Questions That Ma..."; exact title/author unconfirmed' },
      { o: 'horizontal', w: 1.0, title: 'Sprint', author: 'Knapp, Zeratsky & Kowitz' },
      { o: 'horizontal', w: 0.9, title: 'Turn the Ship Around!', author: 'L. David Marquet' },
      { o: 'horizontal', w: 0.7, title: 'Poetics', author: 'Aristotle' },
      { o: 'horizontal', w: 0.7, title: 'The Last Days of Socrates', author: 'Plato' },
      { o: 'horizontal', w: 0.8, title: 'Five Great Dialogues', author: 'Plato' },
      { o: 'horizontal', w: 0.6, title: 'Pensées', author: 'Blaise Pascal' },
      { o: 'horizontal', w: 0.9, title: 'The Prince', author: 'Niccolò Machiavelli' },
      { o: 'horizontal', w: 1.0, title: 'Epistemology: Contemporary Readings', author: 'Michael Huemer (ed.)' },
    ],
  },

  { position: 9, o: 'vertical', w: 1.0, title: 'The Infidel and the Professor', author: 'Dennis C. Rasmussen' },
  { position: 10, o: 'vertical', w: 0.9, title: 'Fifty Readings in Philosophy', author: 'Donald C. Abel' },
  { position: 11,
    stack: [
      { o: 'vertical', w: 1.0, title: 'Classic Philosophical Questions', author: 'Gould & Mulvaney' },
      { o: 'horizontal', w: 1.1, title: 'Twelve Steps and Twelve Traditions', author: 'Alcoholics Anonymous' },
    ],
  },
  { position: 12,
    stack: [
      { o: 'vertical', w: 0.9, title: 'Hooked', author: 'Nir Eyal' },
      { o: 'horizontal', w: 1.1, title: '101 Dog Tricks', author: 'Kyra Sundance' },
    ],
  },
  { position: 13, o: 'vertical', w: 0.8, title: 'The Case for Animal Rights', author: 'Tom Regan' },
  { position: 14, o: 'vertical', w: 0.6, title: 'The Problems of Philosophy', author: 'Bertrand Russell' },
  { position: 15, o: 'vertical', w: 0.8, title: 'Why Do Men Have Nipples?', author: 'Mark Leyner & Billy Goldberg' },
  { position: 16, o: 'vertical', w: 0.7, title: 'Ultimate Dinosaur Dance-Off', pending: false,
    note: 'Red spine read as "Ultimate Dinosaur Dance-Off" — worth confirming' },
  { position: 17, o: 'vertical', w: 0.8, title: 'Nineteen Eighty-Four', author: 'George Orwell' },
  { position: 18, o: 'vertical', w: 0.7, title: 'The Mortuary Monster', author: 'Andrew J. Stone' },
  { position: 19, o: 'vertical', w: 0.7, title: 'All Hail the House Gods', author: 'Andrew J. Stone' },
  { position: 20, o: 'vertical', w: 0.8, title: 'You Decide! Current Debates in Introductory Philosophy', author: 'Bruce N. Waller' },
  { position: 21, o: 'vertical', w: 1.0, title: 'Discovering Philosophy', author: 'Thomas I. White' },
  { position: 22, o: 'vertical', w: 1.1, title: 'Morality in Practice', author: 'James P. Sterba' },
  { position: 23, o: 'vertical', w: 0.9, title: 'White book (turned spine-in)', pending: true,
    note: 'Pale book at right end shelved with pages facing out, red text on edge; title not visible' },
  { position: 24, o: 'vertical', w: 1.0, title: 'Decorative stone (decor)', author: null,
    note: 'Grey heart-shaped stone sitting on the shelf — not a book' },
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
  .prepare('INSERT INTO shelves (name, position) VALUES (?, ?)')
  .run(SHELF_NAME, SHELF_POSITION).lastInsertRowid;

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
