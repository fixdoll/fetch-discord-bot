// Each game module must export:
//   {
//     prefixes: string[],  // every command that should trigger this module, e.g. ['mtg', 'magic']
//     label: string,
//     search: async (query) => Array<{ name, imageUrl, link, subtitle?, description? }>, // [] if no match
//   }
//
// search() returns an ARRAY, not a single result - some games (Pokemon,
// YGO substring search) legitimately have multiple cards for one query,
// and the bot pages through them with Prev/Next buttons. Games with a
// single best match just return a one-element array. `description` is for
// text-only cards with no image (e.g. wb) - it renders as the embed body.
//
// To add a new game: create games/<yourgame>.js implementing that shape,
// then require() + list it below. Nothing else in the bot needs to change.
// To add another alias to an existing game, just add it to that module's
// `prefixes` array - the registry picks it up automatically.

const mtg = require('./mtg');
const ygo = require('./ygo');
const pokemon = require('./pokemon');
const riftbound = require('./riftbound');
const sts2 = require('./sts2');
const fleshAndBlood = require('./flesh-and-blood');
const onepiece = require('./onepiece');
const wb = require('./wb');

const modules = [mtg, ygo, pokemon, riftbound, sts2, fleshAndBlood, onepiece, wb];

const registry = new Map();
for (const mod of modules) {
  for (const prefix of mod.prefixes) {
    if (registry.has(prefix)) {
      throw new Error(
        `Duplicate prefix ",${prefix}" - already registered to "${registry.get(prefix).label}", ` +
        `can't also register it to "${mod.label}"`
      );
    }
    registry.set(prefix, mod);
  }
}

module.exports = registry;
