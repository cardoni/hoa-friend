# Bookshelf

A zoomable, pannable, expandable HTML5/CSS3 virtual bookshelf that mirrors a
real bookshelf, shelf by shelf, book by book, in the exact left-to-right
order they sit in real life — including spots where several books lie flat
in a horizontal stack instead of standing upright.

No frameworks, no build step: vanilla JS + CSS 3D transforms on the
frontend, a small Express + SQLite backend for storage.

## Running it

```
npm install
npm start
```

Then open http://localhost:3000.

- Drag to pan in any direction, scroll/pinch to zoom, use the +/- buttons,
  or arrow keys.
- Click any book to expand it and see its title, author, ISBN and cover.
- Books with a yellow "?" badge are still unidentified and waiting on a
  barcode photo to resolve their ISBN.

## How the shelf gets populated

This app doesn't run its own image-recognition pipeline. Instead, the data
gets populated conversationally: send a photo of one section of the shelf
(top-left to bottom-right, in order) to whoever is operating this assistant,
and they identify each book and insert it with:

```
node scripts/cli.js add-shelf --name "Shelf 1 (top)"
node scripts/cli.js add-book --shelf 1 --position 1 --title "Clean Code" \
    --author "Robert C. Martin" --isbn 9780132350884 --orientation vertical
```

For a horizontal stack of books lying flat in one slot, give every book in
that pile the same `--position` and an increasing `--stack-order` (0 =
bottom of the pile):

```
node scripts/cli.js add-book --shelf 1 --position 5 --stack-order 0 \
    --title "Book on the bottom" --orientation horizontal
node scripts/cli.js add-book --shelf 1 --position 5 --stack-order 1 \
    --title "Book on top of it" --orientation horizontal
```

For a book that can't be identified from the shelf photo alone, it gets
added with `--status pending_isbn` and a short visual `--note` describing
it. It'll show up on the shelf with a "?" badge until a photo of its
barcode is sent — at that point `set-isbn` resolves the real
title/author/cover and clears the flag:

```
node scripts/cli.js set-isbn --book 12 --isbn 9780132350884
```

## Cover art and metadata

Covers/metadata are looked up by ISBN from [Open Library](https://openlibrary.org)
first, then [Google Books](https://books.google.com), both free and keyless.
If neither resolves (no network, ISBN not found, etc.) the book still
renders fine as a colored "spine" with its title — the color is a stable
hash of the title, so the same book always gets the same color.

> Note: lookups require outbound internet access to `openlibrary.org` and
> `googleapis.com`. They will silently no-op in network-restricted
> sandboxes; run the server in a normal environment to get real cover art.

## Data model

SQLite (`data/bookshelf.sqlite`, gitignored), two tables:

- `shelves`: ordered top-to-bottom (`position`).
- `books`: ordered left-to-right within a shelf (`position`); books sharing
  a `position` form a horizontal stack ordered bottom-to-top by
  `stack_order`.
