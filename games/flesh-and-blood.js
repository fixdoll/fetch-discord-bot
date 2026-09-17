const fetch = require('node-fetch');

/**
 * Flesh and Blood, via goagain.
 * Docs: https://api.goagain.dev/ (landing page + Swagger at /docs)
 * GitHub: https://github.com/oleiade/goagain
 * No API key required - it's fully open, no auth of any kind.
 *
 * NOTE: `name` does a partial/substring match per their docs, so this
 * returns every hit rather than assuming a single best match - useful
 * since FaB has lots of same-named cards across different pitch values
 * (e.g. "Command and Conquer" exists at multiple pitches).
 *
 * IMAGE FIELD - unresolved without a live sample:
 * goagain sources its data from the community flesh-and-blood-cards
 * project, which publishes card data in two shapes: a "flattened" one
 * where `image_url` sits at the top level of each card/printing, and a
 * nested one where it's under `printings[i].image_url`. Which shape
 * goagain's own API actually returns couldn't be confirmed - the
 * sandbox this was built in couldn't reach api.goagain.dev to inspect
 * a real response. The code below checks both. If names/search still
 * work but images still don't show up, uncomment the console.log line
 * in search() below, run one search, and paste the logged object back
 * to Claude (or just eyeball it) to get the real field name.
 */
async function search(query) {
  const url = `https://api.goagain.dev/v1/cards?name=${encodeURIComponent(query)}&limit=25`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`goagain error: ${res.status}`);

  const body = await res.json();
  const cards = body.data ?? [];

  // Uncomment to see exactly what a real card object looks like:
  // if (cards[0]) console.log(JSON.stringify(cards[0], null, 2));

  return cards.map((card) => {
    const firstPrinting = Array.isArray(card.printings) ? card.printings[0] : null;

    const imageUrl =
      card.image_url ??
      card.imageUrl ??
      card.image ??
      firstPrinting?.image_url ??
      firstPrinting?.imageUrl ??
      null;

    const subtitleParts = [card.class, card.type].filter(Boolean);
    if (card.pitch) subtitleParts.push(`pitch ${card.pitch}`);

    return {
      name: card.name,
      imageUrl,
      link: null, // goagain is API/MCP-only, no browsable card page to link to
      subtitle: subtitleParts.join(' · ') || undefined,
    };
  });
}

module.exports = {
  prefixes: ['fab', 'fnb'],
  label: 'Flesh and Blood',
  search,
};
