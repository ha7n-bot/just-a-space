import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { snapshot } from '../ops/snapshot.mjs';

test('online snapshot and restore preserve committed content, clear sessions, and refuse overwrites', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'cafe-backup-test-'));
  const [source, copy, restore] = ['live.sqlite', 'snapshot.sqlite', 'restored.sqlite'].map(name => join(folder, name));
  const live = new DatabaseSync(source);
  try {
    live.exec(readFileSync(new URL('../cms/001.sql', import.meta.url), 'utf8'));
    live.exec(`PRAGMA journal_mode=WAL;
      INSERT INTO users (username,hash,role) VALUES ('operator','mock','OWNER');
      INSERT INTO sessions (token,user_id,csrf,expires) VALUES ('example',1,'mock',1);
      INSERT INTO attempts VALUES ('example',1,1);
      INSERT INTO audit (actor,action,target) VALUES ('operator','example','recovery-drill');`);
    await snapshot(source, copy);
    assert.equal(statSync(copy).mode & 0o777, 0o600);
    await assert.rejects(snapshot(source, copy), {code:'EEXIST'});
    assert.equal(live.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 1);
    await snapshot(copy, restore);
    const restored = new DatabaseSync(restore, {readOnly:true});
    try {
      assert.equal(restored.prepare('SELECT target FROM audit').get().target, 'recovery-drill');
      assert.equal(restored.prepare('SELECT role FROM users').get().role, 'OWNER');
      assert.equal(restored.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
      assert.equal(restored.prepare('SELECT COUNT(*) AS n FROM attempts').get().n, 0);
    } finally {
      restored.close();
    }
  } finally {
    live.close();
    rmSync(folder, {recursive:true, force:true});
  }
});
