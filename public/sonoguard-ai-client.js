/** Cliente del Worker. Usa tu sesión Firebase actual; jamás transmite la clave OpenAI. */
import {SONOGUARD_WORKER_URL} from './sonoguard-ai-config.js';
export async function consultarSonoGuardIA(auth,mode,payload){
  const url=String(SONOGUARD_WORKER_URL||'').replace(/\/$/,'');
  if(!url.startsWith('https://')||url.includes('REEMPLAZA')){
    throw Error('Falta configurar la URL de Cloudflare Worker en sonoguard-ai-config.js.');
  }
  const current=auth.currentUser;
  if(!current)throw Error('Inicia sesión en SonoGuard para usar la IA.');
  const token=await current.getIdToken();
  let response;
  try{
    response=await fetch(url+'/api/ai',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify({mode,...payload}),
    });
  }catch{throw Error('No fue posible conectar con Cloudflare. Comprueba la URL del Worker y la conexión.');}
  const json=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(json.error||('Error de la IA ('+response.status+').'));
  return json;
}
