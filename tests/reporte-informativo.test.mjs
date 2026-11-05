import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const html=readFileSync('public/index.html','utf8');
const standalone=readFileSync('public/sonoguard-ia.html','utf8');
const js=readFileSync('public/sonoguard-ia.js','utf8');
const chat=readFileSync('public/sonoguard-chat.js','utf8');
const fn=readFileSync('functions/index.cjs','utf8');
const rules=readFileSync('firestore.rules','utf8');
test('interfaz usa reportes informativos',()=>{
  for(const page of [html,standalone]){
    assert.match(page,/Informar un problema de ruido/);
    assert.match(page,/Nombre completo de quien informa/);
    assert.match(page,/Informar problema por WhatsApp \(prueba\)/);
    assert.doesNotMatch(page,/denunciante|denuncias oficiales|NO ES DENUNCIA/i);
  }
});
test('WhatsApp pide revisar zona sin atribuir culpables',()=>{
  assert.match(js,/revise la situación/);
  assert.match(js,/visita de verificación/);
  assert.match(js,/ni garantiza una visita/);
  assert.match(js,/59175830320/);
  assert.match(js,/Persona que informa:/);
  assert.doesNotMatch(js,/denunciante|denuncia oficial/i);
});
test('IA mantiene charla y advierte que no es un trámite',()=>{
  assert.match(chat,/aviso informativo/);
  assert.match(fn,/avisos informativos/);
  assert.match(fn,/no implica atención ni visita oficial/);
});
test('se preservan las colecciones originales',()=>{
  assert.match(rules,/match \/places\/\{id\}/);
  assert.match(rules,/match \/settings\/global/);
});
