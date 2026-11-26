// Copy with SQLite's online backup API. Publish a verified copy without overwriting an existing file.
import { DatabaseSync, backup } from 'node:sqlite';
import { chmodSync, linkSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function snapshot(sourceFile, targetFile) {
  const source = resolve(sourceFile);
  const target = resolve(targetFile);
  if (source === target) throw Error('Use a new destination path.');
  const targetDir = dirname(target);
  mkdirSync(targetDir, { recursive: true, mode: 0o700 });
  const workDir = mkdtempSync(join(targetDir, '.sqlite-copy-'));
  const workFile = join(workDir, basename(target));
  try {
    const original = new DatabaseSync(source, {readOnly: true});
    try {
      await backup(original, workFile);
    } finally {
      original.close();
    }
    chmodSync(workFile, 0o600);
    const copy = new DatabaseSync(workFile);
    try {
      copy.exec('PRAGMA journal_mode=DELETE; PRAGMA secure_delete=ON; BEGIN IMMEDIATE; DELETE FROM sessions; DELETE FROM attempts; COMMIT; VACUUM;');
      const integrity = copy.prepare('PRAGMA integrity_check').all();
      if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') throw Error('Database integrity check failed.');
      if (copy.prepare('PRAGMA foreign_key_check').get()) throw Error('Foreign key check failed.');
    } finally {
      copy.close();
    }
    linkSync(workFile, target);
  } finally {
    rmSync(workDir, {recursive: true, force: true});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [source, target] = process.argv.slice(2);
  if (!source || !target || process.argv.length !== 4) {
    console.error('Usage: node ops/snapshot.mjs SOURCE_DATABASE NEW_DESTINATION_DATABASE');
    process.exitCode = 2;
  } else {
    try {
      await snapshot(source, target);
      console.log('Verified snapshot created.');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
