import { readFileSync,statSync,realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { db,atomic,log,goodUser,goodPassword,hash,verify,digest,random,publicData } from './db.mjs';
import { fields,kinds,roles,validate,urlOk,calendarDate,validKey } from './schema.mjs';
import { view,esc } from './views.mjs';
import { sanitizePNG } from './media.mjs';
import { readStructured } from './structured.mjs';
export {publicData};
const css=readFileSync(new URL('./admin.css',import.meta.url));
const sessionTTL=8*60*60*1000;
const fail=(code,status)=>{throw Object.assign(Error(code),{status})};
const canEdit=(u,k)=>u?.role==='OWNER'||(u?.role==='CONTENT_MANAGER'&&k!=='settings');
const strictEqual=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===64&&b.length===64&&/^[a-f0-9]+$/.test(a)&&/^[a-f0-9]+$/.test(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function configured(){
 try{const u=new URL(process.env.SITE_ORIGIN);return (u.protocol==='https:'||u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname))&&!u.username&&!u.password&&u.href===u.origin+'/'?u:null}catch{return null}
}
const ckName=origin=>origin?.protocol==='https:'?'__Host-jas_admin':'jas_admin';
function cookie(origin,val,age){return ckName(origin)+'='+val+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+age+(origin.protocol==='https:'?'; Secure':'')}
function loginSession(req,origin){
 const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(ckName(origin)+'='))?.split('=')[1];
 if(!value||!/^[a-f0-9]{64}$/.test(value))return null;
 return db().prepare('SELECT users.id,username,role,csrf,token FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>? AND active=1').get(digest(value),Date.now());
}
function rate(bucket,count,ttl){
 atomic(c=>{
   const now=Date.now();c.prepare('DELETE FROM attempts WHERE expires<=?').run(now);c.prepare('DELETE FROM sessions WHERE expires<=?').run(now);
   const n=c.prepare('INSERT INTO attempts(bucket,count,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').get(bucket,now+ttl);
   if(n.count>count)fail('limit',429);
 });
}
async function readBody(req,limit){
 if(Number(req.headers['content-length'])>limit)fail('invalid',413);
 const blocks=[];let n=0;for await(const block of req){n+=block.length;if(n>limit)fail('invalid',413);blocks.push(block)}
 return Buffer.concat(blocks);
}
async function getForm(req){
 if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers['content-type']||''))fail('invalid',415);
 const pairs=new URLSearchParams((await readBody(req,96*1024)).toString());
 const out=Object.create(null);for(const [k,v] of pairs){if(Object.hasOwn(out,k))fail('invalid',400);out[k]=v}return out;
}
function matchesOrigin(req,origin){return origin&&req.headers.origin===origin.origin}
function payload(kind,form){
 const v={};
 for(const [k,r] of Object.entries(fields[kind])){
   const type=r.replace('!','');
   if(type==='bi'){
     const ar=(form[k+'.ar']||'').trim(),en=(form[k+'.en']||'').trim();
     if(ar||en)v[k]={ar,en};
   }else if(type==='bool'){v[k]=form[k]==='yes'}
   else if(['variants','special','weekly'].includes(type)&&form['structured.'+k]==='1'){
     try{v[k]=readStructured(type,k,form)}catch{fail('invalid',400)}
   }
   else{
     const raw=(form[k]||'').trim();if(!raw)continue;
     if(['money','order','dimension','lat','lng'].includes(type))v[k]=Number(raw);
     else if(['variants','special','weekly'].includes(type)){try{v[k]=JSON.parse(raw)}catch{fail('invalid',400)}}
     else v[k]=raw;
   }
 }
 return v;
}
function checkMedia(c,p){
 if(!p.image)return;
 if(p.image.startsWith('/admin-media/')){
   const m=c.prepare('SELECT width,height FROM media WHERE id=?').get(p.image.slice(13,-4));if(!m||p.width&&p.width!==m.width||p.height&&p.height!==m.height)fail('invalid',400);
 }else{
   try{
     const dir=realpathSync(fileURLToPath(new URL('../web/assets',import.meta.url))),file=realpathSync(dir+p.image.slice(7));
     if(!file.startsWith(dir+'/')||!statSync(file).isFile())fail('invalid',400);
   }catch{fail('invalid',400)}
 }
}
function saveRecord(user,k,slug,op,f){
 if(!kinds.includes(k)||!canEdit(user,k))fail('denied',403);
 const creating=slug==='new',key=creating?f.key:slug;
 if(!validKey(k,key)||key==='new')fail('invalid',400);
 return atomic(c=>{
   const prev=c.prepare('SELECT * FROM records WHERE kind=? AND slug=?').get(k,key);
   if(creating&&prev||prev&&String(prev.revision)!==f.revision)fail('conflict',409);
   if(!creating&&!prev)fail('missing',404);
   if(creating&&(op!=='save'||f.revision!=='0'))fail('invalid',400);
   let state=prev?.state,draft=prev?.draft,live=prev?.live??null,source=prev?.source||'',date=prev?.verified||'';
   if(op==='save'){
     if(state==='archived')fail('invalid',400);
     const p=payload(k,f);
     try{validate(k,key,p)}catch{fail('invalid',400)}
     checkMedia(c,p);
     draft=JSON.stringify(p);state='draft';source=f.source||'';date=f.verified||'';
     if(source&&!urlOk(source)||date&&(!calendarDate(date)||date>new Date(Date.now()+3*3600000).toISOString().slice(0,10)))fail('invalid',400);
   }else if(op==='pending'&&state==='draft')state='pending';
   else if(op==='published'&&state==='pending'){
     if(user.role!=='OWNER')fail('denied',403);
     if(!source||!date||f.attest!=='yes')fail('invalid',400);
     const p=JSON.parse(draft);
     try{validate(k,key,p)}catch{fail('invalid',400)}
     checkMedia(c,p);
     if(k==='products'&&(!Number.isFinite(p.price)||!c.prepare("SELECT 1 FROM records WHERE kind='categories' AND slug=? AND live IS NOT NULL").get(p.category)))fail('invalid',400);
     live=draft;state='published';
   }else if(op==='archived'&&state!=='archived'){
     if(user.role!=='OWNER'&&k!=='products'&&live)fail('denied',403);
     state='archived';live=null;
   }else if(op==='draft'&&state==='archived'){state='draft'}
   else fail('invalid',400);
   const revision=(prev?.revision??0)+1;
   c.prepare('INSERT INTO records(kind,slug,draft,live,state,source,verified,revision) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(kind,slug) DO UPDATE SET draft=excluded.draft,live=excluded.live,state=excluded.state,source=excluded.source,verified=excluded.verified,revision=excluded.revision').run(k,key,draft,live,state,source,date,revision);
   log(c,user.username,op,k+'/'+key,prev??null,{draft,live,state,source,verified:date,revision,ownerAttestation:op==='published'});
   return key;
 });
}
async function upload(req,user,origin){
 const type=req.headers['content-type']||'',match=/^multipart\/form-data;\s*boundary=(?:"([a-zA-Z0-9'()+_,./:=?-]{1,70})"|([a-zA-Z0-9'()+_,./:=?-]{1,70}))$/i.exec(type);
 if(!match)fail('invalid',415);
 const boundary='--'+(match[1]||match[2]),body=await readBody(req,3_100_000),marker=Buffer.from('\r\n'+boundary);
 if(!body.subarray(0,boundary.length+2).equals(Buffer.from(boundary+'\r\n')))fail('invalid',400);
 let start=boundary.length+2,image,csrf;
 for(let n=0;n<2;n++){
   const headersEnd=body.indexOf('\r\n\r\n',start),next=body.indexOf(marker,headersEnd+4);
   if(headersEnd<start||headersEnd-start>1500||next<0)fail('invalid',400);
   const headers=body.toString('ascii',start,headersEnd),value=body.subarray(headersEnd+4,next);
   if(/content-disposition: form-data; name="csrf"\s*$/im.test(headers))csrf=value.toString();
   else if(/content-disposition: form-data; name="image"; filename="/i.test(headers))image=value;
   else fail('invalid',400);
   start=next+marker.length+2;
 }
 if(!strictEqual(csrf,user.csrf))fail('denied',403);
 if(!image)fail('invalid',400);
 if(loginSession(req,origin)?.role!==user.role)fail('denied',403);
 let img;try{img=sanitizePNG(image)}catch{fail('invalid',400)}
 atomic(c=>{c.prepare('INSERT OR IGNORE INTO media(id,png,width,height) VALUES(?,?,?,?)').run(img.id,img.png,img.width,img.height);log(c,user.username,'upload','media/'+img.id)});
 return '/admin-media/'+img.id+'.png';
}
export async function handleAdmin(req,res,url){
 const pathname=url.pathname.replace(/\/$/,'');
 const lang=url.searchParams.get('lang')==='en'?'en':'ar';
 const origin=configured();let user=null,ui=view(lang,null,'',pathname);
 const reply=(status,body,type='text/html; charset=utf-8')=>{res.statusCode=status;res.setHeader('Content-Type',type);res.end(req.method==='HEAD'?undefined:body)};
 const redirect=path=>{res.statusCode=303;res.setHeader('Location',path+'?lang='+lang);res.end()};
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 try{
   if(!['GET','POST','HEAD'].includes(req.method))fail('badMethod',405);
   if(pathname==='/admin/assets/admin.css'&&req.method!=='POST')return reply(200,css,'text/css; charset=utf-8');
   if(pathname.startsWith('/admin-media/')&&req.method!=='POST'){
     const m=/^\/admin-media\/([a-f0-9]{64})\.png$/.exec(pathname);if(!m)fail('missing',404);
     const data=publicData();const active=[...data.gallery,...data.products].some(p=>p.image===pathname);
     if(!active&&!loginSession(req,origin))fail('missing',404);
     const file=db().prepare('SELECT png FROM media WHERE id=?').get(m[1]);if(!file)fail('missing',404);return reply(200,Buffer.from(file.png),'image/png');
   }
   if(!origin)fail('fail',503);
   user=loginSession(req,origin);ui=view(lang,user,user?.csrf,pathname);
   if(req.method==='POST'&&!matchesOrigin(req,origin))fail('denied',403);
   if(pathname==='/admin/login'){
     if(req.method!=='POST')return user?redirect('/admin'):reply(200,ui.login());
     rate('login:'+digest(req.socket.remoteAddress||'local'),16,15*60_000);
     const f=await getForm(req),name=(f.username||'').toLowerCase();
     if(!goodUser(name)||!goodPassword(f.password))fail('auth',401);
     const record=db().prepare('SELECT * FROM users WHERE username=? AND active=1').get(name);
     if(!await verify(f.password,record?.hash))fail('auth',401);
     const token=random();
     atomic(c=>{
       if(!c.prepare('SELECT 1 FROM users WHERE id=? AND hash=? AND active=1').get(record.id,record.hash))fail('auth',401);
       if(user)c.prepare('DELETE FROM sessions WHERE token=?').run(user.token);
       c.prepare('INSERT INTO sessions(token,user_id,csrf,expires) VALUES(?,?,?,?)').run(digest(token),record.id,random(),Date.now()+sessionTTL);
       log(c,name,'login',name);
     });res.setHeader('Set-Cookie',cookie(origin,token,sessionTTL/1000));return redirect('/admin');
   }
   if(!user){if(req.method==='POST')fail('auth',401);return redirect('/admin/login')}
   let f;
   if(req.method==='POST'){
     rate('writes:'+user.id,180,60_000);
     if(pathname==='/admin/upload'){
       if(!canEdit(user,'gallery'))fail('denied',403);
       const src=await upload(req,user,origin);return reply(201,ui.layout(ui.t.saved,'<p>'+ui.t.media+'</p><code dir="ltr">'+esc(src)+'</code><p>'+ui.link('/records/gallery',ui.t.back)+'</p>'));
     }
     f=await getForm(req);if(!strictEqual(f.csrf,user.csrf))fail('denied',403);
     // Recheck caller at mutation time after asynchronous body reads.
     const current=loginSession(req,origin);if(!current||current.role!==user.role)fail('denied',403);
   }
   if(pathname==='/admin/logout'&&f){db().prepare('DELETE FROM sessions WHERE token=?').run(user.token);res.setHeader('Set-Cookie',cookie(origin,'',0));return redirect('/admin/login')}
   if(pathname==='/admin'&&!f){
     const counts=Object.fromEntries(db().prepare('SELECT kind,count(*) AS n FROM records GROUP BY kind').all().map(r=>[r.kind,r.n]));return reply(200,ui.overview(counts));
   }
   if(pathname==='/admin/messages'&&!f)return reply(200,ui.layout(ui.t.messages,'<p>'+ui.t.noMessages+'</p>'));
   if(pathname.startsWith('/admin/records/')){
     const [, , ,k,slug,op,...extra]=pathname.split('/');
     if(!kinds.includes(k)||extra.length)fail('missing',404);
     if(f&&slug&&op){const key=saveRecord(user,k,slug,op,f);return redirect('/admin/records/'+k+'/'+key)}
     if(f||op)fail('missing',404);
     if(!slug)return reply(200,ui.list(k,db().prepare('SELECT slug,state FROM records WHERE kind=? ORDER BY slug').all(k)));
     if(slug==='new'){
       if(!canEdit(user,k))fail('denied',403);return reply(200,ui.editor(k,null));
     }
     const row=db().prepare('SELECT * FROM records WHERE kind=? AND slug=?').get(k,slug);if(!row)fail('missing',404);return reply(200,ui.editor(k,row));
   }
   if(pathname==='/admin/audit'||pathname==='/admin/users'||pathname.startsWith('/admin/users/')){
     if(user.role!=='OWNER')fail('denied',403);
     if(pathname==='/admin/audit'&&!f){
       const before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before))fail('invalid',400);
       const rows=db().prepare('SELECT id,dt,actor,action,target,previous,next FROM audit WHERE id<? ORDER BY id DESC LIMIT 51').all(before);
       const logs=rows.slice(0,50).map(r=>'<details><summary>'+esc(r.dt)+' · '+esc(r.actor)+' · '+esc(r.action)+' · <bdi>'+esc(r.target)+'</bdi></summary><pre dir="ltr">'+esc(JSON.stringify({previous:r.previous?JSON.parse(r.previous):null,next:r.next?JSON.parse(r.next):null},null,2))+'</pre></details>').join('');
       return reply(200,ui.layout(ui.t.audit,logs+(rows.length>50?'<a href="/admin/audit?lang='+lang+'&amp;before='+rows[49].id+'">'+(lang==='ar'?'سجلات أقدم':'Older records')+'</a>':'')));
     }
     if(pathname==='/admin/users'&&!f)return reply(200,ui.userPage(db().prepare('SELECT id,username,role,active FROM users ORDER BY username').all()));
     if(!f)fail('missing',404);
     const create=pathname==='/admin/users/create',m=/^\/admin\/users\/(\d+)\/(enable|disable|role|reset)$/.exec(pathname);
     if(!create&&!m)fail('missing',404);
     if(create&&(!goodUser(f.username)||!roles.includes(f.role))||m?.[2]==='role'&&!roles.includes(f.role))fail('invalid',400);
     let newHash=null;if(create||m?.[2]==='reset'){if(!goodPassword(f.password))fail('invalid',400);newHash=await hash(f.password)}
     atomic(c=>{
       const caller=loginSession(req,origin);if(caller?.role!=='OWNER')fail('denied',403);
       if(create){
         if(c.prepare('SELECT 1 FROM users WHERE username=?').get(f.username))fail('conflict',409);
         c.prepare('INSERT INTO users(username,role,hash) VALUES(?,?,?)').run(f.username,f.role,newHash);log(c,user.username,'create-user',f.username,null,{role:f.role});return;
       }
       const target=c.prepare('SELECT id,username,role,active FROM users WHERE id=?').get(Number(m[1]));if(!target)fail('missing',404);
       const op=m[2];if(target.id===user.id&&op!=='reset')fail('denied',403);
       if(op==='reset')c.prepare('UPDATE users SET hash=? WHERE id=?').run(newHash,target.id);
       if(op==='role')c.prepare('UPDATE users SET role=? WHERE id=?').run(f.role,target.id);
       if(op==='enable'||op==='disable')c.prepare('UPDATE users SET active=? WHERE id=?').run(op==='enable'?1:0,target.id);
       c.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id);log(c,user.username,op,target.username,{role:target.role,active:target.active},op==='role'?{role:f.role}:null);
     });return redirect('/admin/users');
   }
   fail('missing',404);
 }catch(err){const status=err.status||500;if(status===429)res.setHeader('Retry-After','900');return reply(status,ui.error(err.status?err.message:'fail'))}
}
