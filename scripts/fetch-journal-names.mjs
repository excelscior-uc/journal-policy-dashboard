#!/usr/bin/env node
// Resolve abbreviated journal names to full titles via NLM Catalog (E-utilities)
// with CrossRef fallback. Writes public/data/journal-names.json (abbrev -> full).
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('public/data');
const OUT = path.join(DATA_DIR, 'journal-names.json');
const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));

async function collectAbbrevs() {
  const files = (await readdir(DATA_DIR)).filter(f => f.endsWith('.json') && f !== 'journal-names.json');
  const set = new Set();
  for (const f of files) {
    const j = JSON.parse(await readFile(path.join(DATA_DIR, f), 'utf8'));
    for (const jr of (j.journals ?? [])) if (jr?.name) set.add(jr.name);
  }
  return [...set].sort();
}

async function nlmLookup(abbrev) {
  // NLM Catalog: search title abbreviation field [ta]
  const term = encodeURIComponent(`${abbrev}[ta]`);
  const search = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nlmcatalog&term=${term}&retmode=json&retmax=5`;
  const r = await fetch(search);
  if (!r.ok) return null;
  const sj = await r.json();
  const ids = sj?.esearchresult?.idlist ?? [];
  if (!ids.length) return null;
  await SLEEP(120);
  const sum = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nlmcatalog&id=${ids.join(',')}&retmode=json`;
  const r2 = await fetch(sum);
  if (!r2.ok) return null;
  const j2 = await r2.json();
  const res = j2?.result;
  if (!res) return null;
  // Prefer entries that look like currently-indexed journals
  for (const id of ids) {
    const it = res[id];
    if (!it) continue;
    const title = it.titlemainlist?.[0]?.title || it.title;
    if (title) return String(title).replace(/\.$/, '').trim();
  }
  return null;
}

async function crossrefLookup(abbrev) {
  const url = `https://api.crossref.org/journals?query=${encodeURIComponent(abbrev)}&rows=5`;
  const r = await fetch(url, { headers: { 'User-Agent': 'journal-policy-dashboard/1.0 (mailto:zoubaida.benmakrane@gmail.com)' } });
  if (!r.ok) return null;
  const j = await r.json();
  const items = j?.message?.items ?? [];
  if (!items.length) return null;
  // Heuristic: pick item whose title initials roughly match the abbrev
  const norm = s => String(s).toUpperCase().replace(/[^A-Z ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const ab = norm(abbrev);
  const abTokens = ab.split(' ');
  let best = null, bestScore = -1;
  for (const it of items) {
    const t = it.title || '';
    const nt = norm(t);
    const ntTokens = nt.split(' ');
    let score = 0;
    for (let i = 0; i < abTokens.length && i < ntTokens.length; i++) {
      if (ntTokens[i].startsWith(abTokens[i])) score += 2;
      else if (ntTokens[i][0] === abTokens[i][0]) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}

async function resolve(abbrev) {
  try {
    const v = await nlmLookup(abbrev);
    if (v) return { full: v, source: 'nlm' };
  } catch {}
  await SLEEP(150);
  try {
    const v = await crossrefLookup(abbrev);
    if (v) return { full: v, source: 'crossref' };
  } catch {}
  return { full: null, source: 'unresolved' };
}

async function main() {
  const abbrevs = await collectAbbrevs();
  console.log(`Resolving ${abbrevs.length} unique abbreviations…`);
  let existing = {};
  try { existing = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
  const out = { ...existing };
  let i = 0;
  for (const ab of abbrevs) {
    i++;
    if (out[ab]?.full) { console.log(`[${i}/${abbrevs.length}] ${ab} (cached) -> ${out[ab].full}`); continue; }
    const res = await resolve(ab);
    out[ab] = res;
    console.log(`[${i}/${abbrevs.length}] ${ab} -> ${res.full ?? '???'} (${res.source})`);
    await SLEEP(350); // be polite to NCBI (max ~3 req/s)
    if (i % 10 === 0) await writeFile(OUT, JSON.stringify(out, null, 2));
  }
  await writeFile(OUT, JSON.stringify(out, null, 2));
  const missing = Object.entries(out).filter(([, v]) => !v.full).map(([k]) => k);
  console.log(`Done. Unresolved: ${missing.length}`);
  if (missing.length) console.log(missing.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
