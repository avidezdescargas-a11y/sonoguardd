/** SonoGuard IA: chat flotante sobre el panel principal y la cámara, misma sesión Firebase. */
import {firebaseConfig} from './firebase-config.js';
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFunctions,httpsCallable} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-functions.js';

const app=getApps().find(a=>a.name==='[DEFAULT]')||initializeApp(firebaseConfig);
const auth=getAuth(app),functions=getFunctions(app,'us-central1');
const $=id=>document.getElementById(id);
const root=$('sgChatRoot'),fab=$('sgChatFab'),panel=$('sgChatPanel'),messages=$('sgChatMessages'),input=$('sgChatInput'),form=$('sgChatForm'),send=$('sgChatSend');
let user=null,working=false,history=[];
function addMessage(text,kind='assistant'){
  const el=document.createElement('div');el.className='sgChatBubble '+(kind==='user'?'sgChatUser':kind==='system'?'sgChatSystem':'sgChatAssistant');
  el.textContent=text;messages.append(el);messages.scrollTop=messages.scrollHeight;return el;
}
function welcome(){
  messages.replaceChildren();history=[];
  addMessage('¡Hola! 👋 Soy SonoGuard IA. ¿En qué puedo ayudarte? Puedo explicarte las mediciones, orientarte para tomar una foto o preparar un aviso informativo sobre un problema de ruido en tu zona.');
  const quick=document.createElement('div');quick.className='sgChatQuick';
  for(const question of ['¿Qué significa dBFS?','¿Cómo tomo una evidencia?','¿Cómo funciona el historial?']){
    const btn=document.createElement('button');btn.type='button';btn.textContent=question;
    btn.addEventListener('click',()=>{input.value=question;input.focus();});quick.append(btn);
  }
  messages.append(quick);
}
function openChat(open){
  if(!user)return;
  panel.hidden=!open;fab.setAttribute('aria-expanded',String(open));
  if(open){if(!messages.children.length)welcome();input.focus();}
  else fab.focus();
}
function friendlyError(err){
  const code=String(err?.code||'');
  if(code.includes('resource-exhausted'))return 'Se alcanzó el límite de consultas o se está enviando demasiado rápido. Inténtalo más tarde.';
  if(code.includes('unauthenticated'))return 'Debes tener una sesión abierta en SonoGuard.';
  if(code.includes('not-found')||code.includes('unavailable')||code.includes('failed-precondition'))return 'La IA todavía no está disponible. Revisa el despliegue de Cloud Functions y la clave de OpenAI.';
  return 'No pude comunicarme con la IA ahora mismo. Inténtalo de nuevo.';
}
async function submitChat(event){
  event.preventDefault();if(!user||working)return;
  const question=input.value.trim();if(!question||question.length>600)return;
  input.value='';addMessage(question,'user');working=true;send.disabled=true;send.textContent='…';
  const waiting=addMessage('Pensando…','system');
  try{
    const previous=history.slice(-6);
    const result=await httpsCallable(functions,'chatSonoGuard')({message:question,history:previous});
    const answer=result?.data?.answer||'No recibí respuesta.';
    waiting.remove();addMessage(answer);
    history=[...history,{role:'user',content:question},{role:'assistant',content:answer}].slice(-6);
  }catch(err){waiting.remove();addMessage(friendlyError(err),'system');}
  finally{working=false;send.disabled=false;send.textContent='Enviar';input.focus();}
}
fab.addEventListener('click',()=>openChat(panel.hidden));
$('sgChatClose').addEventListener('click',()=>openChat(false));
form.addEventListener('submit',submitChat);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)openChat(false);});
onAuthStateChanged(auth,u=>{
  const changed=user?.uid!==u?.uid;user=u;
  root.hidden=!u;
  if(!u){panel.hidden=true;fab.setAttribute('aria-expanded','false');history=[];messages.replaceChildren();}
  else if(changed)welcome();
});
