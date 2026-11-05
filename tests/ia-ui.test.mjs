import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const html=readFileSync('public/sonoguard-ia.html','utf8');
const code=readFileSync('public/sonoguard-ia.js','utf8');
const shell=readFileSync('public/sonoguard-shell.js','utf8');
const index=readFileSync('public/index.html','utf8');
test('Cámara en vivo sin subida manual de fotografías',()=>{
 assert.match(html,/id="camera-video"/);
 assert.match(code,/getUserMedia\(\{video:/);
 assert.doesNotMatch(html,/type="file"/);
 assert.match(code,/drawImage\(video,0,0,width,height\)/);
});
test('La IA comparte la sesión existente de SonoGuard',()=>{
 assert.doesNotMatch(html,/id="login-form"/);
 assert.match(code,/onAuthStateChanged\(auth,/);
 assert.match(shell,/sonoguardIaLink/);
 assert.match(index,/id="sgIaFrame"/);
});
test('Nombre completo y consentimiento se solicitan después de tomar la fotografía',()=>{
 assert.match(html,/id="reporter-dialog"/);
 assert.match(html,/id="reporter-name"/);
 assert.match(code,/function openReporter\(mode\)/);
 assert.match(code,/const name=\$\('reporter-name'\)/);
 assert.match(code,/Nombre completo:/);
 assert.match(code,/downloadDataUrl\(photoUrl\)/);
});
test('Solo contacto de prueba y guardado optativo',()=>{
 assert.match(code,/TRIAL='59175830320'/);
 assert.match(code,/const saveRequested=reporterMode==='save'\|\|\$\('save-consent'\)\.checked/);
 assert.match(code,/if\(saveRequested\)/);
 assert.match(code,/photoPath:path/);
});
