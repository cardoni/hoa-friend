#!/usr/bin/env node
// Bookcase 3 -- the skinny single-column cubby unit (all 6 rows, from two
// EXIF-corrected portrait photos). It's mostly storage/media (rolled
// posters, binders, CDs, a spray bottle, chargers, LSAT prep) with only a
// handful of trade books, so non-book items are recorded as 'identified'
// with a decor/storage note (no barcode needed) rather than flagged.
//
// Bookcase 2's contents appear to the LEFT in both photos and are NOT
// included here. Data only, no network. Re-running replaces this bookcase.

const db = require('../server/db');
const { spineColorFor } = require('../server/lib/spineColor');

const BOOKCASE = 3;

const shelves = [
  {
    position: 1,
    name: 'Bookcase 3 · Shelf 1 (row 1) — posters, binders & CDs',
    items: [
      { position: 1, o: 'horizontal', w: 1.2, title: 'Rolled posters / papers (storage)', note: 'Rolled-up posters/paper lying in the cubby — not books' },
      { position: 1, stack_order: 1, o: 'horizontal', w: 1.1, title: 'White binders / notebooks (storage)', note: 'Stack of plain white binders/notebooks' },
      { position: 2, o: 'vertical', w: 0.6, title: 'CD / media cases (several: Julio Iglesias, Funk, Telarc…)', note: 'Row of thin CD/media cases standing on the cubby shelf' },
    ],
  },
  {
    position: 2,
    name: 'Bookcase 3 · Shelf 2 (row 2) — books',
    items: [
      { position: 1, o: 'vertical', w: 0.9, title: 'As I See It: The Autobiography of J. Paul Getty', author: 'J. Paul Getty' },
      { position: 2, o: 'vertical', w: 0.7, title: 'Aristotle: Nicomachean Ethics', author: 'Aristotle', note: 'Different edition from the Broadie & Rowe copy on bookcase 2 shelf 2' },
      { position: 3, o: 'vertical', w: 0.7, title: 'Drugs and Rights', author: 'Douglas Husak' },
      { position: 4, o: 'vertical', w: 0.9, title: 'The Body Keeps the Score', author: 'Bessel van der Kolk, M.D.' },
      { position: 5, o: 'horizontal', w: 0.6, title: 'Franklin ping-pong balls (decor)', note: 'Packaged Franklin table-tennis balls sitting in the cubby — not a book' },
    ],
  },
  {
    position: 3,
    name: 'Bookcase 3 · Shelf 3 (row 3) — storage',
    items: [
      { position: 1, o: 'horizontal', w: 1.0, title: 'White box (storage)', note: 'Plain white box in the cubby' },
      { position: 2, o: 'vertical', w: 0.4, title: 'Spray bottle (decor)', note: 'Spray bottle — not a book' },
      { position: 3, o: 'horizontal', w: 0.9, title: 'Chargers / cables / electronics (storage)', note: 'Loose chargers, cables and small electronics' },
    ],
  },
  {
    position: 4,
    name: 'Bookcase 3 · Shelf 4 (row 4) — recovery & media',
    items: [
      { position: 1, o: 'vertical', w: 0.9, title: 'Choose Your Own Journal', note: 'Blank guided journal/notebook' },
      { position: 2, o: 'vertical', w: 0.4, title: 'DVD (media)', note: 'A DVD case shelved with the books' },
      { position: 3, o: 'vertical', w: 0.8, title: 'Refuge Recovery', author: 'Noah Levine' },
      { position: 4, o: 'vertical', w: 0.9, title: 'Undoing Drugs', author: 'Maia Szalavitz' },
      { position: 5, o: 'horizontal', w: 0.6, title: 'CD / media cases (storage)', note: 'CD cases stacked on top in the cubby' },
    ],
  },
  {
    position: 5,
    name: 'Bookcase 3 · Shelf 5 (row 5) — Semester at Sea & LSAT prep',
    items: [
      { position: 1, o: 'vertical', w: 0.8, title: 'Semester at Sea: Port-to-Port Global Studies (Fall 2007)', note: 'Semester at Sea program book/binder' },
      { position: 2, o: 'vertical', w: 0.8, title: 'Blue space-themed book', pending: true, note: 'Dark blue book with a star/space design; spine text not legible' },
      { position: 3, o: 'vertical', w: 0.8, title: 'Marbled / colorful book', pending: true, note: 'Book with a rainbow/marbled cover; spine not legible' },
      { position: 4, o: 'vertical', w: 0.9, title: 'LSAT Logic Games: Ultimate Setups Guide', author: 'PowerScore' },
      { position: 5, o: 'vertical', w: 1.0, title: 'The Official LSAT SuperPrep', author: 'LSAC' },
    ],
  },
  {
    position: 6,
    name: 'Bookcase 3 · Shelf 6 (row 6) — bodybuilding & LSAT bibles',
    items: [
      { position: 1, o: 'vertical', w: 1.8, title: 'The New Encyclopedia of Modern Bodybuilding', author: 'Arnold Schwarzenegger' },
      { position: 2, o: 'vertical', w: 1.0, title: 'LSAT Logical Reasoning Bible', author: 'PowerScore' },
      { position: 3, o: 'vertical', w: 1.0, title: 'LSAT Logic Games Bible', author: 'PowerScore' },
      { position: 4, o: 'vertical', w: 0.9, title: "McGraw-Hill's LSAT", author: 'McGraw-Hill' },
    ],
  },
];

function insertBook(shelfId, b) {
  db.prepare(
    `INSERT INTO books
       (shelf_id, position, stack_order, orientation, title, author, isbn, cover_url, spine_color, width_ratio, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    shelfId, b.position, b.stack_order ?? 0, b.o, b.title, b.author ?? null, null, null,
    spineColorFor(b.title), b.w ?? 1.0, b.pending ? 'pending_isbn' : 'identified', b.note ?? null
  );
}

let total = 0;
let pending = 0;
for (const shelf of shelves) {
  const existing = db.prepare('SELECT id FROM shelves WHERE name = ?').get(shelf.name);
  if (existing) {
    db.prepare('DELETE FROM books WHERE shelf_id = ?').run(existing.id);
    db.prepare('DELETE FROM shelves WHERE id = ?').run(existing.id);
  }
  const shelfId = db
    .prepare('INSERT INTO shelves (name, bookcase, position) VALUES (?, ?, ?)')
    .run(shelf.name, BOOKCASE, shelf.position).lastInsertRowid;
  for (const item of shelf.items) {
    insertBook(shelfId, item);
    total++;
    if (item.pending) pending++;
  }
}

console.log(`Seeded bookcase 3 (${shelves.length} shelves) with ${total} items, ${pending} pending identification.`);
