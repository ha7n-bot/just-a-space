// Creates a new disposable directory. This tool has no input database argument.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scratch = mkdtempSync(join(tmpdir(), 'jas-ci-'));
process.env.DB_PATH = join(scratch, 'fixture.sqlite');
const { db } = await import('../cms/db.mjs');
const database = db();
const insert = database.prepare("INSERT INTO records(kind,slug,draft,live,state,source,verified,revision) VALUES (?,?,?,?,'PUBLISHED','CI-only fixture','2000-01-01',1)");
function record(kind, slug, value) {
  const json = JSON.stringify(value);
  insert.run(kind, slug, json, json);
}
record('categories', 'qa-drinks', {name: {ar: 'فئة الاختبار', en: 'Test drinks'}});
record('categories', 'qa-other', {name: {ar: 'فئة أخرى', en: 'Other test category'}});
const product = {
  name: {ar:'صنف تجريبي', en:'QA sample'}, category:'qa-drinks', price:15.5,
  available:true, seasonal:true, featured:true, temperature:'cold',
  variants:[{name:{ar:'حجم تجريبي',en:'Test size'},price:20}]
};
record('products','qa-sample', product);
record('products','qa-other-product', {...product,name:{ar:'عينة ثانية',en:'Second fixture'},category:'qa-other'});
record('products','qa-hidden', {...product,name:{ar:'غير متاح',en:'Hidden fixture'},available:false});
record('products','qa-unpriced', {...product,name:{ar:'دون سعر',en:'Unpriced fixture'},price:null});
database.close();
process.stdout.write(process.env.DB_PATH);
