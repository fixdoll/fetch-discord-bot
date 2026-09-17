const fetch = require('node-fetch');

/**
 * One Piece Card Game, via OPTCG API (optcgapi.com).
 * Docs: https://optcgapi.com/documentation
 * No API key required - free, open, read-only.
 *
 * NOTE on the query param: optcgapi.com's own docs page is a JS-driven
 * dropdown that doesn't expose per-endpoint params to a plain fetch, so
 * this was first built with `name=` (copied from a *different* One Piece
 * API's docs by mistake) and got HTTP 400 back - that param isn't
 * recognized here. Switched to `card_name`, matching the field name
 * optcgapi.com's own Card model uses everywhere else (card_name,
 * set_name, set_id, card_image are all confirmed via their Go SDK's
 * model definitions and changelog). This is a strong guess based on
 * that naming convention, not a confirmed-working request - if this
 * still 400s, the real param name needs to come from actually opening
 * https://optcgapi.com/documentation in a browser and picking
 * "/api/sets/filtered/" from the dropdown to see its param list.
 */
async function search(query) {
  const url = `https://optcgapi.com/api/sets/filtered/?card_name=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FetchDiscordBot/1.0)' },
  });

  if (!res.ok) throw new Error(`OPTCG API error: ${res.status}`);

  const body = await res.json();

  const cards = Array.isArray(body)
    ? body
    : Array.isArray(body?.results)
      ? body.results
      : Array.isArray(body?.cards)
        ? body.cards
        : [];

  // Confirmed fields (via optcgapi-go-sdk's models package, which mirrors
  // optcgapi.com's documented JSON exactly): card_name, set_name, set_id,
  // rarity, card_image. "category" was an unconfirmed guess from a
  // different API's docs - dropped rather than risk another wrong field.
  return cards.map((card) => {
    const subtitleParts = [card.set_name, card.rarity].filter(Boolean);

    return {
      name: card.card_name ?? card.name,
      imageUrl: card.card_image ?? null,
      link: null,
      subtitle: subtitleParts.join(' · ') || undefined,
    };
  });
}

module.exports = {
  prefixes: ['op', 'onepiece'],
  label: 'One Piece',
  search,
};
