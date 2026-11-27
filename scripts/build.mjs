import { cpSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { locales, pages } from '../config/business.mjs';
import { renderPage } from '../web/render.mjs';

// Always render previews from a fresh database, never from a production copy.
const temp = mkdtempSync(join(tmpdir(),'jas-build-'));
process.env.DB_PATH = join(temp, 'empty.sqlite');
try {
  const { publicData } = await import('../cms/index.mjs');
  const data = await publicData();
  for (const lang of locales) {
    for (const path of [...pages, '404', '500']) {
      const folder = join('dist', lang, path);
      mkdirSync(folder, {recursive:true});
      writeFileSync(join(folder,'index.html'), renderPage({lang,path,data,production:false}));
    }
  }
  cpSync('web/assets','dist/assets',{recursive:true});
  writeFileSync('dist/index.html','<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/ar/"><title>JUST A SPACE</title><a href="/ar/">الدخول إلى الموقع</a></html>');
  writeFileSync('dist/robots.txt','User-agent: *\nDisallow: /\n');
  console.log('Rendered bilingual staging pages and copied public assets');
} finally { rmSync(temp, {recursive:true,force:true}); }
