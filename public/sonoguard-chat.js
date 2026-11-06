import {tr,getLanguage} from './sonoguard-i18n.js';
/** SonoGuard IA: chat flotante sobre el panel principal y la cámara, misma sesión Firebase. */
import {firebaseConfig,appConfig} from './firebase-config.js';
import {consultarSonoGuardIA} from './sonoguard-ai-client.js';
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

const app=getApps().find(a=>a.name==='[DEFAULT]')||initializeApp(firebaseConfig);
const auth=getAuth(app);
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
    btn.addEventListener('click',()=>{input.value=btn.textContent;input.focus();});quick.append(btn);
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
  return err?.message||'No pude comunicarme con el asistente. Revisa el Worker y sus configuraciones.';
}
async function submitChat(event){
  event.preventDefault();if(!user||working)return;
  const question=input.value.trim();if(!question||question.length>600)return;
  input.value='';addMessage(question,'user');working=true;send.disabled=true;send.textContent='…';
  const waiting=addMessage('Pensando…','system');
  try{
    const previous=history.slice(-6);
    if(user.uid!==appConfig.adminUid)throw Error('La IA se limita al administrador para proteger los $5 de saldo.');
    const result=await consultarSonoGuardIA(auth,'chat',{message:question,history:previous});
    const answer=result?.answer||'No recibí respuesta.';
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

document.addEventListener('sonoguard:language-change',()=>{ if(!history.length)welcome(); });
