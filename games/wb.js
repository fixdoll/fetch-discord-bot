const fetch = require('node-fetch');
const Papa = require('papaparse');

/**
 * A friend's homebrew card game, read straight from a Google Sheet.
 *
 * PASTE YOUR PUBLISHED CSV LINK HERE ↓
 * (Google Sheets: File -> Share -> Publish to web -> pick the right tab ->
 * format: Comma-separated values (.csv) -> Publish -> copy the link it gives you)
 */
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMS3HJCErMbdSTxmVnm5jG-GrSp_TD9TE5dbUAH2n1By37RIc45Jj5sgPQJyjtNXBoI3XdHW0aJWBp/pub?output=csv';

// The sheet gets edited at most daily, so there's no need to refetch on
// every search - this just avoids hammering Google on a busy day. Lower
// this (or delete the cache entirely) while you're actively testing
// changes to the sheet, since a fresh edit won't show up until this
// expires.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache = { rows: null, fetchedAt: 0 };

async function getAllCards() {
  const isFresh = cache.rows && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cache.rows;

  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Sheet fetch error: ${res.status}`);

  const csvText = await res.text();
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  cache = { rows: parsed.data, fetchedAt: Date.now() };
  return parsed.data;
}

function buildDescription(row) {
  const lines = [];

  if (row['Mana Cost']) lines.push(row['Mana Cost']);

  const typeLine = [row['Type'], row['Subtype']].filter(Boolean).join(' — ');
  if (typeLine) lines.push(typeLine);

  if (row['Oracle Text']) {
    if (lines.length > 0) lines.push(''); // blank line before the body text
    lines.push(row['Oracle Text']);
  }

  if (row['Expend Value']) {
    lines.push(''); // blank line before the expend value
    lines.push(`{${row['Expend Value']}}`);
  }

  return lines.join('\n');
}

async function search(query) {
  const rows = await getAllCards();
  const needle = query.toLowerCase();

  const nameOf = (row) => (row['Name'] || '').toLowerCase();

  let matches = rows.filter((row) => nameOf(row) === needle);
  if (matches.length === 0) {
    matches = rows.filter((row) => nameOf(row).includes(needle));
  }

  return matches.map((row) => ({
    name: row['Name'],
    imageUrl: null,
    description: buildDescription(row),
    link: null,
  }));
}

module.exports = {
  prefixes: ['wb', 'wb3'],
  label: 'Wizard Battle 3',
  search,
};
