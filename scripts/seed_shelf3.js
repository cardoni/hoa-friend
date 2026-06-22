#!/usr/bin/env node
// Seeds the third photographed shelf (row 3 from the top), transcribed
// left to right from a head-on photo. Same modeling: vertical standing
// books, one center pile laid flat (bottom -> top), flat books resting on
// top of a couple of slots.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Shelf 3 (photo 3) — recovery, philosophy & self-help';
const SHELF_POSITION = 3;

const layout = [
  {
    position: 1,
    stack: [
      { o: 'vertical', w: 1.0, title: 'SMART Recovery: Family & Friends Handbook (spiral-bound)', author: 'SMART Recovery' },
      { o: 'horizontal', w: 0.9, title: 'Blue knit beanie (decor)', author: null,
        note: 'Folded blue knit hat resting on top — not a book' },
    ],
  },
  { position: 2, o: 'vertical', w: 0.9, title: 'Recovery booklets / journals (several thin)', pending: true,
    note: 'A row of thin dated booklets/journals leaning behind the SMART Recovery binder; individual titles not legible' },
  { position: 3, o: 'vertical', w: 0.8, title: 'Grief Day by Day', author: 'Jan Warner' },
  { position: 4, o: 'vertical', w: 0.9, title: 'This Naked Mind: Control Alcohol', author: 'Annie Grace' },
  { position: 5, o: 'vertical', w: 0.8, title: 'Amazing Grace', author: 'David Wolfe & Nick Good' },
  { position: 6, o: 'vertical', w: 1.3, title: 'Psychology', author: 'DK' },
  { position: 7, o: 'vertical', w: 0.9, title: 'The Grief Recovery Handbook', author: 'James & Friedman' },

  // Center horizontal stack (one slot, laid bottom -> top).
  {
    position: 8,
    stack: [
      { o: 'horizontal', w: 0.7, title: 'Why I Am Not a Christian', author: 'Bertrand Russell' },
      { o: 'horizontal', w: 0.9, title: 'The Millionaire Next Door', author: 'Stanley & Danko' },
      { o: 'horizontal', w: 0.7, title: 'Only Words', author: 'Catharine MacKinnon' },
      { o: 'horizontal', w: 1.0, title: 'The Blank Slate', author: 'Steven Pinker' },
      { o: 'horizontal', w: 1.0, title: 'Autobiography of a Yogi', author: 'Paramahansa Yogananda' },
      { o: 'horizontal', w: 0.9, title: 'Feeling Good: The New Mood Therapy', author: 'David D. Burns, M.D.' },
      { o: 'horizontal', w: 0.7, title: 'Irish Wit & Wisdom', author: null },
      { o: 'horizontal', w: 0.7, title: 'Coffee with the Buddha', author: 'Joan Duncan Oliver' },
      { o: 'horizontal', w: 0.7, title: 'Coffee with Aristotle', author: 'Jonathan Barnes' },
      { o: 'horizontal', w: 0.7, title: 'Coffee with Plato', author: 'Donald R. Moor' },
      { o: 'horizontal', w: 0.9, title: 'The Moral Landscape', author: 'Sam Harris' },
      { o: 'horizontal', w: 0.8, title: 'No Bad Parts', author: 'Richard C. Schwartz' },
      { o: 'horizontal', w: 0.8, title: 'Felony Juggler', author: 'Penn Jillette', pending: false,
        note: 'Orange flat book read as "Felony Juggler / Penn Jillette" — worth confirming' },
      { o: 'horizontal', w: 0.6, title: 'Gold-spined book (reads "SAM HAR...")', pending: true,
        note: 'Gold/tan book lying flat in the back recess, mostly in shadow; possibly a Sam Harris title' },
    ],
  },

  { position: 9, o: 'vertical', w: 0.9, title: 'How to Say It at Work', author: 'Jack Griffin' },
  { position: 10, o: 'vertical', w: 0.9, title: 'Stop Walking on Eggshells', author: 'Mason & Kreger' },
  { position: 11, o: 'vertical', w: 0.8, title: 'Delivering Happiness', author: 'Tony Hsieh' },
  { position: 12, o: 'vertical', w: 0.8, title: 'Religious Literacy', author: 'Stephen Prothero' },
  { position: 13, o: 'vertical', w: 0.9, title: 'The Reason-Driven Life', author: 'Robert M. Price' },
  {
    position: 14,
    stack: [
      { o: 'vertical', w: 1.1, title: 'Ancient Greek Philosophy: From Thales to Aristotle', author: 'Cohen, Curd & Reeve' },
      { o: 'horizontal', w: 1.2, title: 'Sex, Drugs, Einstein & Elves', author: 'Clifford A. Pickover' },
    ],
  },
  { position: 15, o: 'vertical', w: 1.1, title: 'Primitive Mythology: The Masks of God, Vol. 1', author: 'Joseph Campbell' },
  { position: 16, o: 'vertical', w: 0.8, title: 'Blink', author: 'Malcolm Gladwell' },
  { position: 17, o: 'vertical', w: 0.7, title: 'The Four Agreements', author: 'Don Miguel Ruiz' },
  { position: 18, o: 'vertical', w: 0.7, title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson' },
  { position: 19, o: 'vertical', w: 0.9, title: 'Positive Intelligence', author: 'Shirzad Chamine' },
  { position: 20, o: 'vertical', w: 0.8, title: 'Inspired: How to Create Products Customers Love', author: 'Marty Cagan' },
  { position: 21, o: 'vertical', w: 0.9, title: 'The Examined Life', author: 'Robert Nozick' },
  { position: 22, o: 'vertical', w: 0.8, title: 'Holy Man', pending: true,
    note: 'White spine reads "Holy Man" with author possibly "Davis"; not confirmed' },
  { position: 23, o: 'vertical', w: 0.9, title: 'Create-A-Book (personalized)', author: null },
  { position: 24, o: 'vertical', w: 1.2, title: 'The Greatest Show on Earth: The Evidence for Evolution', author: 'Richard Dawkins' },
  { position: 25, o: 'vertical', w: 0.6, title: 'Barcelona (travel guide)', author: null },
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
