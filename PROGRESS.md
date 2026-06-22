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
| 2 | — | — | — | **Next up — awaiting photo** |
| 3+ | — | — | — | Not yet photographed |

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

## Reads worth double-checking on Shelf 1

- Position 10: assumed *Harry Potter and the Half-Blood Prince*
- Position 22: *Did God Use Evolution to Create?* (author read as "Chris Choi")

## Capture tips (for best recognition)

- One shelf per photo, shot head-on, left to right.
- Keep books in their real order; horizontal stacks are fine — they're
  modeled as a single position with the books laid bottom -> top.
- For unreadable spines, a close-up of the barcode (ISBN-13) resolves it.
