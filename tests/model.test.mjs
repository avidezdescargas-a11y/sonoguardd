import assert from 'node:assert/strict';
import {defaults,normalizeSettings,validatePlace,validateSettings} from '../public/data-model.js';
const p={name:'Salón A',type:'Salón de eventos',lat:-16.5,lng:-68.15,radius:150,limit_db:80,limit_note:'Interior'};
assert.equal(validatePlace(p).limit_db,80);assert.throws(()=>validatePlace({...p,lat:91}));assert.throws(()=>validatePlace({...p,limit_db:151}));assert.throws(()=>validatePlace({...p,name:''}));assert.equal(validatePlace({...p,limit_db:null}).limit_db,null);
assert.deepEqual(validateSettings({...defaults}),defaults);assert.throws(()=>validateSettings({...defaults,warnSpl:95,limitSpl:90}));assert.equal(normalizeSettings({warnSpl:50,limitSpl:55}).warnSpl,80);
console.log('Validación de lugares, límites y ajustes: correcta.');
