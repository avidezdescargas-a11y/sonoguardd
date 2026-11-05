/** SonoGuard IA: cámara EN VIVO, sesión compartida, colecciones aditivas. */
import {firebaseConfig,appConfig} from './firebase-config.js';
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,collection,doc,setDoc,getDoc,getDocs,deleteDoc,query,where,orderBy,limit,Timestamp,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {getStorage,ref as storageRef,uploadBytes,getBlob,deleteObject} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js';
import {getFunctions,httpsCallable} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-functions.js';

if(!firebaseConfig?.apiKey||!firebaseConfig?.projectId)throw Error('Firebase no configurado');
const app=getApps().find(a=>a.name==='[DEFAULT]')||initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app),storage=getStorage(app),functions=getFunctions(app,'us-central1');
const $=id=>document.getElementById(id);
const TRIAL='59175830320',OFFICIAL_REFERENCE='67123590'; // solo referencia municipal de 2022, sin confirmar vigencia
let user=null,profile=null,places=[],coords=null;
let cameraStream=null,clockTimer=0,rawPhotoCanvas=null;
let microphone=null,audioContext=null,audioNode=null,analyzer=null,micFrame=0,lastReading=null,lastReadingAt=0;
let currentRecord=null,currentImageBlob=null,currentObjectUrl=null,currentAnalysis=null,reporterMode='share';
let statusTimer;
function notify(message,error=false){const el=$('status');el.textContent=message;el.classList.toggle('error',error);el.classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>el.classList.remove('visible'),6800);}
function errorText(e){const s=String(e?.code||'');if(s.includes('permission-denied'))return 'Permiso denegado. Verifica reglas y usuario de Firebase.';if(s.includes('storage/'))return 'Revisa la activación de Firebase Storage y sus permisos.';return String(e?.message||'Ocurrió un error.').slice(0,250);}
function busy(btn,val,original){btn.disabled=val;btn.textContent=val?'Procesando…':original;}
function formatDate(date){return new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);}
const number=v=>Number(v).toFixed(1);
const recordDate=r=>r?.capturedAt?.toDate?r.capturedAt.toDate():new Date();
function make(type,cls,txt){const a=document.createElement(type);if(cls)a.className=cls;if(txt!==undefined)a.textContent=txt;return a;}
function trialLink(r){const text=`SONOGUARD IA · PROYECTO DE PRUEBA. No es una denuncia oficial.\nNombre completo: ${r.ownerName||''}\nLugar de medición: ${r.zone}.\nLectura orientativa: ${number(r.db)} ${r.unit}.\nHora (Bolivia): ${formatDate(recordDate(r))}.\nPosible fuente indicada por el usuario (sin verificar): ${r.reportedSource||'no indicada'}.\nLa foto se adjunta manualmente. No acredita una infracción.`;return `https://wa.me/${TRIAL}?text=${encodeURIComponent(text)}`;}

async function loadProfile(){const snap=await getDoc(doc(db,'sgProfiles',user.uid));profile=snap.exists()?snap.data():null;}
async function saveProfileForName(name){const data={fullName:name,organization:profile?.organization||'',type:profile?.type||'ciudadano',consent:true,updatedAt:serverTimestamp()};await setDoc(doc(db,'sgProfiles',user.uid),data);profile=data;}
async function loadPlaces(){const select=$('known-place');select.replaceChildren(new Option('Sin seleccionar',''));try{const snap=await getDocs(query(collection(db,'places'),limit(250)));places=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>typeof p.name==='string').sort((a,b)=>a.name.localeCompare(b.name,'es'));for(const p of places)select.add(new Option(`${p.name} · ${p.type||'Lugar'}`,p.id));}catch(e){notify('No se pudieron consultar los lugares de SonoGuard: '+errorText(e),true);}}

function updateHud(){
  $('hud-time').textContent=formatDate(new Date()).split(',').at(-1)?.trim()||formatDate(new Date());
  $('hud-place').textContent='Lugar: '+($('zone').value.trim()||(coords?`${coords.lat}, ${coords.lng} (GPS aprox.)`:'sin confirmar'));
  if($('reading-type').value==='declared'){
    const v=Number($('declared-db').value);$('hud-db').textContent=$('declared-db').value!==''&&Number.isFinite(v)?`${number(v)} dB SPL`:'— dB SPL';
    $('hud-source').textContent='Lectura externa declarada · sin verificar';
  }else{$('hud-db').textContent=lastReading===null?'— dBFS':`${number(lastReading)} dBFS`;$('hud-source').textContent='Micrófono digital · no certificado';}
}
async function startCamera(){
  if(cameraStream)return;
  const btn=$('start-camera');busy(btn,true,'📷 Abrir cámara en vivo');
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('La cámara requiere HTTPS y un navegador compatible.');
    cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    const video=$('camera-video');video.srcObject=cameraStream;await video.play();
    $('camera-empty').classList.add('hidden');$('stop-camera').disabled=false;$('create-evidence').disabled=false;
    updateHud();clockTimer=setInterval(updateHud,1000);notify('Cámara en vivo activa. Confirma lugar y medición antes de tomar la foto.');
  }catch(e){stopCamera();notify('No se pudo abrir la cámara: '+errorText(e),true);}finally{busy(btn,false,'📷 Abrir cámara en vivo');}
}
function stopCamera(){
  if(clockTimer)clearInterval(clockTimer);clockTimer=0;
  if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;
  const video=$('camera-video');video.pause();video.srcObject=null;
  $('camera-empty').classList.remove('hidden');$('stop-camera').disabled=true;$('create-evidence').disabled=true;
}
function stopMic(){
  if(micFrame)cancelAnimationFrame(micFrame);micFrame=0;
  if(microphone)microphone.getTracks().forEach(t=>t.stop());microphone=null;
  try{audioNode?.disconnect();}catch{}audioNode=null;
  if(audioContext)audioContext.close().catch(()=>{});audioContext=null;analyzer=null;
  lastReading=null;lastReadingAt=0;$('live-db').textContent='—';$('mic-toggle').textContent='Iniciar micrófono';updateHud();
}
async function toggleMic(){
  if(microphone){stopMic();return;}
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Se necesita HTTPS o localhost para el micrófono.');
    microphone=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    audioContext=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
    audioNode=audioContext.createMediaStreamSource(microphone);analyzer=audioContext.createAnalyser();analyzer.fftSize=4096;audioNode.connect(analyzer);
    const samples=new Float32Array(analyzer.fftSize);$('mic-toggle').textContent='Detener micrófono';
    const tick=()=>{if(!analyzer)return;analyzer.getFloatTimeDomainData(samples);let energy=0;for(const x of samples)energy+=x*x;const rms=Math.sqrt(energy/samples.length);lastReading=Math.round(Math.max(-120,Math.min(0,20*Math.log10(Math.max(rms,1e-6))))*10)/10;lastReadingAt=Date.now();$('live-db').textContent=number(lastReading);$('hud-db').textContent=`${number(lastReading)} dBFS`;micFrame=requestAnimationFrame(tick);};tick();
  }catch(e){stopMic();notify('Micrófono no disponible: '+errorText(e),true);}
}
function requestLocation(){
  if(!navigator.geolocation)return notify('Geolocalización no disponible.',true);
  const btn=$('get-location');btn.disabled=true;
  navigator.geolocation.getCurrentPosition(p=>{coords={lat:Math.round(p.coords.latitude*1e4)/1e4,lng:Math.round(p.coords.longitude*1e4)/1e4};$('coords').textContent=`Punto de medición: ${coords.lat}, ${coords.lng} (coordenadas aproximadas)`;updateHud();btn.disabled=false;},()=>{btn.disabled=false;notify('No se pudo obtener la ubicación. Escribe la zona manualmente.',true);},{enableHighAccuracy:false,timeout:10000,maximumAge:30000});
}
function measure(){
  if($('reading-type').value==='mic'){
    if(lastReading===null||Date.now()-lastReadingAt>2500)throw Error('Inicia el micrófono y espera una lectura actual antes de tomar la foto.');
    return{db:lastReading,unit:'dBFS',source:'microfono'};
  }
  const s=$('declared-db').value;if(s.trim()===''||!Number.isFinite(Number(s))||Number(s)<0||Number(s)>160)throw Error('Escribe una lectura externa declarada entre 0 y 160 dB SPL.');
  return{db:Number(s),unit:'dB SPL',source:'declarada'};
}
function wrapLines(ctx,text,maxWidth,maxLines=3){
  const parts=String(text||'').split(/\s+/),out=[];let line='';for(const part of parts){const next=line?`${line} ${part}`:part;if(ctx.measureText(next).width>maxWidth&&line){out.push(line);line=part;}else line=next;}if(line)out.push(line);return out.slice(0,maxLines);
}
function composePhoto(r){
  if(!rawPhotoCanvas)throw Error('No existe la foto original de esta sesión.');
  const width=Math.min(1500,Math.max(900,rawPhotoCanvas.width));const imageHeight=Math.round(rawPhotoCanvas.height*width/rawPhotoCanvas.width);
  const footerHeight=430;const canvas=document.createElement('canvas');canvas.width=width;canvas.height=imageHeight+footerHeight;
  const c=canvas.getContext('2d');if(!c)throw Error('No se pudo crear la imagen.');c.fillStyle='#0b2433';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(rawPhotoCanvas,0,0,width,imageHeight);
  c.fillStyle='rgba(7,26,40,.94)';c.fillRect(0,imageHeight,width,footerHeight);
  const left=35,available=width-70;
  c.fillStyle='#72f2d7';c.font='bold 32px system-ui';c.fillText('SONOGUARD IA · FOTO DE EVIDENCIA',left,imageHeight+50);
  c.fillStyle='#fff';c.font='bold 56px system-ui';c.fillText(`${number(r.db)} ${r.unit}`,left,imageHeight+118);
  c.font='26px system-ui';let y=imageHeight+165;
  for(const line of [`Fecha y hora (Bolivia): ${formatDate(recordDate(r))}`,`Lugar de medición: ${r.zone}`,`Nombre completo: ${r.ownerName||'No proporcionado'}`]){
    for(const segment of wrapLines(c,line,available,2)){c.fillText(segment,left,y);y+=32;}y+=2;
  }
  if(r.lat!==null&&r.lng!==null){c.font='22px system-ui';c.fillText(`Coordenadas aproximadas: ${r.lat}, ${r.lng}`,left,Math.min(y+4,imageHeight+330));}
  c.font='19px system-ui';c.fillStyle='#d9e4eb';c.fillText(`Contacto de PRUEBA: 75830320 · Referencia municipal 2022: ${OFFICIAL_REFERENCE} (sin confirmar)`,left,imageHeight+370);
  c.fillStyle='#ffd39d';c.font='bold 18px system-ui';c.fillText('PROYECTO DE PRUEBA · MEDICIÓN NO CERTIFICADA · NO ES DENUNCIA OFICIAL',left,imageHeight+406);
  return canvas;
}
function canvasJpeg(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo codificar la imagen.')),'image/jpeg',.83));}
function clearPhotoUrl(){if(currentObjectUrl)URL.revokeObjectURL(currentObjectUrl);currentObjectUrl=null;}
function showPreview(record,blob,{fromHistory=false}={}){
  currentRecord=record;currentImageBlob=blob;currentAnalysis=null;clearPhotoUrl();currentObjectUrl=URL.createObjectURL(blob);
  $('preview-image').src=currentObjectUrl;$('preview-panel').classList.remove('hidden');$('analysis-result').classList.add('hidden');$('ai-question').value='';
  $('save-cloud').disabled=!!record.id; // No sobrescribe evidencias inmutables.
  if(fromHistory)rawPhotoCanvas=null;
  $('preview-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
async function captureNow(){
  if(!user)return;
  try{
    const video=$('camera-video');if(!cameraStream||video.readyState<2||!video.videoWidth)throw Error('Primero abre la cámara y espera la imagen en vivo.');
    const zone=$('zone').value.trim()||(coords?`${coords.lat}, ${coords.lng} (GPS aproximado)`:'');if(zone.length<3)throw Error('Escribe el lugar de medición, elige un lugar registrado o utiliza la ubicación GPS.');
    const reading=measure();const now=Timestamp.now();
    const width=Math.min(1600,video.videoWidth),height=Math.round(video.videoHeight*width/video.videoWidth);
    rawPhotoCanvas=document.createElement('canvas');rawPhotoCanvas.width=width;rawPhotoCanvas.height=height;
    rawPhotoCanvas.getContext('2d').drawImage(video,0,0,width,height);
    const record={ownerUid:user.uid,ownerName:'',nameMode:'full',db:reading.db,unit:reading.unit,source:reading.source,zone,placeName:places.find(p=>p.id===$('known-place').value)?.name||'',reportedSource:$('possible-source').value.trim(),lat:coords?.lat??null,lng:coords?.lng??null,capturedAt:now};
    const blob=await canvasJpeg(composePhoto(record));showPreview(record,blob);notify('¡Foto capturada en ese instante! Puedes descargarla o preparar WhatsApp.');
  }catch(e){notify(errorText(e),true);}
}
function downloadJpg(blob=currentImageBlob){if(!blob)return;const url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download=`SonoGuard-evidencia-${Date.now()}.jpg`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function downloadDataUrl(dataUrl){const a=make('a');a.href=dataUrl;a.download=`SonoGuard-evidencia-con-nombre-${Date.now()}.jpg`;document.body.append(a);a.click();a.remove();}
function openReporter(mode){if(!currentRecord)return notify('Primero toma una foto o selecciona una evidencia.',true);reporterMode=mode;
  $('reporter-title').textContent=mode==='share'?'Preparar WhatsApp de prueba':'Guardar evidencia privada';
  $('reporter-help').textContent=mode==='share'?'Escribe tu nombre completo: se incluirá en la foto y en el mensaje preparado.':'Escribe tu nombre completo: se incluirá en la evidencia privada que guardes.';
  $('reporter-name').value=currentRecord.ownerName||profile?.fullName||'';
  $('reporter-consent').checked=false;$('save-consent').checked=mode==='save';$('save-consent-row').classList.toggle('hidden',mode==='save');
  $('confirm-reporter').textContent=mode==='share'?'Descargar foto y abrir WhatsApp de prueba':'Guardar en Firebase';
  $('reporter-dialog').showModal();
}
async function persistEvidence(r,blob){
  if(r.id)return; // registro histórico ya guardado: no modificar.
  await saveProfileForName(r.ownerName); // Reglas de Firestore exigen coincidencia con perfil.
  const id=doc(collection(db,'sgEvidence')).id,path=`sgEvidence/${user.uid}/${id}.jpg`;
  const record={...r,ownerUid:user.uid,createdAt:serverTimestamp(),photoPath:path};
  const image=storageRef(storage,path);await uploadBytes(image,blob,{contentType:'image/jpeg'});
  try{await setDoc(doc(db,'sgEvidence',id),record);}catch(e){await deleteObject(image).catch(()=>{});throw e;}
  currentRecord={...r,id,photoPath:path};$('save-cloud').disabled=true;await loadHistory();notify('Evidencia guardada en tu historial privado de Firebase.');
}
async function submitReporter(e){
  e.preventDefault();if(!currentRecord||!user)return;
  const name=$('reporter-name').value.trim().replace(/\s+/g,' ');
  if(name.length<5||name.length>100||name.split(' ').length<2)return notify('Escribe al menos nombre y apellido completos.',true);
  if(!$('reporter-consent').checked)return notify('Debes autorizar el uso de tu nombre completo en la foto.',true);
  if(currentRecord.id && currentRecord.ownerName!==name)return notify('Esta evidencia guardada es inmutable. Introduce el mismo nombre con el que se guardó.',true);
  const saveRequested=reporterMode==='save'||$('save-consent').checked;
  const record={...currentRecord,ownerName:name,nameMode:'full'};
  const mode=reporterMode;
  // Síncrono antes de abrir WhatsApp, para respetar el gesto del usuario y evitar bloqueo de ventanas.
  let photoUrl=null;
  if(rawPhotoCanvas){try{photoUrl=composePhoto(record).toDataURL('image/jpeg',.83);}catch(err){notify(errorText(err),true);return;}}
  $('reporter-dialog').close();
  if(mode==='share'){
    if(photoUrl)downloadDataUrl(photoUrl);else downloadJpg();
    const link=make('a');link.href=trialLink(record);link.target='_blank';link.rel='noopener noreferrer';document.body.append(link);link.click();link.remove();
  }
  const btn=$('confirm-reporter');busy(btn,true,'Continuar');
  try{
    const blob=photoUrl?await(await fetch(photoUrl)).blob():currentImageBlob;
    if(rawPhotoCanvas){
      // Mantener foto con nombre en el panel, aunque no se suba a Firebase.
      showPreview(record,blob); // por defecto NO persiste si no se autoriza.
    }
    if(saveRequested){
      if(!currentRecord?.id)await persistEvidence(record,blob);
      else notify('Esta evidencia ya estaba guardada.');
    }else if(mode==='share')notify('WhatsApp de prueba preparado. Adjunta la foto JPG descargada si lo deseas.');
  }catch(err){notify('La imagen está lista; no se pudo guardar en Firebase: '+errorText(err),true);}
  finally{busy(btn,false,mode==='share'?'Descargar foto y abrir WhatsApp de prueba':'Guardar en Firebase');}
}
async function aiAnalysis(question=''){
  if(!currentRecord?.id)return notify('Para usar IA, primero guarda esta foto en tu historial privado de Firebase.',true);
  const btn=$('analyze');busy(btn,true,'Analizar con IA');
  try{const result=await httpsCallable(functions,'analyzeSonoGuardEvidence')({recordId:currentRecord.id,question});currentAnalysis=result.data?.analysis||'Sin respuesta';$('analysis-result').textContent=currentAnalysis;$('analysis-result').classList.remove('hidden');}
  catch(e){notify('IA no disponible: '+errorText(e),true);}finally{busy(btn,false,'Analizar con IA');}
}
async function printReport(){
  if(!currentRecord||!currentImageBlob)return;
  const popup=window.open('','_blank');if(!popup)return notify('Habilita ventanas emergentes para imprimir.',true);
  const r=currentRecord;const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const reader=new FileReader();reader.onload=()=>{popup.document.open();popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte SonoGuard</title><style>body{font:16px system-ui;color:#142632;max-width:880px;margin:auto;padding:25px}img{width:100%;object-fit:contain}.warn{border:1px solid #777;padding:15px}button{padding:12px}@media print{button{display:none}}</style></head><body><h1>SonoGuard IA · Evidencia de prueba</h1><img alt="Fotografía de medición" src="${reader.result}"><p><b>Nombre:</b> ${escape(r.ownerName||'No declarado')}<br><b>Lectura:</b> ${number(r.db)} ${escape(r.unit)}<br><b>Lugar:</b> ${escape(r.zone)}<br><b>Fecha y hora:</b> ${escape(formatDate(recordDate(r)))}</p>${currentAnalysis?`<p>${escape(currentAnalysis)}</p>`:''}<p class="warn">Proyecto académico de prueba. Medición no certificada, no equivale a denuncia oficial. Contacto de prueba 75830320; referencia municipal publicada en 2022 ${OFFICIAL_REFERENCE} (vigencia sin confirmar).</p><button onclick="window.print()">Imprimir / Guardar PDF</button></body></html>`);popup.document.close();};reader.readAsDataURL(currentImageBlob);
}
function historyCard(data,id){
  const card=make('article','history-card');card.append(make('h3','',`${number(data.db)} ${data.unit}`));
  card.append(make('p','meta',`${formatDate(recordDate(data))} · ${data.zone}`));card.append(make('p','meta',`Responsable: ${data.ownerName}`));
  const image=make('img');image.alt='Foto privada de evidencia';image.loading='lazy';card.insertBefore(image,card.firstChild);
  getBlob(storageRef(storage,data.photoPath)).then(blob=>{const url=URL.createObjectURL(blob);image.src=url;image.addEventListener('load',()=>setTimeout(()=>URL.revokeObjectURL(url),20000),{once:true});}).catch(()=>{image.alt='Foto no disponible';});
  const row=make('div','buttons'),see=make('button','secondary','Ver evidencia'),del=make('button','ghost','Eliminar');
  const view=async()=>{see.disabled=true;try{showPreview({...data,id},await getBlob(storageRef(storage,data.photoPath)),{fromHistory:true});}catch(e){notify(errorText(e),true);}finally{see.disabled=false;}};
  see.addEventListener('click',view);image.addEventListener('click',view);
  del.addEventListener('click',async()=>{if(!confirm('¿Eliminar esta evidencia y su foto? No afecta hospitales ni lugares.'))return;del.disabled=true;try{await deleteObject(storageRef(storage,data.photoPath));await deleteDoc(doc(db,'sgEvidence',id));if(currentRecord?.id===id){$('preview-panel').classList.add('hidden');currentRecord=null;currentImageBlob=null;rawPhotoCanvas=null;clearPhotoUrl();}await loadHistory();notify('Evidencia eliminada.');}catch(e){notify('No se pudo eliminar: '+errorText(e),true);}finally{del.disabled=false;}});
  row.append(see,del);card.append(row);return card;
}
function renderTrends(records){const dest=$('trends');dest.replaceChildren();for(const unit of ['dBFS','dB SPL']){const set=records.filter(r=>r.unit===unit&&Number.isFinite(r.db));const panel=make('div','trend-panel');panel.append(make('h3','',unit));if(!set.length){panel.append(make('p','muted small','Sin registros de esta escala.'));dest.append(panel);continue;}const nums=set.map(r=>r.db),median=[...nums].sort((a,b)=>a-b)[Math.floor(nums.length/2)],avg=nums.reduce((a,b)=>a+b,0)/nums.length;panel.append(make('p','trend-stats',`${nums.length} mediciones · Promedio ${avg.toFixed(1)} · Mediana ${median.toFixed(1)} ${unit}`));for(const r of set.slice(0,10).reverse()){const row=make('div','trend-row'),bar=make('div','bar');bar.style.width=`${Math.max(2,((r.db+(unit==='dBFS'?120:0))/(unit==='dBFS'?120:160))*100)}%`;row.append(make('span','meta',formatDate(recordDate(r)).slice(0,10)),bar,make('span','meta',number(r.db)));panel.append(row);}panel.append(make('p','trend-warning','Resumen descriptivo: no determina infracciones ni permite comparar equipos no calibrados.'));dest.append(panel);}}
async function loadHistory(){if(!user)return;const root=$('history');root.replaceChildren(make('p','muted','Cargando…'));try{const q=query(collection(db,'sgEvidence'),where('ownerUid','==',user.uid),orderBy('createdAt','desc'),limit(50)),snap=await getDocs(q);root.replaceChildren();renderTrends(snap.docs.map(d=>d.data()));if(snap.empty){root.append(make('p','muted','Aún no tienes evidencias guardadas.'));return;}for(const d of snap.docs)root.append(historyCard(d.data(),d.id));}catch(e){root.replaceChildren(make('p','muted','No se pudo cargar el historial. Revisa el índice compuesto y las reglas.'));notify(errorText(e),true);}}
async function loadAdmin(){if(!user||user.uid!==appConfig?.adminUid){$('admin-section').classList.add('hidden');return;}$('admin-section').classList.remove('hidden');const el=$('admin-list');el.replaceChildren(make('p','muted','Cargando…'));try{const snap=await getDocs(query(collection(db,'sgEvidence'),orderBy('createdAt','desc'),limit(30)));el.replaceChildren();if(snap.empty)el.append(make('p','muted','Sin registros.'));for(const d of snap.docs){const r=d.data();el.append(make('p','meta',`${r.ownerName} · ${r.zone} · ${number(r.db)} ${r.unit} · ${formatDate(recordDate(r))}`));}}catch(e){el.replaceChildren(make('p','muted','No se pudo obtener la lista administrativa.'));}}
function bind(){
  $('start-camera').addEventListener('click',startCamera);$('stop-camera').addEventListener('click',stopCamera);
  $('mic-toggle').addEventListener('click',toggleMic);$('create-evidence').addEventListener('click',captureNow);
  $('reading-type').addEventListener('change',()=>{const mic=$('reading-type').value==='mic';$('mic-area').classList.toggle('hidden',!mic);$('declared-area').classList.toggle('hidden',mic);if(!mic)stopMic();updateHud();});
  $('declared-db').addEventListener('input',updateHud);$('zone').addEventListener('input',updateHud);
  $('known-place').addEventListener('change',()=>{const p=places.find(x=>x.id===$('known-place').value);if(p)$('zone').value=`${p.name}, La Paz`;updateHud();});
  $('get-location').addEventListener('click',requestLocation);$('clear-location').addEventListener('click',()=>{coords=null;$('coords').textContent='Coordenadas borradas. Se guardará solo la zona escrita.';updateHud();});
  $('preview-image').addEventListener('click',()=>openReporter('share'));
  $('preview-image').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openReporter('share');}});
  $('download-image').addEventListener('click',()=>downloadJpg());
  $('open-trial').addEventListener('click',()=>openReporter('share'));
  $('save-cloud').addEventListener('click',()=>openReporter('save'));
  $('reporter-form').addEventListener('submit',submitReporter);
  $('cancel-reporter').addEventListener('click',()=>$('reporter-dialog').close());
  $('print-report').addEventListener('click',printReport);
  $('analyze').addEventListener('click',()=>aiAnalysis());$('ask-ai').addEventListener('click',()=>{const q=$('ai-question').value.trim();if(q.length<3)return notify('Escribe una pregunta breve.',true);aiAnalysis(q);});
  $('refresh-history').addEventListener('click',loadHistory);
  window.addEventListener('message',e=>{if(e.origin===location.origin && e.data?.source==='sonoguard-shell'&&e.data?.action==='pause-media'){stopCamera();stopMic();}});
  window.addEventListener('pagehide',()=>{stopCamera();stopMic();clearPhotoUrl();});
  updateHud();
}
bind();
onAuthStateChanged(auth,async u=>{
  // Comparte sesión de la aplicación original: NO se muestra login adicional.
  user=u;stopMic();stopCamera();rawPhotoCanvas=null;currentRecord=null;currentImageBlob=null;clearPhotoUrl();$('preview-panel').classList.add('hidden');
  $('signin').classList.toggle('hidden',!!user);$('workspace').classList.toggle('hidden',!user);
  if(!user){profile=null;coords=null;return;}
  $('user-tag').textContent=user.email||'Cuenta autenticada';
  try{await Promise.all([loadProfile(),loadPlaces(),loadHistory()]);await loadAdmin();}catch(e){notify('Error al cargar SonoGuard IA: '+errorText(e),true);}
});
