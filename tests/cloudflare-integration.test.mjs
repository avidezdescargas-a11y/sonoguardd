import {readFileSync} from 'node:fs';
import {test} from 'node:test';import assert from 'node:assert/strict';
const code=readFileSync('cloudflare-worker/worker.js','utf8');
const client=readFileSync('public/sonoguard-ai-client.js','utf8');
const chat=readFileSync('public/sonoguard-chat.js','utf8');
const ai=readFileSync('public/sonoguard-ia.js','utf8');
test('clave privada solo en el Worker, sesión Firebase verificada y sin cuota diaria',()=>{
  assert.match(code,/OPENAI_API_KEY/); assert.match(code,/crypto\.subtle\.verify/);
  assert.match(code,/AUTHORIZED_UID/); assert.doesNotMatch(code,/AI_QUOTA/);
  assert.doesNotMatch(code,/MAX_CALLS_PER_DAY/); assert.doesNotMatch(client,/OPENAI_API_KEY/);
});
test('chat y análisis llaman Worker, nunca Cloud Functions',()=>{
  assert.match(chat,/consultarSonoGuardIA/);assert.match(ai,/resumenSeguro/);
  assert.doesNotMatch(chat,/httpsCallable/);assert.doesNotMatch(ai,/httpsCallable/);
  assert.match(client,/getIdToken/);
});
