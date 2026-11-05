import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const html=readFileSync('public/sonoguard-ia.html','utf8');
const index=readFileSync('public/index.html','utf8');
const js=readFileSync('public/sonoguard-ia.js','utf8');
const chat=readFileSync('public/sonoguard-chat.js','utf8');
const shell=readFileSync('public/sonoguard-shell.js','utf8');
const rules=readFileSync('firestore.rules','utf8');
const config=readFileSync('firebase.json','utf8');
const worker=readFileSync('cloudflare-worker/worker.js','utf8');
test('Cámara real y sesión compartida en un solo panel, sin iframe ni otra pantalla de login',()=>{
  assert.match(html,/id="camera-video"/);
  assert.match(js,/navigator\.mediaDevices\.getUserMedia/);
  assert.match(js,/drawImage\(video,0,0,width,height\)/);
  assert.match(js,/onAuthStateChanged\(auth,/);
  assert.match(shell,/sonoguardIaLink/);
  assert.match(index,/id="sgIaContainer"/);
  assert.doesNotMatch(index,/<iframe/i);
  assert.doesNotMatch(html,/type="file"/);
});
test('Sin Firebase Storage ni imágenes enviadas a Firestore',()=>{
  assert.doesNotMatch(js,/firebase-storage\.js|getStorage|uploadBytes|getBlob|deleteObject|storageRef/);
  assert.doesNotMatch(config,/"storage"\s*:/);
  assert.match(js,/async function persistEvidence\(r\)/);
  assert.match(js,/await setDoc\(doc\(db,'sgEvidence',id\),record\)/);
  assert.doesNotMatch(js,/photoPath:|photoData:|imageBase64:|imageUrl:/);
  assert.match(js,/downloadJpg\(blob\)/);
  assert.match(html,/No se suben fotos a Firebase/);
});
test('Ubicación automática con fallback sin bloquear cámara cuando GPS falta',()=>{
  assert.match(js,/navigator\.geolocation\.watchPosition/);
  assert.match(js,/navigator\.geolocation\.getCurrentPosition/);
  assert.match(js,/const ready=cameraReady;/);
  assert.match(js,/readingValid\(\)\?measure\(\):\{db:null,unit:'sin lectura',source:'sin_mic'\}/);
  assert.match(js,/Ubicación no disponible/);
  assert.match(html,/id="maps-link"/);
});
test('Historial de solo metadatos, sin índice compuesto, con borrado individual',()=>{
  assert.match(js,/where\('ownerUid','==',user\.uid\),limit\(100\)/);
  assert.doesNotMatch(js,/where\('ownerUid','==',user\.uid\),orderBy/);
  assert.match(js,/rows\.sort\(/);
  assert.match(js,/deleteDoc\(doc\(db,'sgEvidence',id\)\)/);
  assert.doesNotMatch(js,/createElement\('img'\)/);
  assert.match(js,/Ver datos/);
  assert.match(js,/Eliminar registro/);
  assert.match(html,/solo los datos/);
});
test('WhatsApp solicita nombre solo al compartir y conserva contacto de prueba',()=>{
  assert.match(html,/id="reporter-name"/);
  assert.match(js,/const name=\$\('reporter-name'\)/);
  assert.match(js,/TRIAL='59175830320'/);
  assert.match(js,/window\.open\('about:blank'/);
  assert.match(chat,/¿En qué puedo ayudarte\?/);
});
test('Reglas no alteran rutas originales y permiten guardar ubicación no disponible',()=>{
  assert.match(rules,/match \/places\/\{id\}/);
  assert.match(rules,/match \/settings\/global/);
  assert.match(rules,/d\.lat == null && d\.lng == null && d\.gpsAccuracyM == null/);
  assert.match(rules,/d\.db == null && d\.unit == 'sin lectura'/);
  assert.doesNotMatch(rules,/photoPath/);
  assert.match(rules,/allow delete: if signedIn\(\) && resource\.data\.ownerUid == request\.auth\.uid/);
  assert.match(worker,/verifyFirebase/);
});
