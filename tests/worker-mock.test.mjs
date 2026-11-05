import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createSign} from 'node:crypto';
import worker from '../cloudflare-worker/worker.js';
const ORIGIN='https://avidezdescargas-a11y.github.io';
const env={OPENAI_API_KEY:'sk-test-no-real',AUTHORIZED_UID:'admin123',AI_QUOTA:{values:new Map(),async get(k){return this.values.get(k)??null},async put(k,v){this.values.set(k,v)}}};
function req(token,body={mode:'chat',message:'¿Qué es dBFS?'}, origin=ORIGIN){return new Request('https://test.workers.dev/api/ai',{method:'POST',headers:{origin,authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)});}
test('Worker no llama a OpenAI sin autorización ni desde origen incorrecto',async()=>{
  let res=await worker.fetch(req('invalido'),env);assert.equal(res.status,401);
  res=await worker.fetch(req('invalido',{},'https://atacante.com'),env);assert.equal(res.status,403);
});
test('Worker valida firma JWT, restringe UID y consume cuota en KV',async()=>{
  const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk=publicKey.export({format:'jwk'});jwk.kid='prueba';jwk.use='sig';
  const now=Math.floor(Date.now()/1000);
  const encode=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
  function jwt(uid){const h=encode({alg:'RS256',kid:'prueba',typ:'JWT'}),p=encode({iss:'https://securetoken.google.com/sonoguard-da942',aud:'sonoguard-da942',sub:uid,iat:now-60,auth_time:now-60,exp:now+3600});const sign=createSign('RSA-SHA256');sign.update(h+'.'+p);sign.end();return h+'.'+p+'.'+sign.sign(privateKey).toString('base64url');}
  const oldFetch=globalThis.fetch;
  let count=0;
  globalThis.fetch=async (url,opts)=>{
    if(String(url).includes('googleapis.com'))return new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{'cache-control':'public, max-age=1200'}});
    assert.equal(url,'https://api.openai.com/v1/responses');
    assert.equal(opts.headers.Authorization,'Bearer sk-test-no-real');
    const args=JSON.parse(opts.body);assert.equal(args.model,'gpt-6-luna');assert.equal(args.max_output_tokens,240);assert.equal(args.store,false);
    count++;
    return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Una lectura digital relativa.'}]}]}),{status:200});
  };
  try{
    let res=await worker.fetch(req(jwt('otrousuario')),env);assert.equal(res.status,403);assert.equal(count,0);
    for(let i=0;i<8;i++){res=await worker.fetch(req(jwt('admin123')),env);assert.equal(res.status,200);assert.equal((await res.json()).answer,'Una lectura digital relativa.');}
    res=await worker.fetch(req(jwt('admin123')),env);assert.equal(res.status,429);assert.equal(count,8);
    res=await worker.fetch(req(jwt('admin123'),{mode:'analyze',db:42,unit:'dBFS'}),env);assert.equal(res.status,429);
  }finally{globalThis.fetch=oldFetch;}
});
