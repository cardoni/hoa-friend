#!/usr/bin/env node
// Command-line helper for populating the bookshelf database directly
// (no running server needed). Used while transcribing shelf photos into
// shelves/books, one shelf and one book at a time, left to right.
//
// Usage:
//   node scripts/cli.js add-shelf --name "Shelf 1 (top)" [--position 1]
//   node scripts/cli.js add-book --shelf 1 --position 3 --title "Clean Code" \
//       --author "Robert C. Martin" --isbn 9780132350884 [--orientation vertical]
//   node scripts/cli.js add-book --shelf 1 --position 5 --stack-order 0 \
//       --title "Unidentified book" --orientation horizontal --status pending_isbn \
//       --note "thick maroon hardcover, gold lettering, 4th from left"
//   node scripts/cli.js set-isbn --book 12 --isbn 9780132350884
//   node scripts/cli.js list [--shelf 1]
//   node scripts/cli.js lookup --isbn 9780132350884

const db = require('../server/db');
const { lookupByIsbn, lookupByTitle } = require('../server/lib/lookup');
const { spineColorFor } = require('../server/lib/spineColor');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  switch (command) {
    case 'add-shelf': {
      const position =
        args.position ??
        db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM shelves').get().p;
      const result = db
        .prepare('INSERT INTO shelves (name, position) VALUES (?, ?)')
        .run(args.name, position);
      console.log(db.prepare('SELECT * FROM shelves WHERE id = ?').get(result.lastInsertRowid));
      break;
    }

    case 'add-book': {
      let coverUrl = args.cover || null;
      let title = args.title;
      let author = args.author || null;

      if (args.isbn && !coverUrl) {
        const meta = await lookupByIsbn(args.isbn);
        coverUrl = meta.cover_url || meta.fallback_cover_url || null;
        title = title || meta.title;
        author = author || meta.author;
      }

      const result = db
        .prepare(
          `INSERT INTO books
            (shelf_id, position, stack_order, orientation, title, author, isbn, cover_url, spine_color, width_ratio, status, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          Number(args.shelf),
          Number(args.position),
          Number(args['stack-order'] || 0),
          args.orientation || 'vertical',
          title,
          author,
          args.isbn || null,
          coverUrl,
          spineColorFor(title),
          Number(args['width-ratio'] || 1.0),
          args.status || 'identified',
          args.note || null
        );
      console.log(db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid));
      break;
    }

    case 'set-isbn': {
      const book = db.prepare('SELECT * FROM books WHERE id = ?').get(args.book);
      if (!book) throw new Error(`No book with id ${args.book}`);

      const meta = await lookupByIsbn(args.isbn);
      const title = args.title || meta.title || book.title;
      const author = args.author || meta.author || book.author;
      const coverUrl = meta.cover_url || meta.fallback_cover_url || book.cover_url;

      db.prepare(
        `UPDATE books SET isbn = ?, title = ?, author = ?, cover_url = ?, spine_color = ?, status = 'identified', updated_at = datetime('now')
         WHERE id = ?`
      ).run(args.isbn, title, author, coverUrl, spineColorFor(title), args.book);

      console.log(db.prepare('SELECT * FROM books WHERE id = ?').get(args.book));
      break;
    }

    case 'list': {
      const rows = args.shelf
        ? db
            .prepare('SELECT * FROM books WHERE shelf_id = ? ORDER BY position, stack_order')
            .all(args.shelf)
        : db.prepare('SELECT * FROM shelves ORDER BY position').all();
      console.log(JSON.stringify(rows, null, 2));
      break;
    }

    case 'lookup': {
      console.log(await lookupByIsbn(args.isbn));
      break;
    }

    case 'enrich': {
      // Fill in cover art (and ISBN where found) for every identified book
      // that doesn't have a cover yet, using title/author search. Run this
      // with normal internet access -- it no-ops gracefully offline.
      const pending = db
        .prepare(
          "SELECT * FROM books WHERE status = 'identified' AND (cover_url IS NULL OR cover_url = '')"
        )
        .all();
      console.log(`Enriching ${pending.length} book(s)...`);
      for (const book of pending) {
        const meta = book.isbn
          ? await lookupByIsbn(book.isbn)
          : await lookupByTitle(book.title, book.author);
        const cover = meta.cover_url || meta.fallback_cover_url || null;
        if (!cover) {
          console.log(`  - no cover found for "${book.title}"`);
          continue;
        }
        db.prepare(
          "UPDATE books SET cover_url = ?, isbn = COALESCE(isbn, ?), author = COALESCE(author, ?), updated_at = datetime('now') WHERE id = ?"
        ).run(cover, meta.isbn || null, meta.author || null, book.id);
        console.log(`  + ${book.title}`);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
