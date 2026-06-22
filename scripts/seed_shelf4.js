#!/usr/bin/env node
// Seeds the fourth photographed shelf (row 4 from the top), transcribed
// left to right from a head-on photo. Vertical standing run on the left,
// a big horizontal stack on the right (laid bottom -> top), and a few flat
// items resting on top of the left end.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Shelf 4 (photo 4) — ethics, philosophy & textbooks';
const SHELF_POSITION = 4;

const layout = [
  {
    position: 1,
    stack: [
      { o: 'vertical', w: 1.1, title: 'Arnold: The Education of a Bodybuilder', author: 'Arnold Schwarzenegger & Douglas Kent Hall' },
      { o: 'horizontal', w: 1.1, title: 'Contemporary Drummer + One: The Next Step', author: 'Dave Weckl' },
      { o: 'horizontal', w: 0.9, title: 'Red book on top', pending: true,
        note: 'Red hardcover lying flat on top of the Dave Weckl book; spine not legible' },
    ],
  },
  { position: 2, o: 'vertical', w: 0.8, title: 'Thin booklets / journals (several)', pending: true,
    note: 'Cluster of thin white booklets/pamphlets leaning between Arnold and the textbooks; individual titles not legible' },
  { position: 3, o: 'vertical', w: 0.5, title: 'Second Treatise of Government', author: 'John Locke' },
  { position: 4, o: 'vertical', w: 0.9, title: 'Critical Thinking', author: 'William Hughes & Jonathan Lavery' },
  { position: 5, o: 'vertical', w: 1.0, title: 'Morality in Practice (6th ed.)', author: 'James P. Sterba' },
  { position: 6, o: 'vertical', w: 0.6, title: 'White book (reads "...Latin and Antiquities...")', pending: true,
    note: 'Pale book with faint spine text mentioning "Latin and Antiquities" and a year; not identifiable' },
  { position: 7, o: 'vertical', w: 0.8, title: 'South Park and Philosophy', author: 'Robert Arp (ed.)' },
  { position: 8, o: 'vertical', w: 1.0, title: 'The Art of Deception', author: 'Kevin Mitnick' },
  { position: 9, o: 'vertical', w: 0.9, title: 'Nerd Do Well', author: 'Simon Pegg' },
  { position: 10, o: 'vertical', w: 0.8, title: 'Stay Mad for Life', author: 'Jim Cramer with Cliff Mason' },
  { position: 11, o: 'vertical', w: 0.9, title: 'Vice & Virtue in Everyday Life', author: 'Christina & Fred Sommers (eds.)' },
  { position: 12, o: 'vertical', w: 0.9, title: 'Social Ethics: Morality and Social Policy', author: 'Mappes & Zembaty' },
  { position: 13, o: 'vertical', w: 0.8, title: 'Thinking Critically About Ethical Issues', author: 'Vincent Ruggiero' },
  { position: 14, o: 'vertical', w: 0.7, title: 'Groundwork of the Metaphysics of Morals', author: 'Immanuel Kant' },
  { position: 15, o: 'vertical', w: 0.9, title: 'The Moral Landscape', author: 'Sam Harris',
    note: 'Also appears on shelf 3 — possible duplicate copy or photo overlap; confirm' },
  { position: 16, o: 'vertical', w: 0.9, title: 'Disputed Moral Issues', author: 'Mark Timmons' },
  { position: 17, o: 'vertical', w: 0.9, title: 'Ethics: Theory and Contemporary Issues (3rd ed.)', author: 'Barbara MacKinnon' },
  { position: 18, o: 'vertical', w: 0.9, title: 'Ethics: Theory and Contemporary Issues (5th ed.)', author: 'Barbara MacKinnon' },
  { position: 19, o: 'vertical', w: 1.0, title: 'Knowledge and Reality: Classic and Contemporary Readings', author: 'Cohen, Eckert & Buckley' },
  { position: 20, o: 'vertical', w: 0.8, title: 'A Guide to Good Reasoning', author: 'Wilson' },
  { position: 21, o: 'vertical', w: 0.7, title: 'The Church and the Homosexual', author: 'John J. McNeill' },

  // Right horizontal stack (one slot, laid bottom -> top).
  {
    position: 22,
    stack: [
      { o: 'horizontal', w: 1.0, title: 'Judicial Process: Law, Courts, and Politics in the United States', author: 'Neubauer & Meinhold' },
      { o: 'horizontal', w: 1.0, title: 'Business Ethics (6th ed.)', author: 'Richard De George' },
      { o: 'horizontal', w: 1.0, title: 'Classic Cases in Medical Ethics', author: null },
      { o: 'horizontal', w: 0.9, title: 'Atheism: The Case Against God', author: 'George H. Smith' },
      { o: 'horizontal', w: 0.9, title: 'Napalm & Silly Putty', author: 'George Carlin' },
      { o: 'horizontal', w: 0.9, title: 'The Right Thing to Do (3rd ed.)', author: 'James Rachels' },
      { o: 'horizontal', w: 0.9, title: 'Moral Minds: The Nature of Right and Wrong', author: 'Marc D. Hauser' },
      { o: 'horizontal', w: 0.7, title: 'The Grand Inquisitor', author: 'Fyodor Dostoevsky' },
      { o: 'horizontal', w: 0.8, title: 'The Prince and the Pauper', author: 'Mark Twain' },
      { o: 'horizontal', w: 0.8, title: 'Make Your Bed', author: 'Admiral William H. McRaven' },
      { o: 'horizontal', w: 0.6, title: '"...enstein": A Very Short Introduction', pending: true,
        note: 'Thin blue VSI volume; subject reads "...enstein" (Einstein? Wittgenstein?) — unconfirmed' },
      { o: 'horizontal', w: 0.8, title: 'The Selfish Gene', author: 'Richard Dawkins' },
      { o: 'horizontal', w: 0.9, title: 'Blank notebooks / sketchbooks (on top)', pending: true,
        note: 'A couple of blank white notebooks/sketchbooks resting on top of the stack — likely not books' },
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
