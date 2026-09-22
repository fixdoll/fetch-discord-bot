const fetch = require('node-fetch');
const vm = require('vm');

/**
 * FNAF Card Game (FCG), via the community-maintained card list.
 * Data source: https://fcg-cards-k3x8.vercel.app/cards.js
 * Site (used as the link for every result): https://fcg-cards-k3x8.vercel.app/
 *
 * The data source is a raw JS file (`const cards = [...]`), not JSON -
 * it has trailing commas, unquoted-looking brace sequences inside strings
 * (e.g. \{\ReTiRed\}), and other things that would break a strict JSON or
 * regex parse. Safer and more robust to just execute it as JS in a
 * sandboxed vm context and pull the `cards` array back out, rather than
 * try to hand-parse its exact quirks.
 */
const CARDS_JS_URL = 'https://fcg-cards-k3x8.vercel.app/cards.js';
const SITE_URL = 'https://fcg-cards-k3x8.vercel.app/';

// Community-maintained and can grow at any time - cache for a while so a
// burst of searches doesn't refetch every time, but not so long that new
// cards take forever to show up.
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
let cache = { cards: null, fetchedAt: 0 };

async function getAllCards() {
  const isFresh = cache.cards && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cache.cards;

  const res = await fetch(CARDS_JS_URL);
  if (!res.ok) throw new Error(`FCG data fetch error: ${res.status}`);

  const scriptText = await res.text();

  // Wrap in an IIFE that returns `cards` - this sidesteps a vm quirk
  // where top-level const/let in a vm context aren't visible on the
  // context object afterward (only var/function declarations are).
  // Sandboxed with an empty context: no require/process/fs access.
  const wrapped = `(function() { ${scriptText}\nreturn cards; })()`;
  const cards = vm.runInNewContext(wrapped, {}, { timeout: 3000 });

  if (!Array.isArray(cards)) throw new Error('FCG data did not parse to an array');

  cache = { cards, fetchedAt: Date.now() };
  return cards;
}

async function search(query) {
  const cards = await getAllCards();
  const needle = query.toLowerCase();

  const nameOf = (card) => (card.name || '').toLowerCase();

  let matches = cards.filter((card) => nameOf(card) === needle);
  if (matches.length === 0) {
    matches = cards.filter((card) => nameOf(card).includes(needle));
  }

  return matches.map((card) => ({
    name: card.name,
    imageUrl: card.image ?? null,
    link: SITE_URL,
  }));
}

module.exports = {
  prefixes: ['fcg', 'fnaf'],
  label: 'FNAF Card Game',
  search,
};
