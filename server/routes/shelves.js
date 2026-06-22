const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const shelves = db
    .prepare('SELECT * FROM shelves ORDER BY position ASC')
    .all();
  res.json(shelves);
});

router.post('/', (req, res) => {
  const { name, position } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const pos =
    position ??
    (db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM shelves').get()
      .p);

  const result = db
    .prepare('INSERT INTO shelves (name, position) VALUES (?, ?)')
    .run(name, pos);

  const shelf = db
    .prepare('SELECT * FROM shelves WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(shelf);
});

router.put('/:id', (req, res) => {
  const { name, position } = req.body;
  const existing = db
    .prepare('SELECT * FROM shelves WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  db.prepare('UPDATE shelves SET name = ?, position = ? WHERE id = ?').run(
    name ?? existing.name,
    position ?? existing.position,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM shelves WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM shelves WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
