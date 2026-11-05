import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const html=readFileSync('public/sonoguard-ia.html','utf8');
const code=readFileSync('public/sonoguard-ia.js','utf8');
const chat=readFileSync('public/sonoguard-chat.js','utf8');
const backend=readFileSync('functions/index.cjs','utf8');
const shell=readFileSync('public/sonoguard-shell.js','utf8');
const index=readFileSync('public/index.html','utf8');
const rules=readFileSync('firestore.rules','utf8');
test('Cámara en vivo sin subida manual desde galería',()=>{
  assert.match(html,/id="camera-video"/);
  assert.match(code,/getUserMedia\(\{video:/);
  assert.doesNotMatch(html,/type="file"/);
  assert.match(code,/drawImage\(video,0,0,width,height\)/);
});
test('IA y cámara comparten inicio de sesión del panel original',()=>{
  assert.doesNotMatch(html,/id="login-form"/);
  assert.match(code,/onAuthStateChanged\(auth,/);
  assert.match(shell,/sonoguardIaLink/);
  assert.match(index,/id="sgIaContainer"/);
  assert.match(index,/id="camera-video"/);
  assert.doesNotMatch(index,/<iframe/i);
  assert.match(shell,/dashboardMain.hidden=enabled/);
});
test('Captura guarda inmediatamente sin preguntar nombre, muestra estado',()=>{
  assert.match(code,/await persistEvidence\(record,blob\)/);
  assert.match(html,/id="auto-save-state"/);
  assert.match(code,/Guardando fotografía en tu historial privado/);
  assert.match(code,/downloadJpg\(blob\)/);
  assert.doesNotMatch(code,/saveRequested/);
  assert.doesNotMatch(html,/id="save-cloud"/);
  assert.match(rules,/d\.ownerName == ''/);
});
test('Nombre completo se solicita solamente en el envío a WhatsApp de prueba',()=>{
  assert.match(html,/id="reporter-dialog"/);
  assert.match(html,/id="reporter-name"/);
  assert.match(code,/function openReporter\(/);
  assert.match(code,/const name=\$\('reporter-name'\)/);
  assert.match(code,/downloadJpg\(blob\)/);
  assert.match(code,/TRIAL='59175830320'/);
  assert.match(code,/window\.open\('about:blank'/);
});
test('Asistente flotante visible en todo el panel durante la sesión',()=>{
  assert.match(index,/id="sgChatFab"/);
  assert.match(index,/id="sgChatPanel"/);
  assert.match(index,/sonoguard-chat\.js/);
  assert.match(chat,/¿En qué puedo ayudarte\?/);
  assert.match(chat,/onAuthStateChanged\(auth,/);
  assert.match(chat,/httpsCallable\(functions,'chatSonoGuard'\)/);
  assert.match(backend,/exports\.chatSonoGuard=onCall/);
});
test('Los lugares y ajustes conservan exactamente las rutas tradicionales',()=>{
  assert.match(rules,/match \/places\/\{id\}/);
  assert.match(rules,/match \/settings\/global/);
  assert.match(backend,/store:false/);
});

test('No hay lectura ni ubicación modificable; el micrófono y GPS alimentan la foto',()=>{
  for(const id of ['reading-type','declared-db','zone','known-place','possible-source','get-location','clear-location'])
    assert.doesNotMatch(html,new RegExp('id="'+id+'"'));
  assert.match(html,/id="gps-status"/);
  assert.match(html,/id="maps-link"/);
  assert.match(code,/navigator\.geolocation\.watchPosition/);
  assert.match(code,/startGps\(\);await startMic\(\)/);
  assert.match(code,/if\(!gpsValid\(\)\)throw Error/);
  assert.match(code,/const reading=measure\(\),point=\{\.\.\.coords\}/);
  assert.match(rules,/d\.unit == 'dBFS' && d\.source == 'microfono'/);
  assert.match(rules,/bounded\(d\.gpsAccuracyM,0,1000\)/);
});
