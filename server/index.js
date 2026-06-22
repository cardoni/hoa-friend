const path = require('node:path');
const express = require('express');

const shelvesRouter = require('./routes/shelves');
const booksRouter = require('./routes/books');
const { lookupByIsbn } = require('./lib/lookup');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/shelves', shelvesRouter);
app.use('/api/books', booksRouter);

app.get('/api/lookup/:isbn', async (req, res) => {
  res.json(await lookupByIsbn(req.params.isbn));
});

app.listen(PORT, () => {
  console.log(`Bookshelf server running at http://localhost:${PORT}`);
});
