/**
 * SonoGuard IA - Cloudflare Worker Free (ES module, sin dependencias externas).
 * La clave OpenAI vive SOLO en el secreto OPENAI_API_KEY de Cloudflare.
 * Seguridad: verifica criptográficamente el ID token de Firebase y restringe
 * las llamadas al UID autorizado antes de contactar a OpenAI.
 * Sin contador diario de preguntas. OpenAI seguirá cobrando por tokens usados.
 */
const PROJECT_ID = 'sonoguard-da942';
const ALLOWED_ORIGIN = 'https://avidezdescargas-a11y.github.io';
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwks = null;
let jwksExpires = 0;
function cors(origin){return {
  'Access-Control-Allow-Origin': origin===ALLOWED_ORIGIN?origin:ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
  'Vary':'Origin','Cache-Control':'no-store'
};}
function json(obj,status=200,origin=''){return new Response(JSON.stringify(obj),{status,headers:{...cors(origin),'Content-Type':'application/json; charset=utf-8'}});}
function fail(msg,status,origin){return json({error:msg},status,origin);}
function decodeBase64Url(input){
  if(!/^[A-Za-z0-9_-]+$/.test(input))throw Error('JWT malformado');
  const raw=atob(input.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-input.length%4)%4));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function jwtJson(input){return JSON.parse(new TextDecoder().decode(decodeBase64Url(input)));}
async function verifyFirebase(token){
  if(!token||token.length>8192)throw Error('Token inválido');
  const parts=token.split('.');if(parts.length!==3)throw Error('Token inválido');
  const header=jwtJson(parts[0]),claims=jwtJson(parts[1]);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>150)throw Error('JWT inválido');
  const now=Math.floor(Date.now()/1000);
  if(claims.iss!==`https://securetoken.google.com/${PROJECT_ID}`||claims.aud!==PROJECT_ID||
    typeof claims.sub!=='string'||!claims.sub||claims.sub.length>128||
    !Number.isFinite(claims.exp)||claims.exp<=now||
    !Number.isFinite(claims.iat)||claims.iat>now+60||
    !Number.isFinite(claims.auth_time)||claims.auth_time>now+60)throw Error('Sesión no válida');
  if(!jwks||Date.now()>jwksExpires){
    const res=await fetch(JWKS_URL);
    if(!res.ok)throw Error('No se pudo verificar la sesión');
    jwks=await res.json();
    const maxAge=Number(res.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||1800);
    jwksExpires=Date.now()+Math.min(maxAge,3600)*1000;
  }
  const key=jwks.keys?.find(x=>x.kid===header.kid&&x.kty==='RSA'&&x.use==='sig');
  if(!key)throw Error('Clave de firma no válida');
  const publicKey=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const data=new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,decodeBase64Url(parts[2]),data))throw Error('Firma inválida');
  return claims.sub;
}
const INSTRUCTIONS = `Eres SonoGuard IA, un asistente ciudadano sobre mediciones acústicas en La Paz, Bolivia.
Responde en español amable, de manera concisa (máximo 130 palabras).
Explica mediciones digitales y contaminación acústica con cuidado.
Los dBFS no equivalen a dB SPL. Las mediciones telefónicas no están certificadas ni prueban infracciones.
No identifiques culpables, no prometas inspecciones ni sanciones; orienta sobre reportes informativos.
Si te piden datos personales, fotografías o ubicaciones exactas, indica que no hacen falta para asesorar.
No inventes leyes, sanciones, valores ambientales oficiales ni contactos.`;
function safeHistory(h){return Array.isArray(h)?h.slice(-4).filter(x=>
    (x.role==='user'||x.role==='assistant')&&typeof x.content==='string')
    .map(x=>({role:x.role,content:x.content.slice(0,400)})):[];}
async function answerWithOpenAI(env,body){
  let input=[];
  if(body.mode==='chat'){
    if(typeof body.message!=='string'||!body.message.trim()||body.message.length>500)throw Error('Pregunta inválida');
    input=[...safeHistory(body.history),{role:'user',content:body.message.trim()}];
  } else if(body.mode==='analyze'){
    if(!Number.isFinite(body.db)||body.db< -120||body.db>150||!['dBFS','dB SPL'].includes(body.unit))throw Error('Lectura inválida');
    const q=typeof body.question==='string'?body.question.slice(0,400):'';
    const qualifier=body.unit==='dBFS'?'lectura digital (no equivale a ruido ambiental)':'estimación no certificada';
    input=[{role:'user',content:`Explica la lectura ${body.db.toFixed(1)} ${body.unit}, ${qualifier}. ${q}`}];
  } else throw Error('Modo desconocido');
  const api=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:'gpt-6-luna',reasoning:{effort:'none'},instructions:(body.language==='en' ? 'You are SonoGuard AI, a citizen assistant for acoustic measurements in La Paz, Bolivia. Answer entirely in English and keep responses under 130 words. Explain acoustic readings and noise carefully: dBFS does not equal dB SPL; phone readings are not certified, and do not establish a legal violation. Do not blame anyone, promise inspections or sanctions, invent official laws/contacts, or ask for personal details and precise locations.' : INSTRUCTIONS),input,
      max_output_tokens:240,store:false})
  });
  if(!api.ok){if(api.status===429)return {error:'OpenAI alcanzó una cuota o límite. Revisa el saldo.',status:429};
    if(api.status===401)return {error:'La API Key en Cloudflare no es válida.',status:502};
    return {error:'OpenAI no respondió correctamente ('+api.status+').',status:502};}
  const response=await api.json();
  const answer=(response.output||[]).flatMap(x=>(x.content||[]).filter(p=>p.type==='output_text').map(p=>p.text||'')).join('\n').trim();
  if(!answer)return {error:'OpenAI devolvió una respuesta vacía.',status:502};
  return {answer:answer.slice(0,1600),status:200};
}
export default {async fetch(request,env){
  const origin=request.headers.get('origin')||'';
  if(request.method==='GET'&&new URL(request.url).pathname==='/health')
    return json({ok:true,service:'SonoGuard IA',keyConfigured:!!env.OPENAI_API_KEY,
      uidConfigured:!!env.AUTHORIZED_UID,quotaMode:'sin_limite_diario'});
  if(origin!==ALLOWED_ORIGIN)return fail('Origen no autorizado.',403,origin);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
  if(request.method!=='POST'||new URL(request.url).pathname!=='/api/ai')return fail('Ruta no encontrada.',404,origin);
  if(!env.OPENAI_API_KEY||!env.AUTHORIZED_UID)return fail('Worker sin configurar. Revisa el secreto OPENAI_API_KEY y el UID autorizado.',503,origin);
  const auth=request.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return fail('Abre sesión en SonoGuard.',401,origin);
  let uid;
  try{uid=await verifyFirebase(auth.slice(7));}catch{return fail('Sesión de Firebase no válida o expirada.',401,origin);}
  if(uid!==env.AUTHORIZED_UID)return fail('Por ahora la IA está reservada al administrador para cuidar el saldo.',403,origin);
  const length=Number(request.headers.get('content-length')||0);
  if(length>4000)return fail('Consulta demasiado larga.',413,origin);
  let body;
  try{body=await request.json();}catch{return fail('JSON inválido.',400,origin);}
  if(JSON.stringify(body).length>4000)return fail('Consulta demasiado larga.',413,origin);
  if(!body||!['chat','analyze'].includes(body.mode))return fail('Solicitud inválida.',400,origin);
  try{
    const reply=await answerWithOpenAI(env,body);
    return reply.error?fail(reply.error,reply.status,origin):json({answer:reply.answer},200,origin);
  }catch(err){
    if(String(err?.message||'').includes('inválida')||String(err?.message||'').includes('desconocido'))
      return fail(String(err.message),400,origin);
    return fail('No se pudo completar la consulta de IA. Comprueba el Worker.',500,origin);
  }
}};
