const express = require('express');
const db = require('../db');
const { lookupByIsbn } = require('../lib/lookup');
const { spineColorFor } = require('../lib/spineColor');

const router = express.Router();

router.get('/', (req, res) => {
  const { shelf_id } = req.query;
  const books = shelf_id
    ? db
        .prepare(
          'SELECT * FROM books WHERE shelf_id = ? ORDER BY position ASC, stack_order ASC'
        )
        .all(shelf_id)
    : db.prepare('SELECT * FROM books ORDER BY shelf_id, position ASC, stack_order ASC').all();
  res.json(books);
});

router.post('/', async (req, res) => {
  const {
    shelf_id,
    position,
    stack_order = 0,
    orientation = 'vertical',
    title,
    author = null,
    isbn = null,
    cover_url = null,
    width_ratio = 1.0,
    status = 'identified',
    note = null,
  } = req.body;

  if (!shelf_id || position === undefined || !title) {
    return res
      .status(400)
      .json({ error: 'shelf_id, position and title are required' });
  }

  let resolvedCover = cover_url;
  let resolvedTitle = title;
  let resolvedAuthor = author;

  if (isbn && !resolvedCover) {
    const meta = await lookupByIsbn(isbn);
    resolvedCover = meta.cover_url || meta.fallback_cover_url || null;
    resolvedTitle = resolvedTitle || meta.title || title;
    resolvedAuthor = resolvedAuthor || meta.author;
  }

  const spineColor = spineColorFor(resolvedTitle);

  const result = db
    .prepare(
      `INSERT INTO books
        (shelf_id, position, stack_order, orientation, title, author, isbn, cover_url, spine_color, width_ratio, status, note, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      shelf_id,
      position,
      stack_order,
      orientation,
      resolvedTitle,
      resolvedAuthor,
      isbn,
      resolvedCover,
      spineColor,
      width_ratio,
      status,
      note
    );

  res
    .status(201)
    .json(db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', async (req, res) => {
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const merged = { ...existing, ...req.body };

  // If an ISBN was just supplied (or changed) and there's still no cover,
  // try to resolve real metadata/cover art for it now.
  if (merged.isbn && (merged.isbn !== existing.isbn || !merged.cover_url)) {
    const meta = await lookupByIsbn(merged.isbn);
    merged.cover_url = req.body.cover_url || meta.cover_url || meta.fallback_cover_url || merged.cover_url;
    merged.title = req.body.title || meta.title || merged.title;
    merged.author = req.body.author || meta.author || merged.author;
    if (merged.status === 'pending_isbn') merged.status = 'identified';
  }

  merged.spine_color = spineColorFor(merged.title);

  db.prepare(
    `UPDATE books SET
      shelf_id = ?, position = ?, stack_order = ?, orientation = ?, title = ?,
      author = ?, isbn = ?, cover_url = ?, spine_color = ?, width_ratio = ?,
      status = ?, note = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    merged.shelf_id,
    merged.position,
    merged.stack_order,
    merged.orientation,
    merged.title,
    merged.author,
    merged.isbn,
    merged.cover_url,
    merged.spine_color,
    merged.width_ratio,
    merged.status,
    merged.note,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
