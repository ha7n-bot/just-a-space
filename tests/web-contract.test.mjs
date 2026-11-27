import test from 'node:test'
import assert from 'node:assert/strict'
import {renderPage} from '../web/render.mjs'
const localized={ar:'اختبار',en:'Fixture'}
const image='/admin-media/'+'a'.repeat(64)+'.png'
const data={
  products:[{slug:'fixture',name:localized,price:18,category:'coffee',image,alt:localized,available:true}],
  categories:[{slug:'coffee',name:localized}],gallery:[{image,alt:localized,name:localized}],
  settings:{business:{name:localized,phone:'+966500000000',whatsapp:'+966500000001',latitude:24.7,longitude:46.6}},
  hours:{schedule:{weekly:{1:[['09:00','21:00']]}}}
}
for(const lang of ['ar','en']){
  const render=(path,query)=>renderPage({lang,path,query,data,origin:'https://example.com',production:true})
  test(lang+' public CMS image, geo and contact mappings',()=>{
    for(const path of ['','menu','gallery','menu/fixture']) assert.ok(render(path).includes('src="'+image+'"'))
    assert.ok(render('contact').includes('https://wa.me/966500000001'))
    assert.ok(render('contact').includes('tel:+966500000000'))
    assert.ok(render('location').includes('"latitude":24.7,"longitude":46.6'))
    assert.ok(render('location').includes('"dayOfWeek":"Monday"'))
  })
  test(lang+' filters maintain page language and escaped query',()=>{
    const html=render('menu',new URLSearchParams({q:'<script>',category:'coffee'}))
    assert.ok(html.includes('&lt;script&gt;'))
    assert.ok(html.includes('q=%3Cscript%3E&amp;category=coffee'))
    assert.ok(!html.includes('data-product data-name'))
  })
}
