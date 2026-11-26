import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {locales,pages} from './config/business.mjs';
import {openingState} from './lib/hours.mjs';
import {renderPage} from './web/render.mjs';
import {handleAdmin,publicData} from './cms/index.mjs';

const port=Number(process.env.PORT||3000);
const assets=fileURLToPath(new URL('./web/assets/',import.meta.url));
const origin=process.env.SITE_ORIGIN ? new URL(process.env.SITE_ORIGIN).origin : '';
const production=process.env.PUBLIC_LAUNCH==='1';
if (production && !origin.startsWith('https://')) throw Error('Public launch requires an HTTPS SITE_ORIGIN');
const mime={'.webp':'image/webp','.avif':'image/avif','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon'};
function out(req,res,status,type,body) {
  res.writeHead(status,{'Content-Type':type}); res.end(req.method==='HEAD'?undefined:body);
}
function escXml(s) {return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');}
const server=http.createServer(async(req,res)=>{
  let lang='ar';
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");
  res.setHeader('Cache-Control','no-store');
  if(origin.startsWith('https://')) res.setHeader('Strict-Transport-Security','max-age=31536000');
  if(!production) res.setHeader('X-Robots-Tag','noindex, nofollow');
  try{
    const url=new URL(req.url,'http://localhost');
    const path=url.pathname;
    if (/^\/admin(?:\/|-media\/|$)/.test(path)) {
      res.setHeader('X-Robots-Tag','noindex, nofollow');
      return await handleAdmin(req,res,url);
    }
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return out(req,res,405,'text/plain','405');}
    if(path.startsWith('/assets/')){
      const file=resolve(assets,decodeURIComponent(path.slice(8)));
      if(file.startsWith(assets.endsWith(sep)?assets:assets+sep) && mime[extname(file)]){
        try{
          const bytes=await readFile(file);
          res.setHeader('Cache-Control','public, max-age=300, must-revalidate');
          return out(req,res,200,mime[extname(file)],bytes);
        }catch(e){if(e.code!=='ENOENT'&&e.code!=='ENOTDIR')throw e;}
      }
      return out(req,res,404,'text/plain','404');
    }
    if(path==='/robots.txt')return out(req,res,200,'text/plain; charset=utf-8',production?'User-agent: *\nDisallow: /admin\nSitemap: '+origin+'/sitemap.xml\n':'User-agent: *\nDisallow: /\n');
    if(path==='/') {
      const pref=/(?:^|;\s*)jas_lang=(ar|en)(?:;|$)/.exec(req.headers.cookie||'')?.[1]||'ar';
      res.writeHead(302,{Location:'/'+pref+url.search});return res.end();
    }
    const data=await publicData();
    data.openingState=openingState(data.hours);
    data.indexable=production;
    if(path==='/sitemap.xml') {
      const routes=production?[...pages,...(data.products||[]).map(p=>'menu/'+p.slug)]:[];
      const urls=routes.flatMap(k=>locales.map(l=>{
        const make=v=>escXml(origin+'/'+v+(k?'/'+k:''));
        const links=[['ar-SA','ar'],['en-SA','en'],['x-default','ar']].map(([h,v])=>'<xhtml:link rel="alternate" hreflang="'+h+'" href="'+make(v)+'"/>').join('');
        return '<url><loc>'+make(l)+'</loc>'+links+'</url>';
      }));
      return out(req,res,200,'application/xml; charset=utf-8','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+urls.join('')+'</urlset>');
    }
    const match=/^\/(ar|en)(?:\/(.*?))?\/?$/.exec(path);
    lang=match?.[1]||'ar';
    const route=(match?.[2]||'').replace(/\/$/,'');
    const found=match && (pages.includes(route) || (route.startsWith('menu/') && data.products?.some(p=>p.slug===route.slice(5))));
    const body=renderPage({lang,path:found?route:'404',data,origin,production,now:new Date(),query:url.searchParams});
    return out(req,res,found?200:404,'text/html; charset=utf-8',body);
  }catch(error){
    console.error('Request failed',error.name,error.code||'');
    if(res.headersSent){res.end();return;}
    try{return out(req,res,500,'text/html; charset=utf-8',renderPage({lang,path:'500',data:{},production:false}));}
    catch{return out(req,res,500,'text/plain; charset=utf-8',lang==='ar'?'تعذّر تحميل الصفحة':'Unable to load this page');}
  }
});
server.headersTimeout=15000;
server.requestTimeout=30000;
server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log('JUST A SPACE listening on '+port));
