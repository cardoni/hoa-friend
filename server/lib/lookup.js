// Looks up book metadata by ISBN. Tries Open Library first, then Google
// Books. Both are free/keyless. Network failures (or sandboxes with
// restricted egress) are swallowed -- callers get back whatever fields
// could be resolved, possibly none, and the frontend falls back to a
// generated spine placeholder when cover_url is missing.

async function fetchJson(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupOpenLibrary(isbn) {
  const data = await fetchJson(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  );
  const entry = data?.[`ISBN:${isbn}`];
  if (!entry) return null;
  return {
    title: entry.title || null,
    author: entry.authors?.map((a) => a.name).join(', ') || null,
    cover_url: entry.cover?.large || entry.cover?.medium || null,
  };
}

async function lookupGoogleBooks(isbn) {
  const data = await fetchJson(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  );
  const info = data?.items?.[0]?.volumeInfo;
  if (!info) return null;
  return {
    title: info.title || null,
    author: info.authors?.join(', ') || null,
    cover_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
  };
}

async function lookupByIsbn(isbn) {
  const clean = String(isbn).replace(/[^0-9Xx]/g, '');
  if (!clean) return { title: null, author: null, cover_url: null };

  const openLibrary = await lookupOpenLibrary(clean);
  const google = await lookupGoogleBooks(clean);

  return {
    title: openLibrary?.title || google?.title || null,
    author: openLibrary?.author || google?.author || null,
    cover_url: openLibrary?.cover_url || google?.cover_url || null,
    // Always available without any network call -- used as the <img>
    // src as a last resort if neither API above resolved a cover, since
    // it costs nothing to try it client-side in the user's browser.
    fallback_cover_url: `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`,
  };
}

module.exports = { lookupByIsbn };
