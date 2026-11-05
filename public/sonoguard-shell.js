/** Panel único: alterna entre el analizador y la evidencia en el MISMO documento. */
const byId=id=>document.getElementById(id);
const trigger=byId('sonoguardIaLink');
const container=byId('sgIaContainer');
const dashboardMain=byId('dashboard').querySelector(':scope > main');
function openEvidence(enabled){
  if(enabled && byId('dashboard').hidden)return;
  if(enabled && !byId('stop').disabled)byId('stop').click();
  if(!enabled)window.dispatchEvent(new CustomEvent('sgia:pause-media'));
  dashboardMain.hidden=enabled;
  container.hidden=!enabled;
  trigger.setAttribute('aria-expanded',String(enabled));
  trigger.textContent=enabled?'↩ Volver a SonoGuard':'📸 Evidencia + IA';
  if(enabled){container.scrollIntoView({behavior:'smooth',block:'start'});}
  else{byId('dashboard').scrollIntoView({behavior:'smooth',block:'start'});window.dispatchEvent(new Event('resize'));}
}
trigger.addEventListener('click',()=>openEvidence(container.hidden));
byId('sgIaBack').addEventListener('click',()=>openEvidence(false));
window.addEventListener('sgia:go-back',()=>openEvidence(false));
