const fetch = require('node-fetch');

/**
 * Pokemon TCG, via the Pokemon TCG API.
 * Docs: https://docs.pokemontcg.io/
 *
 * A single Pokemon card name (e.g. "Pikachu") can have dozens of different
 * printings - different sets, different effects - so this module returns
 * every matching printing rather than guessing which one the user meant.
 * The bot pages through them with Prev/Next buttons.
 *
 * An API key is optional (raises your rate limit, doesn't gate functionality).
 * Set POKEMONTCG_API_KEY in .env to use one.
 */
async function fetchCards(query) {
  const headers = {};
  if (process.env.POKEMONTCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMONTCG_API_KEY;
  }

  // Exact phrase match first - groups every printing of this exact name together
  // rather than pulling in unrelated cards that merely start with the same text.
  const exactUrl = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`name:"${query}"`)}&pageSize=250`;
  let res = await fetch(exactUrl, { headers });
  if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
  let data = await res.json();

  // No exact-name hit - fall back to a prefix wildcard for typo/partial tolerance.
  if (!data.data || data.data.length === 0) {
    const wildcardUrl = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`name:"${query}*"`)}&pageSize=250`;
    res = await fetch(wildcardUrl, { headers });
    if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
    data = await res.json();
  }

  return data.data ?? [];
}

async function search(query) {
  const cards = await fetchCards(query);

  return cards.map((card) => ({
    name: card.name,
    imageUrl: card.images?.large ?? card.images?.small ?? null,
    link: card.tcgplayer?.url ?? null,
    subtitle: `${card.set?.name ?? 'Unknown set'} - #${card.number ?? '?'}`,
  }));
}

module.exports = {
  prefixes: ['pkmn', 'pokemon', 'pokemontcg'],
  label: 'Pokemon',
  search,
};
