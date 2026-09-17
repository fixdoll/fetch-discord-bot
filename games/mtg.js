const fetch = require('node-fetch');

/**
 * Magic: The Gathering, via Scryfall.
 * Docs: https://scryfall.com/docs/api/cards/named
 *
 * The fuzzy-named endpoint always resolves to a single best match (Scryfall
 * does the disambiguation for us), so this returns a one-element array to
 * satisfy the shared search() -> results[] interface, not because there's
 * ever more than one result to page through.
 */
async function search(query) {
  const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`;
  const res = await fetch(url);

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Scryfall error: ${res.status}`);

  const card = await res.json();

  // Double-faced cards store images under card_faces instead of top-level image_uris
  const imageUrl =
    card.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.normal ??
    null;

  return [
    {
      name: card.name,
      imageUrl,
      link: card.scryfall_uri,
    },
  ];
}

module.exports = {
  prefixes: ['mtg', 'magic'],
  label: 'Magic: The Gathering',
  search,
};
