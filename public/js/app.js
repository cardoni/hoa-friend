(() => {
  const viewport = document.getElementById('viewport');
  const world = document.getElementById('world');
  const shelvesEl = document.getElementById('shelves');
  const emptyState = document.getElementById('empty-state');

  const BASE_BOOK_WIDTH = 30; // px, vertical book at width_ratio 1
  const BASE_BOOK_THICKNESS = 26; // px, horizontal (lying flat) book at width_ratio 1

  // ---------- Pan & zoom ----------
  const view = { x: 80, y: 40, scale: 1 };
  let dragging = false;
  let lastPointer = null;

  function applyTransform() {
    world.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
  }

  function clampScale(s) {
    return Math.min(3.5, Math.max(0.15, s));
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const newScale = clampScale(view.scale * factor);
    const ratio = newScale / view.scale;
    view.x = px - ratio * (px - view.x);
    view.y = py - ratio * (py - view.y);
    view.scale = newScale;
    applyTransform();
  }

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    zoomAt(e.clientX, e.clientY, factor);
  }, { passive: false });

  viewport.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.book')) return;
    dragging = true;
    lastPointer = { x: e.clientX, y: e.clientY };
    viewport.classList.add('grabbing');
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    view.x += e.clientX - lastPointer.x;
    view.y += e.clientY - lastPointer.y;
    lastPointer = { x: e.clientX, y: e.clientY };
    applyTransform();
  });

  function endDrag() {
    dragging = false;
    viewport.classList.remove('grabbing');
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  window.addEventListener('keydown', (e) => {
    const step = 60;
    if (e.key === 'ArrowLeft') view.x += step;
    else if (e.key === 'ArrowRight') view.x -= step;
    else if (e.key === 'ArrowUp') view.y += step;
    else if (e.key === 'ArrowDown') view.y -= step;
    else if (e.key === '+' || e.key === '=') zoomAt(innerWidth / 2, innerHeight / 2, 1.15);
    else if (e.key === '-' || e.key === '_') zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.15);
    else return;
    applyTransform();
  });

  document.getElementById('zoom-in').onclick = () =>
    zoomAt(innerWidth / 2, innerHeight / 2 + 28, 1.2);
  document.getElementById('zoom-out').onclick = () =>
    zoomAt(innerWidth / 2, innerHeight / 2 + 28, 1 / 1.2);
  document.getElementById('zoom-reset').onclick = () => {
    view.x = 80;
    view.y = 40;
    view.scale = 1;
    applyTransform();
  };

  applyTransform();

  // ---------- Modal ----------
  const modal = document.getElementById('book-modal');
  const modalCover = document.getElementById('modal-cover');
  const modalTitle = document.getElementById('modal-title');
  const modalAuthor = document.getElementById('modal-author');
  const modalIsbn = document.getElementById('modal-isbn');
  const modalStatus = document.getElementById('modal-status');
  const modalNote = document.getElementById('modal-note');

  function openModal(book) {
    modalCover.style.background = book.cover_url
      ? `url(${book.cover_url}) center/cover`
      : book.spine_color || '#444';
    modalTitle.textContent = book.title;
    modalAuthor.textContent = book.author || '';
    modalIsbn.textContent = book.isbn ? `ISBN ${book.isbn}` : 'ISBN unknown';
    modalStatus.textContent =
      book.status === 'pending_isbn' ? 'Needs barcode photo' : 'Identified';
    modalStatus.className = `modal-status ${book.status === 'pending_isbn' ? 'pending' : ''}`;
    modalNote.textContent = book.note || '';
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }
  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('modal-backdrop').onclick = closeModal;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ---------- Rendering ----------
  function buildBookEl(book) {
    const el = document.createElement('div');
    el.className = `book ${book.orientation}${book.status === 'pending_isbn' ? ' pending' : ''}`;

    if (book.orientation === 'vertical') {
      el.style.width = `${BASE_BOOK_WIDTH * (book.width_ratio || 1)}px`;
    } else {
      el.style.height = `${BASE_BOOK_THICKNESS * (book.width_ratio || 1)}px`;
    }
    el.style.backgroundColor = book.spine_color || '#3a3a3a';

    const label = document.createElement('span');
    label.className = 'book-spine-text';
    label.textContent = book.title;
    el.appendChild(label);

    if (book.cover_url) {
      const img = document.createElement('img');
      img.className = 'book-cover-img';
      img.alt = '';
      img.src = book.cover_url;
      img.onload = () => img.classList.add('loaded');
      img.onerror = () => img.remove();
      el.appendChild(img);
    }

    el.addEventListener('click', () => openModal(book));
    return el;
  }

  function groupBySlot(books) {
    const slots = new Map();
    for (const book of books) {
      if (!slots.has(book.position)) slots.set(book.position, []);
      slots.get(book.position).push(book);
    }
    return [...slots.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, members]) => members.sort((a, b) => a.stack_order - b.stack_order));
  }

  function renderShelf(shelf, books) {
    const unit = document.createElement('div');
    unit.className = 'shelf-unit';

    const name = document.createElement('p');
    name.className = 'shelf-name';
    name.textContent = shelf.name;
    unit.appendChild(name);

    const row = document.createElement('div');
    row.className = 'shelf-row';

    for (const slot of groupBySlot(books)) {
      const slotEl = document.createElement('div');
      slotEl.className = 'slot';
      for (const book of slot) slotEl.appendChild(buildBookEl(book));
      row.appendChild(slotEl);
    }

    unit.appendChild(row);

    const board = document.createElement('div');
    board.className = 'shelf-board';
    unit.appendChild(board);

    return unit;
  }

  async function load() {
    const [shelves, books] = await Promise.all([
      fetch('/api/shelves').then((r) => r.json()),
      fetch('/api/books').then((r) => r.json()),
    ]);

    if (shelves.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    const booksByShelf = new Map();
    for (const book of books) {
      if (!booksByShelf.has(book.shelf_id)) booksByShelf.set(book.shelf_id, []);
      booksByShelf.get(book.shelf_id).push(book);
    }

    // Group shelves into bookcases (rendered side by side, each its own
    // top-to-bottom column of shelves), mirroring the physical room.
    const byBookcase = new Map();
    for (const shelf of shelves) {
      const bc = shelf.bookcase || 1;
      if (!byBookcase.has(bc)) byBookcase.set(bc, []);
      byBookcase.get(bc).push(shelf);
    }

    shelvesEl.innerHTML = '';
    for (const [bc, bcShelves] of [...byBookcase.entries()].sort((a, b) => a[0] - b[0])) {
      const caseEl = document.createElement('div');
      caseEl.className = 'bookcase';

      const label = document.createElement('p');
      label.className = 'bookcase-label';
      label.textContent = `Bookcase ${bc}`;
      caseEl.appendChild(label);

      for (const shelf of bcShelves) {
        caseEl.appendChild(renderShelf(shelf, booksByShelf.get(shelf.id) || []));
      }
      shelvesEl.appendChild(caseEl);
    }
  }

  load();
})();
