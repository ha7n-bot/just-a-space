const labels={
 en:{size:'Option name',price:'Price in SAR',add:'Leave unused rows empty. Save to add more rows.',status:'Hours',times:'Time intervals',unknown:'Unknown',closed:'Closed',open:'Open during these intervals',date:'Local date',help:'Use Riyadh time. Separate intervals with a comma, for example 08:00–12:00, 16:00–23:00.',days:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']},
 ar:{size:'اسم الخيار',price:'السعر بالريال',add:'اترك الصفوف غير المستخدمة فارغة. احفظ لإضافة صفوف جديدة.',status:'حالة الدوام',times:'فترات الدوام',unknown:'غير معروف',closed:'مغلق',open:'مفتوح خلال الفترات المحددة',date:'التاريخ المحلي',help:'تُكتب الفترات بتوقيت الرياض وتُفصل بفاصلة، مثل 08:00–12:00، 16:00–23:00.',days:['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']}
};
export function structuredField({type,name,label,value,lang,escape}){
 const t=labels[lang];
 const input=(key,v,type='text',extra='')=>'<input name="'+key+'" type="'+type+'" value="'+escape(v??'')+'" '+extra+'>';
 const titled=(s,field)=>'<label>'+s+field+'</label>';
 let body='';
 const meta=input('structured.'+name,'1','hidden');
 if(type==='variants'){
   const rows=[...(value||[]),{},{}].slice(0,64);
   body='<p>'+t.add+'</p>'+rows.map((r,i)=>'<div class="fields-row">'+titled(t.size+' · العربية',input(name+'.'+i+'.ar',r.name?.ar,'text','dir="rtl" lang="ar"'))+titled(t.size+' · English',input(name+'.'+i+'.en',r.name?.en,'text','dir="ltr" lang="en"'))+titled(t.price,input(name+'.'+i+'.price',r.price,'number','step=".01" min="0"'))+'</div>').join('');
 }else{
   const special=type==='special';
   const rows=special?[...Object.entries(value||{}),['',null],['',null]].slice(0,500):t.days.map((d,i)=>[d,value?.[i]]);
   body='<p>'+t.help+(special?' '+t.add:'')+'</p>'+rows.map(([day,periods],i)=>{
     const p=name+'.'+i+'.';
     const state=Array.isArray(periods)?(periods.length?'open':'closed'):'unknown';
     const range=(periods||[]).map(pair=>pair.join('–')).join(', ');
     const dayField=special?titled(t.date,input(p+'date',day,'date')):'<strong>'+day+'</strong>';
     return '<div class="fields-row">'+dayField+titled(t.status,'<select name="'+p+'state">'+['unknown','closed','open'].map(s=>'<option value="'+s+'"'+(s===state?' selected':'')+'>'+t[s]+'</option>').join('')+'</select>')+titled(t.times,input(p+'range',range,'text','dir="ltr"'))+'</div>';
   }).join('');
 }
 return '<fieldset><legend>'+label+'</legend>'+meta+body+'</fieldset>';
}
export function readStructured(type,name,form){
 const value=type==='variants'?[]:{};
 const max=type==='variants'?64:type==='weekly'?7:500;
 for(let i=0;i<max;i++){
   const p=name+'.'+i+'.';
   if(type==='variants'){
     const ar=(form[p+'ar']||'').trim(),en=(form[p+'en']||'').trim(),price=(form[p+'price']||'').trim();
     if(!ar&&!en&&!price)continue;
     if(!ar||!en||!price)throw Error('invalid');
     value.push({name:{ar,en},price:Number(price)});
   }else{
     const date=type==='special'?(form[p+'date']||''):String(i);
     const state=form[p+'state']||'unknown',range=(form[p+'range']||'').trim();
     if(state==='unknown'&&!range)continue;
     if(!date||Object.hasOwn(value,date))throw Error('invalid');
     if(state==='closed'&&!range){value[date]=[];continue}
     if(state!=='open'||!range)throw Error('invalid');
     value[date]=range.split(/[,،]/).map(period=>period.trim().split(/[-–]/).map(t=>t.trim()));
   }
 }
 return value;
}
