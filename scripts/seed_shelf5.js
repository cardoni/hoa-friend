#!/usr/bin/env node
// Seeds the fifth photographed shelf (row 5 from the top), transcribed
// left to right from a head-on photo. A short left run, a center
// horizontal stack (laid bottom -> top), then a long right vertical run
// with The God Delusion and Freud resting flat on top.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Shelf 5 (photo 5) — atheism, philosophy, business & critical thinking';
const SHELF_POSITION = 5;

const layout = [
  { position: 1, o: 'vertical', w: 1.2, title: 'Publication Manual of the APA (earlier ed.)', author: 'American Psychological Association' },
  { position: 2, o: 'vertical', w: 1.2, title: 'Publication Manual of the APA (4th ed.)', author: 'American Psychological Association' },
  { position: 3, o: 'vertical', w: 1.0, title: 'The Federalist Papers', author: 'Hamilton, Madison & Jay (ed. R.B. Bernstein)' },
  { position: 4, o: 'vertical', w: 0.9, title: 'When Will Jesus Bring the Pork Chops?', author: 'George Carlin' },

  // Center horizontal stack (one slot, laid bottom -> top).
  {
    position: 5,
    stack: [
      { o: 'horizontal', w: 1.0, title: 'The Power of Critical Thinking', author: 'Lewis Vaughn' },
      { o: 'horizontal', w: 1.0, title: 'Critical Reasoning', author: 'Cederblom & Paulsen' },
      { o: 'horizontal', w: 0.9, title: 'god is not Great (copy 2)', author: 'Christopher Hitchens' },
      { o: 'horizontal', w: 0.9, title: 'Arguably: Essays', author: 'Christopher Hitchens' },
      { o: 'horizontal', w: 0.9, title: 'god is not Great', author: 'Christopher Hitchens' },
      { o: 'horizontal', w: 0.9, title: "A Devil's Chaplain", author: 'Richard Dawkins' },
      { o: 'horizontal', w: 1.0, title: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell' },
      { o: 'horizontal', w: 0.8, title: 'Unlabeled dark books in stack', pending: true,
        note: 'A couple of dark/red books in the stack with no legible spine text' },
      { o: 'horizontal', w: 0.9, title: 'Great Dialogues of Plato', author: 'trans. W.H.D. Rouse' },
      { o: 'horizontal', w: 0.9, title: 'Spiral-bound wire-o book', pending: true,
        note: 'Blank spiral/wire-o bound book resting near the top of the stack; no title visible' },
      { o: 'horizontal', w: 0.7, title: 'Coffee with Mozart', author: null },
      { o: 'horizontal', w: 1.0, title: "Plato at the Googleplex", author: 'Rebecca Newberger Goldstein' },
    ],
  },

  {
    position: 6,
    stack: [
      { o: 'vertical', w: 1.1, title: 'Modern Philosophy: An Anthology of Primary Sources', author: 'Ariew & Watkins' },
      { o: 'horizontal', w: 1.1, title: 'The God Delusion', author: 'Richard Dawkins' },
    ],
  },
  {
    position: 7,
    stack: [
      { o: 'vertical', w: 0.8, title: 'Braindroppings', author: 'George Carlin' },
      { o: 'horizontal', w: 1.0, title: 'The Psychopathology of Everyday Life', author: 'Sigmund Freud' },
    ],
  },
  { position: 8, o: 'vertical', w: 1.0, title: 'The Cambridge Companion to Atheism', author: 'Michael Martin (ed.)' },
  { position: 9, o: 'vertical', w: 0.9, title: 'Atheist Universe', author: 'David Mills' },
  { position: 10, o: 'vertical', w: 0.9, title: 'More Information Than You Require', author: 'John Hodgman' },
  { position: 11, o: 'vertical', w: 0.9, title: 'International Business: Cases and Exercises', author: 'Charles A. Rarick' },
  { position: 12, o: 'vertical', w: 0.8, title: 'Utilitarianism and On Liberty', author: 'J.S. Mill (ed. Mary Warnock)' },
  { position: 13, o: 'vertical', w: 0.8, title: 'A Theologico-Political Treatise', author: 'Baruch Spinoza' },
  { position: 14, o: 'vertical', w: 0.9, title: 'Obamanomics', author: 'John R. Talbott' },
  { position: 15, o: 'vertical', w: 0.8, title: 'The Tipping Point', author: 'Malcolm Gladwell' },
  { position: 16, o: 'vertical', w: 0.8, title: 'Mere Christianity', author: 'C.S. Lewis' },
  { position: 17, o: 'vertical', w: 0.8, title: 'On the Genealogy of Morals & Ecce Homo', author: 'Friedrich Nietzsche' },
  { position: 18, o: 'vertical', w: 0.5, title: 'Bartleby and Benito Cereno', author: 'Herman Melville' },
  { position: 19, o: 'vertical', w: 0.8, title: 'Campground Cookery', author: 'Kübler (Explorer’s Guide Publishing)' },
  { position: 20, o: 'vertical', w: 1.0, title: 'Reason & Religious Belief (3rd ed.)', author: 'Peterson, Hasker, Reichenbach & Basinger' },
  { position: 21, o: 'vertical', w: 0.9, title: 'Managing Humans', author: 'Michael Lopp' },
  { position: 22, o: 'vertical', w: 0.8, title: "The Manager's Path", author: 'Camille Fournier' },
  { position: 23, o: 'vertical', w: 0.9, title: 'The Everything Store: Jeff Bezos and the Age of Amazon', author: 'Brad Stone' },
  { position: 24, o: 'vertical', w: 0.8, title: "The Atheist's Bible", author: null },
  { position: 25, o: 'vertical', w: 1.1, title: 'Critical Thinking (7th ed.)', author: 'Moore & Parker' },
  { position: 26, o: 'vertical', w: 1.0, title: "Critical Thinking: A Student's Introduction (2nd ed.)", author: 'Bassham, Irwin, Nardone & Wallace' },
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
