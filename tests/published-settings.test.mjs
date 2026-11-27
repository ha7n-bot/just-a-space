import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage} from '../web/render.mjs';

const photo = '/admin-media/' + '1'.repeat(64) + '.png';
const data = {
  gallery: [{slug:'audit-image',image:photo,name:{en:'Fixture',ar:'تجربة'},alt:{en:'Image fixture',ar:'صورة تجريبية'}}],
  settings: {business:{latitude:24.7,longitude:46.7,whatsapp:'+966500000000'}}
};

function render(path,lang) {
  return renderPage({path,lang,data,production:true,origin:'https://example.test'});
}

test('published gallery uploads appear in both locales',()=>{
  for (const lang of ['ar','en']) {
    assert.ok(render('gallery',lang).includes('src="'+photo+'"'));
  }
});

test('published contact and coordinates reach contact page and business schema',()=>{
  for (const lang of ['ar','en']) {
    assert.match(render('contact',lang),/https:\/\/wa\.me\/966500000000/);
    const html = render('location',lang);
    const script = html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
    assert.ok(script);
    const schema = JSON.parse(script[1]);
    assert.equal(schema.geo?.latitude,24.7);
    assert.equal(schema.geo?.longitude,46.7);
  }
});
