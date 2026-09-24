const fetch = require('node-fetch');

/**
 * Disney Lorcana, via Lorcast (lorcast.com) - the Scryfall-equivalent for
 * this game: dedicated, free, no key required.
 * Docs: https://lorcast.com/docs/api/cards
 *
 * Lorcana character cards are identified by NAME + VERSION (e.g. "Elsa -
 * Spirit of Winter" vs "Elsa - Snow Queen" are different gameplay cards
 * with different stats), so a name search naturally returns multiple
 * distinct results per character even before counting reprints. On top
 * of that, `unique=prints` (rather than the default `unique=cards`)
 * also surfaces alternate-art/foil printings of each of those, matching
 * how other games in this bot (Pokemon, Riftbound) handle variants.
 */
async function search(query) {
  const url = `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(query)}&unique=prints`;
  const res = await fetch(url);

  // Lorcast returns 404 for a query with no matches, not an empty array.
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Lorcast error: ${res.status}`);

  const body = await res.json();
  const cards = Array.isArray(body?.results) ? body.results : [];

  return cards.map((card) => {
    const displayName = card.version ? `${card.name} - ${card.version}` : card.name;

    const subtitleParts = [card.set?.name, card.collector_number && `#${card.collector_number}`, card.rarity].filter(
      Boolean,
    );

    return {
      name: displayName,
      imageUrl: card.image_uris?.digital?.normal ?? null,
      link: null,
      subtitle: subtitleParts.join(' · ') || undefined,
    };
  });
}

module.exports = {
  prefixes: ['lorcana', 'lor'],
  label: 'Disney Lorcana',
  search,
};
