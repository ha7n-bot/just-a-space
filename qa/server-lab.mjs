// In-process SSR CPU measurement. Excludes database, network and browser paint.
import {performance} from 'node:perf_hooks';
import {statSync} from 'node:fs';
import {renderPage} from '../web/render.mjs';
const data = {products:[],categories:[],gallery:[],social:[],pages:{},seo:{},settings:{},hours:{}};
const results={node:process.version,scope:'warmed renderPage call only',runs:1000,home:{},assets:{}};
for(const lang of ['ar','en']){
  const render=()=>renderPage({lang,path:'',data,production:false});
  for(let i=0;i<50;i++)render();
  const samples=[];
  for(let i=0;i<1000;i++){
    const start=performance.now();
    render();
    samples.push(performance.now()-start);
  }
  samples.sort((a,b)=>a-b);
  results.home[lang]={p50_ms:samples[499],p95_ms:samples[949],htmlBytes:Buffer.byteLength(render())};
}
for(const id of ['site.css','site.js','arabic.woff','studio-hero.webp','studio-detail.webp']){
  results.assets[id]=statSync(new URL('../web/assets/'+id,import.meta.url)).size;
}
console.log(JSON.stringify(results,null,2));
