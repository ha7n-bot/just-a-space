import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {crc32,deflateSync} from 'node:zlib';
import {db,publicData} from '../cms/db.mjs';
import {handleAdmin} from '../cms/index.mjs';
import {validate} from '../cms/schema.mjs';
import {sanitizePNG} from '../cms/media.mjs';

function png(){
 const chunk=(s,d)=>{const p=Buffer.concat([Buffer.from(s),d]),n=Buffer.alloc(4),crc=Buffer.alloc(4);n.writeUInt32BE(d.length);crc.writeUInt32BE(crc32(p));return Buffer.concat([n,p,crc])};
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',Buffer.from([0,0,0,1,0,0,0,1,8,2,0,0,0])),chunk('IDAT',deflateSync(Buffer.from([0,32,128,160]))),chunk('IEND',Buffer.alloc(0))]);
}
test('CMS integration through HTTP and isolated SQLite',async t=>{
 const temp=await mkdtemp(join(tmpdir(),'jas-cms-'));process.env.DB_PATH=join(temp,'test.sqlite');
 const password='automated '+String(Math.random())+' fixture passphrase';
 execFileSync(process.execPath,['cms/owner.mjs','owner'],{input:password});
 const server=createServer((req,res)=>handleAdmin(req,res,new URL(req.url,'http://localhost')));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.SITE_ORIGIN=base;
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));db().close();await rm(temp,{recursive:true,force:true})});
 const get=(path,cookie)=>fetch(base+path,{headers:cookie?{cookie}:{},redirect:'manual'});
 const post=(path,body,cookie,origin=base)=>fetch(base+path,{method:'POST',headers:{origin,...(cookie?{cookie}:{})},body:new URLSearchParams(body),redirect:'manual'});
 const signIn=async(username)=>{
   const r=await post('/admin/login',{username,password});assert.equal(r.status,303);const cookie=r.headers.get('set-cookie').split(';')[0];
   const home=await(await get('/admin',cookie)).text(),csrf=/name="csrf" value="([a-f0-9]{64})"/.exec(home)[1];return {cookie,csrf};
 };
 const transition=async(role,k,slug,op,revision,extra={})=>post('/admin/records/'+k+'/'+slug+'/'+op,{csrf:role.csrf,revision,...extra},role.cookie);
 const evidence={source:'https://example.org/menu',verified:'2025-01-01'};
 let owner,manager,viewer,photo;
 await t.test('login, origin, cookie and authentication boundaries',async()=>{
   assert.equal((await get('/admin')).headers.get('location'),'/admin/login?lang=ar');
   assert.equal((await post('/admin/login',{username:'owner',password},null,'https://example.org')).status,403);
   assert.equal((await post('/admin/login',{username:'owner',password:password+'wrong'})).status,401);
   owner=await signIn('owner');
   assert.equal((await post('/admin/users/create',{csrf:'x',username:'viewer'},owner.cookie)).status,403);
   const p=await get('/admin',owner.cookie);assert.equal(p.headers.get('x-frame-options'),'DENY');assert.ok((await p.text()).includes('المالك'));
 });
 await t.test('role creation, viewer read-only and manager restrictions',async()=>{
   for(const [username,role] of [['viewer','VIEWER'],['editor','CONTENT_MANAGER']])assert.equal((await post('/admin/users/create',{csrf:owner.csrf,username,password,role},owner.cookie)).status,303);
   viewer=await signIn('viewer');manager=await signIn('editor');
   assert.equal((await get('/admin/users',manager.cookie)).status,403);
   assert.equal((await get('/admin/records/gallery/new',viewer.cookie)).status,403);
   assert.equal((await get('/admin/records/gallery',viewer.cookie)).status,200);
   assert.equal((await transition(viewer,'gallery','new','save',0,{key:'a'})).status,403);
   assert.equal((await transition(manager,'settings','new','save',0,{key:'business'})).status,403);
 });
 async function publish(k,key,f){
   assert.equal((await transition(manager,k,'new','save',0,{key,...evidence,...f})).status,303);
   assert.equal((await transition(manager,k,key,'pending',1)).status,303);
   assert.equal((await transition(manager,k,key,'published',2,{attest:'yes'})).status,403);
   assert.equal((await transition(owner,k,key,'published',2,{attest:'yes'})).status,303);
 }
 const prod={'name.ar':'منتج تجريبي','name.en':'Test item',category:'drinks',price:'17.25',available:'yes',featured:'yes',variants:JSON.stringify([{name:{ar:'كبير',en:'Large'},price:20}])};
 await t.test('category and product revision, editing, stale write, price and archive',async()=>{
   await publish('categories','drinks',{'name.ar':'مشروبات','name.en':'Drinks'});
   await publish('products','test',prod);assert.equal(publicData().products[0].price,17.25);assert.equal(publicData().products[0].variants[0].price,20);
   assert.equal((await transition(manager,'products','test','save',1,{...prod,price:22})).status,409);
   assert.equal((await transition(manager,'products','test','save',3,{...prod,...evidence,price:22})).status,303);
   assert.equal(publicData().products[0].price,17.25);
   assert.equal((await transition(manager,'products','test','pending',4)).status,303);
   assert.equal((await transition(owner,'products','test','published',5,{attest:'yes'})).status,303);assert.equal(publicData().products[0].price,22);
   assert.equal((await transition(manager,'products','test','archived',6)).status,303);assert.equal(publicData().products.length,0);
   assert.equal((await transition(manager,'products','test','draft',7)).status,303);assert.equal(publicData().products.length,0);
 });
 await t.test('price required at publish and malformed historical rows hidden',async()=>{
   assert.throws(()=>validate('products','test',{name:{ar:'أ',en:'A'},category:'drinks',price:''}));
   assert.equal((await transition(manager,'products','new','save',0,{...prod,key:'missing',...evidence,price:''})).status,303);
   assert.equal((await transition(manager,'products','missing','pending',1)).status,303);
   assert.equal((await transition(owner,'products','missing','published',2,{attest:'yes'})).status,400);
   db().prepare("UPDATE records SET live=? WHERE kind='products' AND slug='missing'").run(JSON.stringify({price:'',name:{ar:'أ',en:'A'},category:'drinks'}));
   assert.equal(publicData().products.length,0);
 });
 await t.test('authorized PNG validation, staged media and publication; invalid images rejected',async()=>{
   assert.throws(()=>sanitizePNG(Buffer.from('not an image')));
   const f=new FormData();f.append('csrf',manager.csrf);f.append('image',new Blob([png()],{type:'image/png'}),'photo.png');
   const upload=await fetch(base+'/admin/upload',{method:'POST',headers:{origin:base,cookie:manager.cookie},body:f});
   assert.equal(upload.status,201);photo=/\/admin-media\/[a-f0-9]{64}\.png/.exec(await upload.text())[0];
   assert.equal((await get(photo)).status,404);
   await publish('gallery','counter',{'name.en':'Counter','name.ar':'منضدة',image:photo,'alt.en':'Counter','alt.ar':'منضدة',creator:'QA',rights:'Test-only',width:1,height:1});
   const img=await get(photo);assert.equal(img.status,200);assert.equal(img.headers.get('content-type'),'image/png');
 });
 await t.test('special hours, audit and immediate session revocation',async()=>{
   await publish('hours','schedule',{weekly:'{"0":[["18:00","02:00"]]}',special:'{"2026-01-01":[]}'});
   assert.deepEqual(publicData().hours.schedule.special,{'2026-01-01':[]});
   assert.ok((await(await get('/admin/audit',owner.cookie)).text()).includes('products/test'));
   const id=db().prepare("SELECT id FROM users WHERE username='editor'").get().id;
   assert.equal((await post('/admin/users/'+id+'/disable',{csrf:owner.csrf},owner.cookie)).status,303);
   assert.equal((await get('/admin',manager.cookie)).status,303);
   assert.equal((await post('/admin/logout',{csrf:viewer.csrf},viewer.cookie)).status,303);
   assert.equal((await get('/admin',viewer.cookie)).status,303);
 });
});
