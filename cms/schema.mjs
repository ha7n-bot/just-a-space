import { isIP } from 'node:net';

export const kinds = ['products','categories','gallery','settings','hours','social','pages','seo'];
export const roles = ['OWNER','CONTENT_MANAGER','VIEWER'];
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const routeKeys = ['home','about','menu','experience','gallery','location','contact','privacy','terms'];
export const fields = {
  products:{name:'bi!',description:'bi',category:'slug!',price:'money',temperature:'temperature',variants:'variants',options:'variants',available:'bool',seasonal:'bool',featured:'bool',image:'image',alt:'bi',allergens:'bi',dietary:'bi',tax:'bi',order:'order'},
  categories:{name:'bi!',order:'order'},
  gallery:{name:'bi!',image:'image!',alt:'bi!',creator:'text!',rights:'text!',width:'dimension!',height:'dimension!',order:'order'},
  settings:{name:'bi!',address:'bi',city:'bi',district:'bi',postalCode:'postal',phone:'phone',whatsapp:'phone',email:'email',mapsUrl:'url',latitude:'lat',longitude:'lng'},
  hours:{weekly:'weekly!',special:'special'},
  social:{name:'bi!',url:'url!',order:'order'},
  pages:{title:'bi!',body:'bi!'},
  seo:{title:'bi!',description:'bi!'}
};
export const validKey=(kind,key)=>typeof key==='string'&&key.length<=80&&slugPattern.test(key)&&(!['pages','seo'].includes(kind)||routeKeys.includes(key))&&(kind!=='settings'||key==='business')&&(kind!=='hours'||key==='schedule');
export function urlOk(s){
  try{const u=new URL(s);return typeof s==='string' && s.length<=2048 && u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname.includes('.')&&!isIP(u.hostname)&&!/(^|\.)(localhost|internal|local|test|invalid)$/.test(u.hostname)}catch{return false}
}
const text=(s,n=4000)=>typeof s==='string'&&s.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
const bi=(v,required)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>['ar','en'].includes(k))&&['ar','en'].every(k=>text(v[k])&&(!required||v[k].trim().length>0));
const money=v=>Number.isFinite(v)&&v>=0&&v<=1000000&&Math.abs(Math.round(v*100)-v*100)<0.000001;
const time=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const day=v=>Array.isArray(v)&&v.length<=8&&v.every(pair=>Array.isArray(pair)&&pair.length===2&&pair.every(t=>time.test(t))&&pair[0]!==pair[1]);
export function calendarDate(value){if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d$/.test(value))return false;const t=Date.parse(value+'T12:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value}
function check(type,v,required){
 switch(type){
 case 'bi':return bi(v,required);
 case 'money':return money(v);
 case 'bool':return typeof v==='boolean';
 case 'text':return text(v,1000)&&(!required||v.trim().length>0);
 case 'slug':return typeof v==='string'&&v.length<=80&&slugPattern.test(v);
 case 'image':return /^\/assets\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:avif|webp|png|jpe?g)$/i.test(v)||(/^\/admin-media\/[a-f0-9]{64}\.(?:webp|png|jpg)$/.test(v));
 case 'temperature':return ['hot','cold','ambient'].includes(v);
 case 'variants':return Array.isArray(v)&&v.length<=64&&v.every(e=>e&&Object.keys(e).every(k=>['name','price'].includes(k))&&bi(e.name,true)&&money(e.price));
 case 'order':return Number.isInteger(v)&&v>=0&&v<1e6;
 case 'dimension':return Number.isInteger(v)&&v>0&&v<=20000;
 case 'postal':return /^\d{5}$/.test(v);
 case 'phone':return /^\+[1-9]\d{7,14}$/.test(v);
 case 'email':return text(v,254)&&/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);
 case 'lat':return typeof v==='number'&&v>=-90&&v<=90;
 case 'lng':return typeof v==='number'&&v>=-180&&v<=180;
 case 'url':return urlOk(v);
 case 'weekly':case 'special':return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length<=(type==='weekly'?7:500)&&Object.entries(v).every(([k,r])=>(type==='weekly'?/^[0-6]$/.test(k):calendarDate(k))&&day(r));
 default:return false;
 }
}
export function validate(kind,key,payload){
 if(!kinds.includes(kind)||!validKey(kind,key)||!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('invalid');
 if(Object.keys(payload).some(k=>!Object.hasOwn(fields[kind],k)))throw Error('invalid');
 for(const [name,rule] of Object.entries(fields[kind])){
   const required=rule.endsWith('!'), v=payload[name];
   if(v===undefined||v===null){if(required)throw Error('invalid');continue}
   if(!check(rule.replace('!',''),v,required))throw Error('invalid');
 }
 if(kind==='products'&&payload.image&&!bi(payload.alt,true))throw Error('invalid');
 return payload;
}
