const test=require('node:test'), assert=require('node:assert/strict');
const {normalizeEvidence,responseText}=require('../logic.cjs');
test('dBFS no se convierte a SPL',()=>{const e=normalizeEvidence({db:-25.3,unit:'dBFS',source:'microfono',zone:'La Paz'});assert.equal(e.unit,'dBFS');assert.equal(e.db,-25.3);});
test('rechaza 80 dBFS',()=>assert.throws(()=>normalizeEvidence({db:80,unit:'dBFS'})));
test('acepta SPL declarado',()=>assert.equal(normalizeEvidence({db:80.2,unit:'dB SPL',source:'declarada'}).unit,'dB SPL'));
test('extrae respuesta',()=>assert.equal(responseText({output:[{content:[{type:'output_text',text:'Sugerencia cautelosa.'}]}]}),'Sugerencia cautelosa.'));
