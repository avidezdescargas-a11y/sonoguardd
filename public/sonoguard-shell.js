/** Panel SonoGuard: abre la cámara IA DENTRO del dashboard, sin una segunda pantalla de login. */
const byId=id=>document.getElementById(id);
const trigger=byId('sonoguardIaLink'), container=byId('sgIaContainer'), frame=byId('sgIaFrame');
const dashboardMain=byId('dashboard').querySelector('main');
const open=(enabled)=>{
  if(enabled && byId('dashboard').hidden)return;
  if(enabled){
    if(!byId('stop').disabled)byId('stop').click(); // evita dos capturas de audio simultáneas
    if(frame.getAttribute('src')==='about:blank')frame.setAttribute('src',frame.dataset.src);
  }else if(frame.contentWindow){
    try{frame.contentWindow.postMessage({source:'sonoguard-shell',action:'pause-media'},location.origin);}catch(e){console.warn('La cámara del módulo se liberará al cerrar la página.',e);}
  }
  dashboardMain.hidden=enabled;container.hidden=!enabled;
  trigger.setAttribute('aria-expanded',String(enabled));
  trigger.textContent=enabled?'↩ Volver a SonoGuard':'📸 Evidencia + IA';
  if(enabled)container.scrollIntoView({behavior:'smooth',block:'start'});
  else {byId('dashboard').scrollIntoView({behavior:'smooth',block:'start'});window.dispatchEvent(new Event('resize'));}
};
trigger.addEventListener('click',()=>open(container.hidden));
byId('sgIaBack').addEventListener('click',()=>open(false));
