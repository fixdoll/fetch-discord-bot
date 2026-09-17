const fetch = require('node-fetch');

/**
 * Slay the Spire 2, via Spire Codex.
 * Docs: https://spire-codex.com/developers
 * No API key required for read access (an optional key just raises the rate limit).
 *
 * IMPORTANT: as of writing, the `search` query param on GET /api/cards does
 * not actually filter results (verified: identical response for a real card
 * name and a nonsense string) - it's likely still WIP on their end. So
 * instead of relying on it, we fetch the full card list once, cache it in
 * memory, and do our own name matching locally. This also means we barely
 * touch their rate limit even under heavy bot usage.
 */
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour - card data changes rarely
let cache = { cards: null, fetchedAt: 0 };

async function getAllCards() {
  const isFresh = cache.cards && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cache.cards;

  const headers = {};
  if (process.env.SPIRECODEX_API_KEY) {
    headers['X-API-Key'] = process.env.SPIRECODEX_API_KEY;
  }

  const res = await fetch('https://spire-codex.com/api/cards', { headers });
  if (!res.ok) throw new Error(`Spire Codex error: ${res.status}`);

  const cards = await res.json();
  cache = { cards, fetchedAt: Date.now() };
  return cards;
}

async function search(query) {
  const cards = await getAllCards();
  const needle = query.toLowerCase();

  // Exact name match first, then fall back to substring for partial/typo queries.
  let matches = cards.filter((c) => c.name.toLowerCase() === needle);
  if (matches.length === 0) {
    matches = cards.filter((c) => c.name.toLowerCase().includes(needle));
  }

  return matches.map((card) => ({
    name: card.name,
    imageUrl: card.image_url_card ?? null,
    link: `https://spire-codex.com/search?q=${encodeURIComponent(card.name)}`,
    subtitle: `${card.color} · ${card.type} (${card.rarity})`,
  }));
}

module.exports = {
  prefixes: ['sts2', 'spire2', 'sts', 'slaythespire'],
  label: 'Slay the Spire 2',
  search,
};
