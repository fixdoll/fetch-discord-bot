const fetch = require('node-fetch');

const MAX_RESULTS = 25; // keep paging sane; YGOPRODeck's substring match can return a lot

/**
 * Yu-Gi-Oh!, via YGOPRODeck.
 * Docs: https://ygoprodeck.com/api-guide/
 *
 * YGOPRODeck doesn't have a single "fuzzy" endpoint like Scryfall -
 * `fname` does a partial/substring match, which can genuinely return
 * several different cards (e.g. "Dragon"), so we return them all for paging
 * instead of guessing which one the user meant.
 */
async function search(query) {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`;
  const res = await fetch(url);

  if (res.status === 400) return []; // YGOPRODeck returns 400 when nothing matches
  if (!res.ok) throw new Error(`YGOPRODeck error: ${res.status}`);

  const data = await res.json();
  const cards = data?.data ?? [];

  return cards.slice(0, MAX_RESULTS).map((card) => ({
    name: card.name,
    imageUrl: card.card_images?.[0]?.image_url ?? null,
    link: `https://db.ygoprodeck.com/card/?search=${encodeURIComponent(card.name)}`,
  }));
}

module.exports = {
  prefixes: ['ygo', 'yugioh'],
  label: 'Yu-Gi-Oh!',
  search,
};
