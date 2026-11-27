'use strict'
const get = selector => document.querySelector(selector)
const switcher = get('[data-lang-switch]')
switcher?.addEventListener('click', () => {
  const lang = switcher.getAttribute('lang')
  if (lang === 'ar' || lang === 'en') document.cookie = 'jas_lang='+lang+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'')
})
const mobile = get('.mobile-nav')
if (mobile) {
  document.addEventListener('keydown', event => {
    if(event.key==='Escape'&&mobile.open){mobile.open=false;mobile.querySelector('summary').focus()}
  })
  document.addEventListener('click',event=>{if(mobile.open&&!mobile.contains(event.target))mobile.open=false})
}
const printer=get('[data-print]')
if(printer){printer.hidden=false;printer.addEventListener('click',()=>window.print())}
const size=get('[data-size]')
if(size)size.addEventListener('change',()=>{get('[data-price]').textContent=size.value})
const category=get('[data-category]')
if(category)category.addEventListener('change',()=>category.form.requestSubmit())
const copy=get('[data-copy]'),share=get('[data-share]'),status=get('[data-status]')
if(copy && navigator.clipboard){
  copy.hidden=false
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(get('[data-address]').textContent);status.textContent=copy.dataset.good}catch{status.textContent=copy.dataset.fail}})
}
if(share && (navigator.share||navigator.clipboard)){
  share.hidden=false
  share.addEventListener('click',async()=>{try{
    if(navigator.share){await navigator.share({url:share.dataset.share});status.textContent=share.dataset.good}
    else{await navigator.clipboard.writeText(share.dataset.share);status.textContent=share.dataset.copied}
  }catch(err){if(err.name!=='AbortError')status.textContent=share.dataset.fail}})
}
