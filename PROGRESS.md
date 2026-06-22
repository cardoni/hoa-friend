# Bookshelf build progress

Running log of which shelves have been photographed and transcribed, in
order from the top of the bookcase down. The database itself
(`data/bookshelf.sqlite`) is gitignored and rebuilt from the `scripts/seed_*.js`
files, so those seed scripts are the source of truth — re-run them on any
machine to reconstruct the shelf.

## Status

| Row | Shelf | Seed script | Items | Status |
|-----|-------|-------------|-------|--------|
| 1 (top) | Philosophy, Harry Potter & magic | `scripts/seed_shelf1.js` | 39 | Transcribed; 6 pending barcodes |
| 2 | Philosophy, business & misc | `scripts/seed_shelf2.js` | 38 | Transcribed; 3 pending barcodes |
| 3 | Recovery, philosophy & self-help | `scripts/seed_shelf3.js` | 40 | Transcribed; 3 pending barcodes |
| 4 | Ethics, philosophy & textbooks | `scripts/seed_shelf4.js` | 36 | Transcribed; 5 pending barcodes |
| 5 | Atheism, philosophy, business & critical thinking | `scripts/seed_shelf5.js` | 39 | Transcribed; 2 pending barcodes |
| 6 | — | — | — | **Next up — awaiting photo** |
| 7+ | — | — | — | Not yet photographed |

**Running totals:** 5 shelves · 192 items · 19 awaiting barcodes.

## Rebuild / view

```
npm install
node scripts/seed_shelf1.js   # + any other seed_shelfN.js scripts
node scripts/cli.js enrich    # downloads cover art by title (needs internet)
npm start                     # http://localhost:3000
```

## Shelf 1 — pending identification (need a barcode photo)

These render now with a yellow "?" badge, holding their exact shelf
position, until a barcode photo resolves the ISBN:

1. Tall blue hardcover behind the Zappos book (spine obscured)
2. Spiral-bound black workbook (in the center-right horizontal stack)
3. Brown leather classic with gold lettering (top of the stack)
4. Pale white/cream book (top of the stack)
5. Yellow Penn & Teller book (exact title not legible)
6. Green book under the playing cards (reads "...A OF C...")

## Shelf 2 — pending identification (need a barcode photo)

1. Small reddish-brown box/slipcase resting on top of *Roots of Wisdom*
2. Grey book in the center stack reading "Questions That Ma..." (title unconfirmed)
3. Pale book at the right end shelved spine-in (pages facing out)

## Reads worth double-checking on Shelf 2

- Position 16: red spine read as *Ultimate Dinosaur Dance-Off*
- Center stack: *Pensées* (Pascal) and *Questions That Matter* are softer reads

## Shelf 3 — pending identification (need a barcode photo)

1. Row of thin dated recovery booklets/journals behind the SMART Recovery binder
2. Gold/tan book lying flat in the back recess (reads "SAM HAR...", in shadow)
3. White spine *Holy Man* (author possibly "Davis") — unconfirmed

## Reads worth double-checking on Shelf 3

- Center stack: *Felony Juggler / Penn Jillette* (orange flat book)
- *Amazing Grace* (David Wolfe & Nick Good) and *Create-A-Book* are softer reads

## Shelf 4 — pending identification (need a barcode photo)

1. Red hardcover lying flat on top of the Dave Weckl drum book
2. Cluster of thin white booklets/pamphlets between Arnold and the textbooks
3. Pale book reading "...Latin and Antiquities..." (+ a year)
4. Thin blue "...enstein: A Very Short Introduction" in the right stack
5. Blank notebooks/sketchbooks on top of the right stack (likely not books)

## Shelf 5 — pending identification (need a barcode photo)

1. A couple of dark/red books in the center stack with no legible spines
2. Blank spiral/wire-o bound book near the top of the center stack

## Reads worth double-checking on Shelf 5

- *Coffee with Mozart* and *Campground Cookery* (Kübler) are softer reads
- Two copies of *god is not Great* (Hitchens) and two APA Publication Manuals — confirm both are really present

## Possible duplicates / photo overlap to confirm

- *The Moral Landscape* (Sam Harris): on shelf 3 (center stack) and shelf 4 (vertical)
- *Morality in Practice* (Sterba): shelf 2 (3rd ed.) and shelf 4 (6th ed.) — likely two editions

## Reads worth double-checking on Shelf 1

- Position 10: assumed *Harry Potter and the Half-Blood Prince*
- Position 22: *Did God Use Evolution to Create?* (author read as "Chris Choi")

## Capture tips (for best recognition)

- One shelf per photo, shot head-on, left to right.
- Keep books in their real order; horizontal stacks are fine — they're
  modeled as a single position with the books laid bottom -> top.
- For unreadable spines, a close-up of the barcode (ISBN-13) resolves it.
