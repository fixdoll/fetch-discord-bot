const fetch = require('node-fetch');

/**
 * Riftbound (Riot Games' TCG), via Riftcodex.
 * Docs: https://riftcodex.com/docs/endpoints/cards/
 * No API key required for read access.
 *
 * Riftcodex's /cards/name endpoint takes either `exact` or `fuzzy`. We use
 * fuzzy so typos and partial names still resolve, and - like Pokemon -
 * return every hit rather than guessing, since alternate-art/promo
 * printings of the same name are legitimately different cards.
 */
async function search(query) {
  const url = `https://api.riftcodex.com/cards/name?fuzzy=${encodeURIComponent(query)}&size=100`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Riftcodex error: ${res.status}`);

  const data = await res.json();
  const cards = data.items ?? [];

  return cards.map((card) => ({
    name: card.name,
    imageUrl: card.media?.image_url ?? null,
    link: `https://riftcodex.com/search?query=${encodeURIComponent(card.name)}`,
    subtitle: `${card.set?.label ?? 'Unknown set'} · #${card.collector_number ?? '?'}`,
  }));
}

module.exports = {
  prefixes: ['rb', 'riftbound'],
  label: 'Riftbound',
  search,
};
