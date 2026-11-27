import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, chmodSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { randomBytes,scrypt,timingSafeEqual,createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { kinds } from './schema.mjs';
const derive=promisify(scrypt);
let connection;
export function db(){
 if(connection)return connection;
 const file=resolve(process.env.DB_PATH||'var/cafe.sqlite');
 mkdirSync(dirname(file),{recursive:true,mode:0o700});
 connection=new DatabaseSync(file);chmodSync(file,0o600);
 connection.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
 connection.exec(readFileSync(new URL('./001.sql',import.meta.url),'utf8'));
 return connection;
}
export function atomic(fn){
 const c=db();c.exec('BEGIN IMMEDIATE');
 try{const result=fn(c);c.exec('COMMIT');return result}catch(err){c.exec('ROLLBACK');throw err}
}
export function log(c,user,action,target,before=null,after=null){
 c.prepare('INSERT INTO audit(actor,action,target,previous,next) VALUES(?,?,?,?,?)').run(user,action,target,before===null?null:JSON.stringify(before),after===null?null:JSON.stringify(after));
}
export function random(){return randomBytes(32).toString('hex')}
export function digest(str){return createHash('sha256').update(str).digest('hex')}
export const goodUser=v=>typeof v==='string'&&/^[a-z][a-z0-9._-]{2,39}$/.test(v);
export function goodPassword(v){return typeof v==='string'&&v.length>=14&&Buffer.byteLength(v)<=256}
const settings={N:32768,r:8,p:1,maxmem:64*1024*1024};
export async function hash(v){const salt=randomBytes(16).toString('hex');return salt+':'+(await derive(v,salt,64,settings)).toString('hex')}
export async function verify(v,stored){
 const [salt,h]=stored?stored.split(':'):['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','0'.repeat(128)];
 return timingSafeEqual(await derive(v,salt,64,settings),Buffer.from(h,'hex'))&&!!stored;
}
export function publicData(){
 const data=Object.fromEntries(kinds.map(k=>[k,['products','categories','gallery','social'].includes(k)?[]:Object.create(null)]));
 for(const row of db().prepare('SELECT kind,slug,live FROM records WHERE live IS NOT NULL').iterate()){
   const v={...JSON.parse(row.live),slug:row.slug};
   if(Array.isArray(data[row.kind]))data[row.kind].push(v);else data[row.kind][row.slug]=v;
 }
 data.products=data.products.filter(p=>p.available!==false&&Number.isFinite(p.price)&&data.categories.some(c=>c.slug===p.category));
 for(const v of Object.values(data))if(Array.isArray(v))v.sort((a,b)=>(a.order??999999)-(b.order??999999)||a.slug.localeCompare(b.slug));
 return data;
}
