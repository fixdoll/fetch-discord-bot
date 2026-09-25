# Fetch

A Discord bot that fetches cards from multiple TCGs' card pools by prefix.

```
,mtg Black Lotus
,ygo Dark Magician
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your bot token:
   ```
   DISCORD_TOKEN=your-bot-token-here
   PREFIX=,
   ```
3. In the [Discord Developer Portal](https://discord.com/developers/applications), on your bot's page under
   **Bot**, enable the **Message Content Intent** toggle — the bot can't read command text without it.
4. Invite the bot to your server with the `bot` scope and at least
   `Send Messages` + `Embed Links` permissions.
5. `npm start`

## Currently supported

| Prefixes | Game | Source |
|---|---|---|
| `,mtg`, `,magic` | Magic: The Gathering | [Scryfall](https://scryfall.com/docs/api) |
| `,ygo`, `,yugioh` | Yu-Gi-Oh! | [YGOPRODeck](https://ygoprodeck.com/api-guide/) |
| `,pkmn`, `,pokemon` | Pokémon | [Pokémon TCG API](https://pokemontcg.io/) |
| `,rb`, `,riftbound` | Riftbound | [Riftcodex](https://riftcodex.com/) |
| `,sts2`, `,spire2` | Slay the Spire 2 | [Spire Codex](https://spire-codex.com/developers) |
| `,fab`, `,fnb` | Flesh and Blood | [goagain](https://api.goagain.dev/) |
| `,op`, `,onepiece` | One Piece | [OPTCG API](https://optcgapi.com/) |
| `,lorcana`, `,lor` | Disney Lorcana | [Lorcast](https://lorcast.com/docs/api/cards) |
| `,bal`, `,balatro` | Balatro (Jokers) | Your own Google Sheet — see setup below |

Spire Codex's optional `SPIRECODEX_API_KEY` in `.env` just raises your rate
limit - not required, and barely matters here since the bot caches the
full card list in memory for an hour instead of re-querying per search.

Pokémon TCG's optional `POKEMONTCG_API_KEY` in `.env` just raises your rate
limit - the bot works fine without one.

### Browsing multiple matches

Some searches have more than one legitimate hit - Pokémon printings of the
same name, or a YGO substring search like `,ygo dragon`. When that happens
Fetch shows the first result with ◀ ▶ buttons under it so you can page
through the rest. Only the person who ran the command can use the buttons,
and they stop working after 5 minutes idle.

## Adding a new game

Each game is a self-contained module in `games/`. To add one:

1. Create `games/yourgame.js` exporting:
   ```js
   module.exports = {
     prefixes: ['xyz', 'alias'], // every command that should trigger this game
     label: 'Your Game',         // shown in the embed footer / error messages
     async search(query) {
       // return an ARRAY of { name, imageUrl, link, subtitle? } - [] if no match.
       // Return every legitimate match if there's more than one (e.g. same-name
       // reprints); the bot handles paging automatically. Single-match games
       // just return a one-element array.
     },
   };
   ```
2. Add it to the `modules` array in `games/registry.js`.

That's it — the bot's routing logic doesn't need to change.

### Adding an alias to an existing game

Just add it to that module's `prefixes` array, e.g. `prefixes: ['ygo', 'yugioh', 'yu-gi-oh']`.
No other file needs to change.

### Candidates for next games

- **Hearthstone** — shelved for now, no maintained live-search API found.
  [HearthstoneJSON](https://hearthstonejson.com/) (a card data dump) would
  be the fallback if this gets revisited - it'd need local fuzzy matching
  rather than hitting a live endpoint.
- **Original Slay the Spire** — also has no maintained live API (only
  [jhcheung/slay-the-spire-api](https://github.com/jhcheung/slay-the-spire-api),
  a self-hostable project rather than a hosted service). Slay the Spire 2 is
  supported instead via Spire Codex, above.

### A note on One Piece and Flesh and Blood

Both took a couple of iterations to land on the right query param and image
field (worth knowing if you're debugging either further): **One Piece** uses
`card_name=` against [OPTCG API](https://optcgapi.com/), and **Flesh and
Blood** (`games/flesh-and-blood.js`) checks a couple of possible image field
names since goagain's data source publishes card data in two different
shapes. Both are confirmed working as of the last test.

## Balatro (Jokers) setup

Balatro has no public card API (it's single-player, no official database),
so this one reads from a Google Sheet you populate and maintain yourself -
same pattern as a fully custom game (see `games/wb.js` for the general idea).

1. Run `node scrape-balatro-jokers.js` (no `npm install` needed, it's a
   standalone zero-dependency script) - it pulls every Joker's name, effect
   text, and image URL from the Balatro Fandom wiki's API and writes
   `balatro-jokers.csv`.
2. Import that CSV into a Google Sheet: File → Import → Upload.
3. Publish that sheet as CSV: File → Share → Publish to web → pick the
   right tab → format: Comma-separated values (.csv) → Publish.
4. Paste the resulting link into `games/balatro.js`, replacing the
   `SHEET_CSV_URL` placeholder near the top of the file.

The sheet needs exactly these column headers (which is what the scraper
already outputs): `Name`, `Effect`, `Image URL`. Search matches on `Name`
(exact match first, then substring), and results show both the image and
the effect text together in the same embed.

Since Balatro's Joker list barely changes (only with major game patches),
the module caches the sheet for 5 minutes by default - lower `CACHE_TTL_MS`
near the top of `games/balatro.js` while you're actively editing the sheet
and want changes to show up immediately.
