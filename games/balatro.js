const fetch = require('node-fetch');
const Papa = require('papaparse');

/**
 * Balatro Jokers, read from a Google Sheet (same pattern as wb.js).
 * Populate the sheet with scrape-balatro-jokers.js's output CSV
 * (columns: Name, Effect, Image URL), then publish it to the web as CSV
 * and paste that link below.
 *
 * PASTE YOUR PUBLISHED CSV LINK HERE ↓
 * (Google Sheets: File -> Share -> Publish to web -> pick the right tab ->
 * format: Comma-separated values (.csv) -> Publish -> copy the link it gives you)
 */
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQtvUg3KPX9MJTYVzvwS3cnsLTKaZn88koRQYRPvkqha8WEKGZs54db2Yq7xLWEue6wyTFMxeJ8uQLe/pub?gid=1192839613&single=true&output=csv';

// The joker list barely changes (only with major game updates), so this
// can be generous - lower it while actively re-testing sheet edits.
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
    imageUrl: row['Image URL'] || null,
    description: row['Effect'] || undefined,
    link: null,
  }));
}

module.exports = {
  prefixes: ['bal', 'balatro'],
  label: 'Balatro',
  search,
};
