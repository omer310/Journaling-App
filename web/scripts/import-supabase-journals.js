/**
 * Import journal entries from a Supabase export into MongoDB.
 *
 * Supports two input formats:
 *   1. JSON  – a JSON array of rows, or { journal_entries: [] }
 *   2. PostgreSQL pg_dump – the raw cluster backup file produced by Supabase
 *
 * Usage:
 *   node scripts/import-supabase-journals.js <export-file>
 *
 * Required env vars (or set them inline):
 *   MONGODB_URI      – Atlas connection string
 *   MONGODB_DB       – Database name (default: soul_pages)
 *   CLERK_USER_ID    – Clerk user id that will own the imported entries
 *
 * Optional env var:
 *   DRY_RUN=1        – Print what would be imported without writing to MongoDB
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { MongoClient } = require('mongodb');

// ─── PostgreSQL COPY block parser ────────────────────────────────────────────

const PG_COPY_COLUMNS = [
  'id', 'title', 'content', 'user_id', 'date', 'tags',
  'source', 'last_modified', 'mood', 'created_at', 'updated_at',
];

/**
 * Parse a PostgreSQL COPY block (tab-separated, \N for NULL).
 * Handles the journal_entries table layout from Supabase cluster backups.
 */
function parsePgBackup(fileContent) {
  const startMarker = 'COPY public.journal_entries (';
  const startIdx = fileContent.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('No journal_entries COPY block found in backup file.');
  }

  // Skip past the header line to the data
  const dataStart = fileContent.indexOf('\n', startIdx) + 1;
  const dataEnd = fileContent.indexOf('\n\\.', dataStart);
  if (dataEnd === -1) {
    throw new Error('Could not find end of journal_entries COPY block.');
  }

  const dataBlock = fileContent.slice(dataStart, dataEnd);
  const rows = [];

  for (const rawLine of dataBlock.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    const cols = line.split('\t');
    if (cols.length < PG_COPY_COLUMNS.length) continue;

    const row = {};
    for (let i = 0; i < PG_COPY_COLUMNS.length; i++) {
      const val = cols[i];
      row[PG_COPY_COLUMNS[i]] = val === '\\N' ? null : val;
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a PostgreSQL array literal {val1,val2} into a JS string array.
 * Handles empty arrays ({} and {[]}) and UUID-only elements.
 */
function parsePgArray(pgVal) {
  if (!pgVal || pgVal === '{}' || pgVal === '{[]}') return [];

  const inner = pgVal.slice(1, -1); // strip outer { }
  if (!inner || inner === '[]') return [];

  const results = [];
  let buf = '';
  let depth = 0;

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];

    if (ch === '"') {
      // Skip quoted element (e.g. escaped JSON arrays from buggy export rows)
      i++;
      while (i < inner.length && !(inner[i] === '"' && inner[i - 1] !== '\\')) i++;
      continue;
    }

    if (ch === '{') { depth++; buf += ch; continue; }
    if (ch === '}') { depth--; buf += ch; continue; }

    if (ch === ',' && depth === 0) {
      const trimmed = buf.trim();
      if (trimmed) results.push(trimmed);
      buf = '';
    } else {
      buf += ch;
    }
  }

  const last = buf.trim();
  if (last) results.push(last);

  return results;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function toIsoDate(value, fallback) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function normalizeEntry(row, clerkUserId) {
  const now = new Date().toISOString();
  const originalUserId = row.user_id || null;

  const tags = Array.isArray(row.tags)
    ? row.tags
    : parsePgArray(typeof row.tags === 'string' ? row.tags : '');

  const lastModified = toIsoDate(row.last_modified || row.updated_at || row.created_at, now);

  return {
    id: row.id || randomUUID(),
    title: row.title || '',
    content: row.content || '',
    date: row.date || row.created_at || now,
    tags,
    user_id: clerkUserId,
    // Preserve the original Supabase UUID so encrypted content can still be
    // decrypted with the key that was derived from the old user id.
    encryption_user_id: originalUserId || clerkUserId,
    source: row.source === 'mobile' ? 'mobile' : 'web',
    last_modified: lastModified,
    mood: row.mood || null,
    created_at: toIsoDate(row.created_at, now),
    updated_at: toIsoDate(row.updated_at, lastModified),
  };
}

// ─── Load entries from file ──────────────────────────────────────────────────

function loadEntries(filePath) {
  const absPath = path.resolve(filePath);
  const content = fs.readFileSync(absPath, 'utf8');

  // Detect format by sniffing the first non-empty bytes
  const trimmed = content.trimStart();

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    // JSON format
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.journal_entries)) return parsed.journal_entries;
    if (Array.isArray(parsed.public?.journal_entries)) return parsed.public.journal_entries;
    throw new Error('Could not find journal entries in JSON export.');
  }

  // PostgreSQL backup format
  return parsePgBackup(content);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const [, , exportPath] = process.argv;

  if (!exportPath) {
    console.error([
      'Usage: node scripts/import-supabase-journals.js <export-file>',
      '',
      'Required env vars:',
      '  MONGODB_URI    – MongoDB Atlas connection string',
      '  CLERK_USER_ID  – Clerk user id to assign entries to',
      '',
      'Optional:',
      '  MONGODB_DB=soul_pages',
      '  DRY_RUN=1  (preview without writing)',
    ].join('\n'));
    process.exit(1);
  }

  const {
    MONGODB_URI,
    MONGODB_DB = 'soul_pages',
    CLERK_USER_ID,
    DRY_RUN,
  } = process.env;

  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI env var is required.');
    process.exit(1);
  }
  if (!CLERK_USER_ID) {
    console.error('Error: CLERK_USER_ID env var is required.');
    process.exit(1);
  }

  const rawRows = loadEntries(exportPath);
  const entries = rawRows.map((row) => normalizeEntry(row, CLERK_USER_ID));

  console.log(`Found ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} to import.`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first entry preview ---');
    if (entries.length > 0) {
      const preview = { ...entries[0] };
      if (preview.title.length > 60) preview.title = preview.title.slice(0, 60) + '…';
      if (preview.content.length > 80) preview.content = preview.content.slice(0, 80) + '…';
      console.log(JSON.stringify(preview, null, 2));
    }
    console.log('\nDry run complete. No data was written.');
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const collection = client.db(MONGODB_DB).collection('journal_entries');

    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ user_id: 1, last_modified: -1 });

    let upserted = 0;
    let skipped = 0;

    for (const entry of entries) {
      const result = await collection.updateOne(
        { id: entry.id },
        { $setOnInsert: entry },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        upserted++;
      } else {
        skipped++;
      }
    }

    console.log(`Done. ${upserted} inserted, ${skipped} already existed (skipped).`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
