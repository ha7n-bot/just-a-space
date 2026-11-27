import {businessSeed} from '../config/business.mjs'
import {copy} from './copy.mjs'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const local = (value, lang) => typeof value === 'string' ? value : value?.[lang] ?? ''
const https = value => {try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:''}catch{return ''}}
const asset = value => typeof value==='string' && /^\/(?:assets|admin-media)\/[\w./%-]+$/.test(value) && !value.includes('..') ? value : https(value)
const scriptData = value => JSON.stringify(value).replace(/</g,'\\u003c')
const slug = value => encodeURIComponent(String(value))
const brandmark = name => '<span class="wordmark" lang="en" dir="ltr">'+esc(name)+'</span>'
const pin='<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19.2 9.9c0 5.1-7.2 11.5-7.2 11.5S4.8 15 4.8 9.9a7.2 7.2 0 0 1 14.4 0Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9.8" r="2.4" stroke="currentColor" stroke-width="1.5"/></svg>'
const languageIcon='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="3.8" ry="8.5"/><path d="M4 10h16M4 14h16"/></svg>'
const linkIcon='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 4h6v6m0-6-9 9"/><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/></svg>'

export function renderPage({lang='ar',path='',data={},origin='',production=false,query,now=new Date()}={}) {
  lang=lang==='en'?'en':'ar'
  const t=copy[lang], altLang=lang==='ar'?'en':'ar', locale=lang+'-SA'
  const [$path,qs='']=String(path).replace(/^\/+|\/+$/g,'').split('?')
  const params=new URLSearchParams(query??qs)
  const pageKeys=Object.keys(t.nav), page=$path.split('/')[0]
  const products=Array.isArray(data.products)?data.products:[]
  const cats=data.categories??[],gallery=data.gallery??[],social=data.social??[],settings=data.settings??{}
  const business=settings.business??{}, names=business.name??businessSeed.name, brand=local(names,lang)||t.brand
  const wordmark=brandmark(local(names,'en')||businessSeed.name.en)
  const address=local(business.address,lang)||(!production?local(businessSeed.address,lang):'')
  const city=local(business.city,lang)||(!production?local(businessSeed.city,lang):'')
  const maps=https(business.mapsUrl)||(!production?https(businessSeed.mapsUrl):'')
  const url=(p='')=>'/'+lang+(p?'/'+p:'')
  const otherPath='/'+altLang+($path?'/'+$path:'')
  const catName=k=>local(cats.find(c=>c.slug===k)?.name,lang)||''
  const money=n=>typeof n==='number'&&Number.isFinite(n)?new Intl.NumberFormat(locale,{style:'currency',currency:'SAR',minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}).format(n):''
  const productDetail=$path.startsWith('menu/')?products.find(p=>('menu/'+p.slug)===$path):null
  const isError=(!pageKeys.includes(page)||($path!==page&&!productDetail))
  const code=isError?(page==='500'?500:404):0
  const approvedPage=data.pages?.[page||'home']??{}
  const title=code?(code===404?t.notFound:t.oops):productDetail?local(productDetail.name,lang):local(approvedPage.title,lang)||t.nav[page]
  const btn=(p,label,style='dark')=>'<a class="btn '+style+'" href="'+esc(url(p))+'">'+esc(label)+'</a>'
  const external=(href,label,extra='')=>href?'<a class="ext '+extra+'" href="'+esc(href)+'" rel="external noreferrer">'+esc(label)+linkIcon+'</a>':''
  const img=(src,alt,hero=false)=>asset(src)?'<img src="'+esc(asset(src))+'"'+(src==='/assets/studio-hero.webp'?' width="1250" height="1100" srcset="/assets/studio-hero-sm.webp 680w, /assets/studio-hero.webp 1250w" sizes="(max-width: 44rem) 92vw, 53vw"':src==='/assets/studio-detail.webp'?' width="950" height="680" srcset="/assets/studio-detail-sm.webp 510w, /assets/studio-detail.webp 950w" sizes="(max-width: 44rem) 92vw, 46vw"':'')+' alt="'+esc(alt)+'" loading="'+(hero?'eager':'lazy')+'" '+(hero?'fetchpriority="high"':'')+' decoding="async">':''
  const approvedGallery=gallery.filter(item=>asset(item.image)&&local(item.alt,lang))
  const heroAsset=approvedGallery.find(item=>item.featured)||approvedGallery[0]
  const editBody=(fallback)=>esc(local(approvedPage.body,lang)||fallback).replace(/\n/g,'<br>')
  const navLink=(p)=>'<a href="'+esc(url(p))+'"'+(page===p&&!code?' aria-current="page"':'')+'>'+esc(t.nav[p])+'</a>'
  const heading=(label,desc='')=>'<header class="page-heading"><h1>'+esc(label)+'</h1>'+(desc?'<p>'+desc+'</p>':'')+'</header>'
  const flag=(label)=>label?'<span class="flag">'+esc(label)+'</span>':''
  const productCard=p=>'<a data-product data-name="'+esc(local(p.name,lang)+' '+local(p.description,lang))+'" data-cat="'+esc(p.category)+'" class="product" href="'+esc(url('menu/'+slug(p.slug)))+'">'+(asset(p.image)?'<div class="product-img">'+img(p.image,local(p.alt,lang))+'</div>':'')+'<div class="product-line"><h3>'+esc(local(p.name,lang))+'</h3><bdi>'+esc(money(p.price)||t.pricePending)+'</bdi></div><p>'+esc(local(p.description,lang))+'</p><div class="flags">'+[catName(p.category),p.temperature==='hot'?t.hot:p.temperature==='cold'?t.cold:'',p.featured?t.star:'',p.seasonal?t.seasonal:'',p.available===false?t.unavailable:''].map(flag).join('')+'</div></a>'
  const menuEmpty=()=>'<div class="notice"><h3>'+t.updated+'</h3><p>'+t.emptyMenu+'</p></div>'
  const localeLink='<a data-lang-switch href="'+esc(otherPath+(params.toString()?'?'+params:''))+'" lang="'+altLang+'" hreflang="'+altLang+'-SA" aria-label="'+esc(t.localeLabel)+'">'+languageIcon+'<span>'+t.locale+'</span></a>'
  const header='<a class="skip" href="#main">'+t.skip+'</a><header class="mast"><div class="mast-inner"><a class="brand" href="'+url()+'" aria-label="'+esc(brand)+'">'+wordmark+'</a><nav class="desktop" aria-label="'+t.primary+'">'+['menu','about','gallery','location'].map(navLink).join('')+'</nav><div class="tools">'+localeLink+'<a class="head-menu" href="'+url('menu')+'">'+t.menuCta+'</a><details class="mobile-nav"><summary aria-label="'+t.openNav+'"><i></i><i></i></summary><nav aria-label="'+t.primary+'">'+pageKeys.slice(0,7).map(navLink).join('')+'</nav></details></div></div></header>'
  const imageStudy=(isDetail=false,priority=false)=>{
    if(heroAsset) return '<figure class="study">'+img(heroAsset.image,local(heroAsset.alt,lang),priority)+'</figure>'
    if(production) return ''
    return '<figure class="study">'+img('/assets/studio-'+(isDetail?'detail':'hero')+'.webp',isDetail?t.detailAlt:t.studioAlt,priority)+'<figcaption>'+t.studio+'</figcaption></figure>'
  }
  const feedback=()=>maps?'<section class="feedback"><div><h2>'+t.feedback+'</h2><p>'+t.feedbackText+'</p></div>'+external(maps,t.google)+'</section>':''
  const approvedSocial=()=>social.filter(s=>https(s.url)&&local(s.name,lang)).map(s=>external(https(s.url),local(s.name,lang))).join('')
  const teaser=(p,heading,text,action)=>'<section class="teaser"><div><h2>'+esc(heading)+'</h2><p>'+esc(text)+'</p></div>'+btn(p,action,'outline')+'</section>'
  function home(){
    const featured=products.filter(p=>p.featured&&p.available!==false).slice(0,4)
    const desserts=products.filter(p=>cats.some(c=>c.slug===p.category&&(c.kind==='dessert'||c.slug==='desserts'))&&p.available!==false).slice(0,3)
    const heroTitle=local(approvedPage.title,lang)
    return '<section class="hero '+(!heroAsset&&production?'hero-type':'')+'"><div class="hero-copy"><div class="hero-origin">'+pin+'<span>'+esc(city||t.eye)+'</span></div><h1>'+(heroTitle?esc(heroTitle):production?esc(brand):t.hero.map(line=>'<span>'+esc(line)+'</span>').join(' '))+'</h1><p>'+editBody(production?t.meta['']:t.intro)+'</p><div class="actions">'+btn('menu',t.menuCta)+btn('location',t.nav.location,'outline')+'</div></div>'+imageStudy(false,true)+'</section><section class="home-menu section"><div class="section-top"><div><span class="overline">'+t.menuDesc+'</span><h2>'+t.menuTitle+'</h2></div>'+btn('menu',t.fullMenu,'text')+'</div>'+(featured.length?'<div class="products">'+featured.map(productCard).join('')+'</div>':products.length?'<div class="products">'+products.slice(0,3).map(productCard).join('')+'</div>':menuEmpty())+'</section><section class="editorial section">'+imageStudy(true)+'<div><h2>'+t.storyTitle+'</h2><p>'+t.storyText+'</p>'+btn('about',t.storyLink,'text')+' '+btn('experience',t.moreExperience,'text')+'</div></section>'+(desserts.length?'<section class="section"><h2>'+t.featuredDesserts+'</h2><div class="products">'+desserts.map(productCard).join('')+'</div></section>':'')+teaser('gallery',t.nav.gallery,t.galleryText,t.galleryLink)+feedback()+teaser('location',t.visit,address||t.addressPending,t.nav.location)
  }
  function menu(){
    const q=params.get('q')||'', category=params.get('category')||''
    let items=products.filter(p=>(!category||p.category===category)&&(!q||(local(p.name,lang)+' '+local(p.description,lang)).toLocaleLowerCase(locale).includes(q.toLocaleLowerCase(locale))))
    return heading(title,editBody(products.length?t.menuLive:t.menuIntro))+'<div class="page-body">'+(products.length?'<form method="get" action="'+url('menu')+'" data-menu-form><div class="menu-controls"><label>'+t.search+'<input data-search name="q" type="search" value="'+esc(q)+'" placeholder="'+t.searchHint+'"></label><label>'+t.filters+'<select data-category name="category"><option value="">'+t.all+'</option>'+cats.map(c=>'<option '+(category===c.slug?'selected ':'')+'value="'+esc(c.slug)+'">'+esc(local(c.name,lang))+'</option>').join('')+'</select></label><button class="btn dark" type="submit">'+t.search+'</button></div></form><div class="products">'+items.map(productCard).join('')+'</div>'+(!items.length?'<div class="notice" role="status"><h2>'+t.noResults+'</h2>'+btn('menu',t.clear,'text')+'</div>':'')+'<button class="btn outline print" data-print hidden>'+t.print+'</button>':menuEmpty())+'</div>'
  }
  function detail(p){
    const vars=p.variants??[],options=p.options??p.addons??[]
    return '<div class="detail">'+(asset(p.image)?'<figure>'+img(p.image,local(p.alt,lang),true)+'</figure>':'')+'<div><a class="text" href="'+url('menu')+'">'+t.backMenu+'</a>'+heading(title,esc(local(p.description,lang)))+'<div class="flags">'+[catName(p.category),p.available===false?t.unavailable:'',p.seasonal?t.seasonal:''].map(flag).join('')+'</div><h2>'+t.pricing+'</h2><p><bdi data-price>'+esc(money(p.price)||t.pricePending)+'</bdi></p>'+(vars.length?'<label>'+t.size+'<select data-size><option value="'+esc(money(p.price)||t.pricePending)+'">'+t.base+'</option>'+vars.map(v=>'<option value="'+esc(money(v.price)||t.pricePending)+'">'+esc(local(v.name,lang))+' — '+esc(money(v.price)||t.pricePending)+'</option>').join('')+'</select></label>':'')+(options.length?'<h3>'+t.options+'</h3><ul>'+options.map(v=>'<li>'+esc(local(v.name,lang))+' · <bdi>'+esc(money(v.price)||t.pricePending)+'</bdi></li>').join('')+'</ul>':'')+[[t.allergens,p.allergens],[t.diet,p.dietary]].filter(([,v])=>local(v,lang)).map(([k,v])=>'<h3>'+k+'</h3><p>'+esc(local(v,lang))+'</p>').join('')+'</div></div>'
  }
  function visit(){
    const schedule=data.hours?.schedule, weekly=schedule?.weekly??{},special=schedule?.special??{}
    const intervals=xs=>Array.isArray(xs)&&xs.length?xs.map(pair=>'<bdi>'+esc(pair[0])+' – '+esc(pair[1])+'</bdi>').join(' / '):t.closed
    const weekDays=[0,1,2,3,4,5,6].filter(k=>Object.hasOwn(weekly,k)).map(k=>'<div><dt>'+new Intl.DateTimeFormat(locale,{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2024,0,7+k)))+'</dt><dd>'+intervals(weekly[k])+'</dd></div>').join('')
    const exceptions=Object.entries(special).sort(([a],[b])=>a.localeCompare(b)).map(([date,xs])=>'<div><dt><bdi>'+esc(date)+'</bdi></dt><dd>'+intervals(xs)+'</dd></div>').join('')
    return heading(title,editBody(address?t.visitText:''))+'<div class="visit-grid"><section><h2>'+t.address+'</h2><address data-address>'+esc(address||t.addressPending)+'</address><div class="action-row">'+external(maps,t.map)+(address?'<button data-copy data-good="'+t.copied+'" data-fail="'+t.copyFail+'" class="btn outline" hidden>'+t.copy+'</button>':'')+(maps?'<button data-share="'+esc(maps)+'" data-good="'+t.shareDone+'" data-copied="'+t.linkCopied+'" data-fail="'+t.copyFail+'" class="btn outline" hidden>'+t.share+'</button>':'')+'</div><p class="status" data-status role="status"></p></section><section><h2>'+t.hours+'</h2><p>'+({open:t.hoursOpen,closed:t.hoursClosed,unknown:t.unknownHours}[data.openingState]||t.unknownHours)+'</p>'+(weekDays?'<h3>'+t.weekly+'</h3><dl>'+weekDays+'</dl>':'')+(exceptions?'<h3>'+t.special+'</h3><dl>'+exceptions+'</dl>':'')+'</section></div>'+feedback()
  }
  function contact(){
    const email=typeof business.email==='string'&&/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(business.email)?business.email:''
    const phone=typeof business.phone==='string'&&/^\+\d{7,15}$/.test(business.phone)?business.phone:''
    const links=[email?'<a class="ext" href="mailto:'+esc(email)+'">'+t.email+' <bdi>'+esc(email)+'</bdi></a>':'',phone?'<a class="ext" href="tel:'+esc(phone)+'">'+t.phone+' <bdi>'+esc(phone)+'</bdi></a>':'',external(/^\+[1-9]\d{7,14}$/.test(business.whatsapp||'')?'https://wa.me/'+business.whatsapp.slice(1):'',t.whatsapp),approvedSocial()].join('')
    return heading(title,editBody(links?t.contactText:t.contactNone))+'<div class="page-body">'+(links?'<div class="contact-list">'+links+'</div>':'')+btn('location',t.visit,'outline')+'</div>'
  }
  function galleryPage(){
    return heading(title,editBody(t.galleryText))+'<div class="page-body">'+(approvedGallery.length?'<div class="gallery">'+approvedGallery.map(g=>'<figure>'+img(g.image,local(g.alt,lang))+(local(g.name,lang)?'<figcaption>'+esc(local(g.name,lang))+'</figcaption>':'')+'</figure>').join('')+'</div>':'<p>'+t.galleryNone+'</p>'+(!production?'<h2>'+t.concepts+'</h2><div class="gallery">'+imageStudy()+imageStudy(true)+'</div>':''))+'</div>'
  }
  let content
  if(code)content=heading(code===404?t.notFound:t.oops,code===404?t.notFoundText:t.oopsText)+'<div class="page-body">'+btn('',t.home)+'</div>'
  else if(productDetail)content=detail(productDetail)
  else if(page==='')content=home()
  else if(page==='menu')content=menu()
  else if(page==='location')content=visit()
  else if(page==='contact')content=contact()
  else if(page==='gallery')content=galleryPage()
  else if(page==='privacy'||page==='terms')content=heading(title)+'<article class="reading"><p>'+editBody(t[page+'Text'])+'</p>'+(!local(approvedPage.body,lang)?'<p>'+t[page+'2']+'</p>':'')+'</article>'
  else content='<div class="story-layout"><div>'+heading(title,editBody(page==='about'?t.aboutText:t.experienceText))+btn(page==='about'?'location':'menu',page==='about'?t.visit:t.menuCta)+'</div>'+imageStudy(page==='experience',true)+'</div>'
  const footer='<footer><div class="footer-inner"><div><a href="'+url()+'" aria-label="'+esc(brand)+'">'+wordmark+'</a><p>'+esc(city||brand)+'</p></div><nav aria-label="'+t.footer+'">'+pageKeys.slice(1).map(navLink).join('')+approvedSocial()+'</nav></div><div class="fine"><span>© '+esc(new Date(now).getUTCFullYear())+' '+esc(brand)+'</span>'+(!production?'<span>'+t.preview+'</span>':'')+'</div></footer>'
  const canonicalOrigin=https(origin)?.replace(/\/$/,'')||''
  const seo=data.seo?.[page||'home']??{}
  const metaTitle=(productDetail?title:local(seo.title,lang)||title)+' | '+brand
  const description=code?title:productDetail?(local(productDetail.description,lang)||title):local(seo.description,lang)||t.meta[page]
  const canonical=canonicalOrigin+url($path)
  const publicMeta=!code&&canonicalOrigin?'<link rel="canonical" href="'+esc(canonical)+'">'+['ar','en','x-default'].map(l=>'<link rel="alternate" hreflang="'+(l==='x-default'?l:l+'-SA')+'" href="'+esc(canonicalOrigin+'/'+(l==='x-default'?'ar':l)+($path?'/'+$path:''))+'">').join('')+'<meta property="og:url" content="'+esc(canonical)+'">':''
  const businessSchema={'@context':'https://schema.org','@type':'CafeOrCoffeeShop',name:brand,url:canonicalOrigin+url(),hasMenu:canonicalOrigin+url('menu')}
  if(address)businessSchema.address={'@type':'PostalAddress',streetAddress:address,addressCountry:businessSeed.country,...(city?{addressLocality:city}:{}),...(business.postalCode?{postalCode:business.postalCode}:{})}
  if(maps)businessSchema.hasMap=maps
  if(social.length)businessSchema.sameAs=social.map(s=>https(s.url)).filter(Boolean)
  const coords=business
  if(Number.isFinite(coords?.latitude)&&Number.isFinite(coords?.longitude))businessSchema.geo={'@type':'GeoCoordinates',latitude:coords.latitude,longitude:coords.longitude}
  const week=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  if(data.hours?.schedule?.weekly) businessSchema.openingHoursSpecification=Object.entries(data.hours.schedule.weekly).flatMap(([day,pairs])=>Array.isArray(pairs)?pairs.map(([opens,closes])=>({'@type':'OpeningHoursSpecification',dayOfWeek:week[Number(day)],opens,closes})):[])
  let schema=page==='menu'?{'@context':'https://schema.org','@type':'Menu',name:t.menuDesc,inLanguage:locale,hasMenuItem:products.map(p=>({'@type':'MenuItem',name:local(p.name,lang),url:canonicalOrigin+url('menu/'+slug(p.slug)),...(Number.isFinite(p.price)?{offers:{'@type':'Offer',price:p.price,priceCurrency:'SAR'}}:{})}))}:businessSchema
  const socialPhoto=productDetail?.image||heroAsset?.image||(!production?'/assets/studio-hero.webp':'')
  const socialSrc=asset(socialPhoto)
  const socialMeta=socialSrc&&(https(socialSrc)||canonicalOrigin)?'<meta property="og:image" content="'+esc(https(socialSrc)||canonicalOrigin+socialSrc)+'">':''
  return '<!doctype html><html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+esc(metaTitle)+'</title><meta name="description" content="'+esc(description)+'"><meta name="robots" content="'+(code||!production||data.indexable===false?'noindex,nofollow':'index,follow')+'"><meta property="og:title" content="'+esc(metaTitle)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:locale" content="'+(lang==='ar'?'ar_SA':'en_SA')+'"><meta property="og:type" content="website">'+publicMeta+socialMeta+(production&&!code&&canonicalOrigin?'<script type="application/ld+json">'+scriptData(schema)+'</script>':'')+'<link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script></head><body>'+header+'<main class="wrap" id="main" tabindex="-1">'+(page&&!code?'<nav class="crumb" aria-label="'+t.list+'"><a href="'+url()+'">'+t.nav['']+'</a><span aria-hidden="true">/</span>'+(productDetail?'<a href="'+url('menu')+'">'+t.nav.menu+'</a><span aria-hidden="true">/</span>':'')+'<span aria-current="page">'+esc(title)+'</span></nav>':'')+content+'</main>'+footer+'</body></html>'
}
