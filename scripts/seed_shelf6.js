#!/usr/bin/env node
// Seeds the sixth and final shelf of the leftmost bookcase (row 6),
// transcribed left to right. A horizontal stack on the left (yearbooks +
// how-to books + Steve Jobs), a long run of near-identical TestMasters
// LSAT lesson volumes in the middle, then a right vertical run.
//
// Data only, no network. Run `node scripts/cli.js enrich` for covers.
// Re-running replaces this shelf.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const SHELF_NAME = 'Shelf 6 (photo 6) — yearbooks, LSAT prep, logic & tech';
const SHELF_POSITION = 6;

// TestMasters LSAT course volumes, read left -> right off the shelf. The
// set is shelved out of numeric order (and may include duplicates); this
// is the visible order, not lesson order.
const TESTMASTERS_LESSONS = [
  'Thirteen', 'Twelve', 'Eleven', 'Nine', 'Ten', 'Eight', 'Seven', 'Fourteen',
  'One', 'Three', 'Twelve', 'Seven', 'Five', 'Ten', 'Four', 'Eight', 'Six',
  'Thirteen', 'Fifteen', 'Three', 'Five', 'Eleven',
];

const layout = [];

// Position 1: left horizontal stack (laid bottom -> top).
layout.push({
  position: 1,
  stack: [
    { o: 'horizontal', w: 0.9, title: 'Westlake High School Yearbook (Vol. XXIV)', author: null },
    { o: 'horizontal', w: 0.9, title: 'Westlake High School Yearbook 2001 (Vol. XXIII)', author: null },
    { o: 'horizontal', w: 0.9, title: 'Westlake High School Yearbook 2002-2003 (Vol. XXV)', author: null },
    { o: 'horizontal', w: 0.9, title: 'Westlake High School Yearbook 2003-2004 (Vol. XXVI)', author: null },
    { o: 'horizontal', w: 0.9, title: 'Scrawny to Brawny', author: 'Michael Mejia & John Berardi' },
    { o: 'horizontal', w: 0.9, title: 'Basic Carpentry Illustrated', author: 'Sunset' },
    { o: 'horizontal', w: 0.8, title: 'More Proficient Motorcycling', author: 'David L. Hough' },
    { o: 'horizontal', w: 0.8, title: 'Proficient Motorcycling', author: 'David L. Hough' },
    { o: 'horizontal', w: 0.7, title: 'Blank white book', pending: true,
      note: 'Plain white book in the stack with no legible spine text' },
    { o: 'horizontal', w: 0.9, title: 'Steve Jobs', author: 'Walter Isaacson' },
  ],
});

// Positions 2..N: the TestMasters LSAT lesson volumes, each its own slot.
TESTMASTERS_LESSONS.forEach((lesson, i) => {
  layout.push({
    position: 2 + i,
    o: 'vertical',
    w: 0.4,
    title: `TestMasters LSAT — Lesson ${lesson}`,
    author: 'TestMasters',
    note: i === 0
      ? 'Part of a matching set of ~22 blue TestMasters LSAT lesson volumes shelved out of numeric order; exact lessons/duplicates approximate'
      : null,
  });
});

let p = 2 + TESTMASTERS_LESSONS.length;
const rightRun = [
  { w: 1.0, title: 'Drawdown', author: 'Paul Hawken (ed.)' },
  { w: 1.0, title: 'America (The Book): A Citizen’s Guide to Democracy Inaction', author: 'Jon Stewart & The Daily Show' },
  { w: 0.7, title: 'A First Course in Logic', author: 'Carter' },
  { w: 1.1, title: 'Logic: A Concise Introduction (9th ed.)', author: 'Patrick J. Hurley' },
  { w: 0.9, title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz' },
  { w: 0.9, title: 'AWS Lambda in Action', author: 'Danilo Poccia' },
  { w: 0.9, title: 'Serverless Architectures on AWS', author: 'Peter Sbarski' },
  { w: 0.8, title: 'The Elements of Editing', author: 'Arthur Plotnik' },
];
for (const b of rightRun) {
  layout.push({ position: p++, o: 'vertical', w: b.w, title: b.title, author: b.author });
}

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
