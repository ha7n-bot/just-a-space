import {fields,kinds,roles} from './schema.mjs';
import {labels,names} from './labels.mjs';
import {structuredField} from './structured.mjs';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
export function view(l,user,csrf,path){
 const t=labels[l],idx=l==='ar'?1:0;
 const roleLabel=r=>({OWNER:['Owner','المالك'],CONTENT_MANAGER:['Content manager','مدير المحتوى'],VIEWER:['Viewer','مستخدم للقراءة']}[r]||[r,r])[idx];
 const url=p=>'/admin'+p+'?lang='+l;
 const h=(label,input)=>'<label>'+label+input+'</label>';
 const link=(p,label)=>'<a href="'+url(p)+'">'+esc(label)+'</a>';
 const csrfInput='<input type="hidden" name="csrf" value="'+attr(csrf)+'">';
 const form=(p,inner,multipart=false)=>'<form method="post" action="'+url(p)+'"'+(multipart?' enctype="multipart/form-data"':'')+'>'+csrfInput+inner+'</form>';
 const button=(s)=>'<button type="submit">'+esc(s)+'</button>';
 const action=(p,s,extra='')=>form(p,extra+button(s));
 const nav=user?'<nav>'+link('',t.overview)+kinds.map(k=>link('/records/'+k,t[k])).join('')+link('/messages',t.messages)+(user.role==='OWNER'?link('/users',t.users)+link('/audit',t.audit):'')+'</nav>':'';
 const layout=(title,body)=>'<!doctype html><html lang="'+l+'" dir="'+(idx?'rtl':'ltr')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+esc(title)+' · '+t.admin+'</title><link rel="stylesheet" href="/admin/assets/admin.css"></head><body><a class="skip" href="#main">'+t.start+'</a><header><b dir="ltr">JUST A SPACE</b><a lang="'+(idx?'en':'ar')+'" href="'+attr(path)+'?lang='+(idx?'en':'ar')+'">'+t.lang+'</a>'+(user?action('/logout',t.logout):'')+'</header><div class="shell">'+nav+'<main id="main"><h1>'+esc(title)+'</h1>'+body+'</main></div></body></html>';
 const input=(name,v='',type='text',extra='')=>'<input type="'+type+'" name="'+attr(name)+'" value="'+attr(v)+'" '+extra+'>';
 const secret=ac=>h(t.password,'<input type="password" name="password" autocomplete="'+ac+'" required maxlength="256">');
 const login=()=>layout(t.login,form('/login',h(t.username,input('username','','text','required autocomplete="username" dir="ltr"'))+secret('current-password')+button(t.login)));
 const overview=counts=>layout(t.overview,'<p><bdi>'+esc(user.username)+'</bdi> · '+esc(roleLabel(user.role))+'</p><dl>'+kinds.map(k=>'<dt>'+link('/records/'+k,t[k])+'</dt><dd>'+Number(counts[k]||0)+'</dd>').join('')+'</dl>');
 const canEdit=k=>user.role==='OWNER'||(user.role==='CONTENT_MANAGER'&&k!=='settings');
 const list=(k,rows)=>layout(t[k],(k==='products'?'<p>'+t.productsHelp+'</p>':'')+(canEdit(k)?link('/records/'+k+'/new',t.new):'')+(rows.length?'<ul>'+rows.map(r=>'<li>'+link('/records/'+k+'/'+r.slug,t[r.state]+' · '+r.slug)+'</li>').join('')+'</ul>':'<p>'+t.empty+'</p>')+(['gallery','products'].includes(k)&&canEdit(k)?'<h2>'+t.upload+'</h2><p>'+t.uploadHelp+'</p>'+form('/upload',h(t.upload,'<input type="file" name="image" accept="image/png" required>')+button(t.upload),true):''));
 function previewContent(item,kind){
   const money=v=>Number.isFinite(v)?new Intl.NumberFormat(l==='ar'?'ar-SA':'en-SA',{style:'currency',currency:'SAR'}).format(v):'—';
   const yn=v=>v?(idx?'نعم':'Yes'):(idx?'لا':'No');
   const localized=v=>typeof v==='object'&&v?(v[l]||''):'';
   const values=Object.entries(fields[kind]).filter(([name])=>item[name]!=null&&!['image','alt','name','title','body','description'].includes(name)).map(([n,r])=>{
     const v=item[n],type=r.replace('!','');let output;
     if(type==='money')output=money(v);
     else if(type==='bi')output=localized(v);
     else if(type==='bool')output=yn(v);
     else if(type==='variants')output=v.map(e=>localized(e.name)+' · '+money(e.price)).join(idx?'، ':', ');
     else if(type==='weekly'||type==='special')output=Object.entries(v).map(([d,p])=>d+' · '+(p.map(pair=>pair.join('–')).join(', ')||(idx?'مغلق':'Closed'))).join(' / ');
     else if(type==='temperature')output=({hot:['Hot','ساخن'],cold:['Cold','بارد'],ambient:['Ambient','حرارة الغرفة']}[v]||[v,v])[idx];
     else output=v;
     return output!==''?'<dt>'+esc(names[n]?.[idx]||n)+'</dt><dd><bdi>'+esc(output)+'</bdi></dd>':'';
   }).join('');
   const image=item.image?'<img class="preview-photo" src="'+attr(item.image)+'" alt="'+attr(localized(item.alt))+'">':'';
   return '<article>'+image+'<h3>'+esc(localized(item.name)||localized(item.title)||t[kind])+'</h3><p>'+esc(localized(item.description)||localized(item.body))+'</p><dl>'+values+'</dl></article>';
 }
 function editor(k,row){
   const v=row?JSON.parse(row.draft):{};
   const selected=row?.slug||({settings:'business',hours:'schedule',pages:'home',seo:'home'}[k]||'');
   const f=(name,rule)=>{
     const type=rule.replace('!',''),required=rule.endsWith('!')?'required':'',label=esc(names[name]?.[idx]||name),value=v[name];
     if(type==='bi')return '<fieldset><legend>'+label+'</legend>'+['ar','en'].map(lang=>h(lang==='ar'?t.arabic:t.english,'<textarea dir="'+(lang==='ar'?'rtl':'ltr')+'" lang="'+lang+'" name="'+name+'.'+lang+'" '+required+' maxlength="4000">'+esc(value?.[lang])+'</textarea>')).join('')+'</fieldset>';
     if(type==='bool')return h(label,'<input type="checkbox" name="'+name+'" value="yes" '+((value??name==='available')?'checked':'')+'>');
     if(type==='temperature')return h(label,'<select name="'+name+'">'+['','hot','cold','ambient'].map((x,i)=>'<option value="'+x+'" '+(x===value?'selected':'')+'>'+['—',...(idx?['ساخن','بارد','حرارة الغرفة']:['Hot','Cold','Ambient'])][i]+'</option>').join('')+'</select>');
     if(['variants','weekly','special'].includes(type))return structuredField({type,name,label,value,lang:l,escape:esc});
     const num=['order','money','dimension','lat','lng'].includes(type);
     return h(label,input(name,value??'',num?'number':type==='url'?'url':'text',required+(num?' step="'+(['order','dimension'].includes(type)?'1':'any')+'"':'')));
   };
   const rev=input('revision',row?.revision??0,'hidden');
   const target=row?'/records/'+k+'/'+row.slug:'/records/'+k+'/new';
   const keyField=h(t.key,input('key',selected,'text',row?'readonly dir="ltr"':'required dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80"'));
   const details=Object.entries(fields[k]).map(([n,r])=>f(n,r)).join('');
   const evidence='<fieldset><legend>'+t.evidence+'</legend>'+h(t.source,input('source',row?.source||'','url','dir="ltr"'))+h(t.date,input('verified',row?.verified||'','date'))+'</fieldset>';
   const publicPreview=row?'<h2>'+t.current+'</h2>'+ (row.live?previewContent(JSON.parse(row.live),k):'<p>'+t.noLive+'</p>'):'';
   const prefix=link('/records/'+k,t.back)+(row?'<p>'+esc(row.slug)+' · '+t[row.state]+' · '+t.revision+' '+row.revision+'</p>':'')+(k==='hours'?'<p>'+t.specialHelp+'</p>':'');
   const preview=row?'<details><summary>'+t.preview+'</summary>'+previewContent(v,k)+'</details>':'';
   const edit=canEdit(k)&&row?.state!=='archived'?form(target+'/save',rev+keyField+details+evidence+button(t.save)):'';
   let actions='';
   if(row&&canEdit(k)){
     if(row.state==='draft')actions+=action(target+'/pending',t.submit,rev);
     if(row.state==='pending'&&user.role==='OWNER')actions+=action(target+'/published',t.publish,rev+h(t.attest,'<input type="checkbox" name="attest" value="yes" required>'));
     if(row.state!=='archived'&&(user.role==='OWNER'||k==='products'||!row.live))actions+=action(target+'/archived',t.archive,rev);
     if(row.state==='archived')actions+=action(target+'/draft',t.restore,rev);
   }
   return layout(t[k],prefix+preview+publicPreview+edit+actions);
 }
 const userPage=rows=>layout(t.users,form('/users/create',h(t.username,input('username','','text','required autocomplete="off" dir="ltr"'))+secret('new-password')+h(t.role,'<select name="role">'+roles.map(r=>'<option value="'+r+'">'+roleLabel(r)+'</option>').join('')+'</select>')+button(t.create))+rows.map(r=>'<section><h2><bdi>'+esc(r.username)+'</bdi></h2><p>'+esc(roleLabel(r.role))+' · '+(r.active?t.active:t.inactive)+'</p>'+action('/users/'+r.id+'/reset',t.reset,secret('new-password'))+(r.id!==user.id?action('/users/'+r.id+'/'+(r.active?'disable':'enable'),r.active?t.disable:t.enable)+action('/users/'+r.id+'/role',t.role,h(t.role,'<select name="role">'+roles.map(role=>'<option value="'+role+'" '+(r.role===role?'selected':'')+'>'+roleLabel(role)+'</option>').join('')+'</select>')):'')+'</section>').join(''));
 const error=(key)=>layout(t[key]||t.fail,link('',t.start));
 return {layout,login,list,editor,overview,userPage,error,t,link};
}
