/** SonoGuard IA: cámara EN VIVO, sesión compartida, colecciones aditivas. */
import {firebaseConfig,appConfig} from './firebase-config.js';
import {positiveLabel,positiveValue,positiveUnit} from './audio-display.js';
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,collection,doc,setDoc,getDoc,getDocs,deleteDoc,query,where,orderBy,limit,Timestamp,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {getStorage,ref as storageRef,uploadBytes,getBlob,deleteObject} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js';
import {getFunctions,httpsCallable} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-functions.js';

if(!firebaseConfig?.apiKey||!firebaseConfig?.projectId)throw Error('Firebase no configurado');
const app=getApps().find(a=>a.name==='[DEFAULT]')||initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app),storage=getStorage(app),functions=getFunctions(app,'us-central1');
const viewRoot=document.getElementById('sgIaContainer')||document;
const $=id=>viewRoot.querySelector('#'+(id==='history'&&viewRoot!==document?'sgia-history':id));
const TRIAL='59175830320',OFFICIAL_REFERENCE='67123590'; // solo referencia municipal de 2022, sin confirmar vigencia
let user=null,profile=null,places=[],coords=null,locationWatchId=null,locationError='';
const MAX_GPS_AGE_MS=45000, MAX_GPS_ACCURACY_M=1000;
let cameraStream=null,clockTimer=0,rawPhotoCanvas=null,lastHudRefresh=0,cameraGeneration=0;
let microphone=null,audioContext=null,audioNode=null,analyzer=null,micFrame=0,lastReading=null,lastReadingAt=0;
let currentRecord=null,currentImageBlob=null,currentObjectUrl=null,currentAnalysis=null;
let statusTimer;
function notify(message,error=false){const el=$('status');el.textContent=message;el.classList.toggle('error',error);el.classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>el.classList.remove('visible'),6800);}
function errorText(e){const s=String(e?.code||'');if(s.includes('permission-denied'))return 'Permiso denegado. Verifica reglas y usuario de Firebase.';if(s.includes('storage/'))return 'Revisa la activación de Firebase Storage y sus permisos.';return String(e?.message||'Ocurrió un error.').slice(0,250);}
function busy(btn,val,original){btn.disabled=val;btn.textContent=val?'Procesando…':original;}
function formatDate(date){return new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);}
const number=v=>Number(v).toFixed(1);
const displayRecord=r=>positiveLabel(r.db,r.unit);
const displayMic=()=>lastReading===null?'—':positiveLabel(lastReading,'dBFS');
const recordDate=r=>r?.capturedAt?.toDate?r.capturedAt.toDate():new Date();
function make(type,cls,txt){const a=document.createElement(type);if(cls)a.className=cls;if(txt!==undefined)a.textContent=txt;return a;}
function trialLink(r){const text=`SONOGUARD IA · AVISO CIUDADANO INFORMATIVO (PRUEBA).\nHola, quisiera informar que se percibe un problema de ruido en esta zona y solicitar amablemente que se revise la situación y, si corresponde, se programe una visita de verificación.\nPersona que informa: ${r.ownerName||''}\nPunto donde se realizó el registro: ${r.zone}.\nLectura orientativa del micrófono: ${displayRecord(r)}.\nFecha y hora (Bolivia): ${formatDate(recordDate(r))}.\nUbicación en Google Maps: ${r.lat!==null&&r.lng!==null?googleMapsUrl(r.lat,r.lng):'no disponible'}.\nPrecisión GPS reportada: ±${r.gpsAccuracyM??'?'} m.\nLa fotografía se adjunta manualmente. No se atribuye el ruido a una persona o establecimiento.\nEste mensaje se dirige a un número de PRUEBA: no se envía a una autoridad ni garantiza una visita.`;return `https://wa.me/${TRIAL}?text=${encodeURIComponent(text)}`;}

async function loadProfile(){const snap=await getDoc(doc(db,'sgProfiles',user.uid));profile=snap.exists()?snap.data():null;}
async function loadPlaces(){
  try{
    const snap=await getDocs(query(collection(db,'places'),limit(250)));
    places=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>typeof p.name==='string'&&Number.isFinite(p.lat)&&Number.isFinite(p.lng));
    updateHud();
  }catch(e){notify('No se pudieron consultar los lugares existentes: '+errorText(e),true);}
}
function distanceMeters(a,b){
  const r=6371000,rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lng-a.lng)*rad;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
  return 2*r*Math.asin(Math.min(1,Math.sqrt(h)));
}
function nearestRegisteredPlace(point){
  if(!point)return null;
  const candidates=places.map(p=>({place:p,d:distanceMeters(point,p)}))
    .filter(x=>x.d<=Math.min(5000,Math.max(10,Number(x.place.radius)||100)));
  return candidates.sort((a,b)=>a.d-b.d)[0]?.place||null;
}
function zoneForGps(point){
  if(!point)return 'Ubicación no disponible';
  const nearby=nearestRegisteredPlace(point);
  return nearby?`Cerca de ${nearby.name} (GPS aprox.)`:`Punto GPS ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}
function googleMapsUrl(lat,lng){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;}
function gpsValid(){return coords!==null&&Number.isFinite(coords.accuracyM)&&coords.accuracyM<=MAX_GPS_ACCURACY_M&&Date.now()-coords.observedAt<MAX_GPS_AGE_MS;}
function readingValid(){return lastReading!==null&&Date.now()-lastReadingAt<2500;}
function refreshCaptureButton(){
  const btn=$('create-evidence'),ready=Boolean(cameraStream&&$('camera-video').readyState>=2&&readingValid()&&gpsValid());
  btn.disabled=!ready;
  btn.title=ready?'Capturar con micrófono y GPS actuales':'Se necesita cámara, lectura reciente del micrófono y GPS reciente (precisión hasta 1 km).';
}
function updateHud(){
  $('hud-time').textContent=formatDate(new Date()).split(',').at(-1)?.trim()||formatDate(new Date());
  $('hud-db').textContent=displayMic();
  $('hud-source').textContent=readingValid()?'Índice relativo de micrófono (no dB SPL)':'Esperando lectura digital del micrófono';
  $('hud-place').textContent=gpsValid()?`Lugar: ${zoneForGps(coords)}`:'Lugar: esperando GPS…';
  $('gps-status').textContent=gpsValid()?`${zoneForGps(coords)} · precisión reportada ±${coords.accuracyM} m`:
    coords?`GPS poco preciso o desactualizado (±${coords.accuracyM} m). Esperando posición reciente…`:
    (locationError||'Esperando autorización y posición GPS del dispositivo…');
  const link=$('maps-link');if(coords){link.href=googleMapsUrl(coords.lat,coords.lng);link.hidden=false;}else{link.removeAttribute('href');link.hidden=true;}
  $('mic-status').textContent=readingValid()?'Lectura automática desde el micrófono del dispositivo.':
    microphone?'Esperando audio del micrófono…':'Micrófono no iniciado o permiso pendiente.';
  refreshCaptureButton();
}
async function startCamera(){
  if(cameraStream){startGps();await startMic();updateHud();return;}
  const generation=++cameraGeneration;
  const btn=$('start-camera');busy(btn,true,'📷 Abrir cámara y sensores');
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('La cámara requiere HTTPS y un navegador compatible.');
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    if(generation!==cameraGeneration){stream.getTracks().forEach(t=>t.stop());return;}
    cameraStream=stream;const video=$('camera-video');video.srcObject=cameraStream;await video.play();
    if(generation!==cameraGeneration)return;
    $('camera-empty').classList.add('hidden');$('stop-camera').disabled=false;
    startGps();await startMic(generation);
    if(generation!==cameraGeneration)return;
    updateHud();clockTimer=setInterval(updateHud,1000);
    notify('Cámara activada. El micrófono y el GPS se obtienen automáticamente; espera que ambos estén listos para capturar.');
  }catch(e){stopCamera();notify('No se pudo abrir la cámara: '+errorText(e),true);}finally{busy(btn,false,'📷 Abrir cámara y sensores');}
}
function stopGps(){
  if(locationWatchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(locationWatchId);
  locationWatchId=null;coords=null;locationError='';updateHud();
}
function stopCamera(){
  cameraGeneration++;
  if(clockTimer)clearInterval(clockTimer);clockTimer=0;
  if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;
  const video=$('camera-video');video.pause();video.srcObject=null;
  $('camera-empty').classList.remove('hidden');$('stop-camera').disabled=true;$('create-evidence').disabled=true;
  stopMic();stopGps();
}
function stopMic(){
  if(micFrame)cancelAnimationFrame(micFrame);micFrame=0;
  if(microphone)microphone.getTracks().forEach(t=>t.stop());microphone=null;
  try{audioNode?.disconnect();}catch{}audioNode=null;
  if(audioContext)audioContext.close().catch(()=>{});audioContext=null;analyzer=null;
  lastReading=null;lastReadingAt=0;$('live-db').textContent='—';updateHud();
}
async function startMic(generation=cameraGeneration){
  if(microphone)return;
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Se necesita HTTPS o localhost para el micrófono.');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    if(generation!==cameraGeneration){stream.getTracks().forEach(t=>t.stop());return;}
    microphone=stream;
    audioContext=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
    audioNode=audioContext.createMediaStreamSource(microphone);analyzer=audioContext.createAnalyser();analyzer.fftSize=4096;audioNode.connect(analyzer);
    const samples=new Float32Array(analyzer.fftSize);
    const tick=()=>{
      if(!analyzer)return;
      analyzer.getFloatTimeDomainData(samples);let energy=0;
      for(const x of samples)energy+=x*x;
      const rms=Math.sqrt(energy/samples.length);
      lastReading=Math.round(Math.max(-120,Math.min(0,20*Math.log10(Math.max(rms,1e-6))))*10)/10;
      lastReadingAt=Date.now();$('live-db').textContent=number(positiveValue(lastReading,'dBFS'));
      if(Date.now()-lastHudRefresh>=200){updateHud();lastHudRefresh=Date.now();}micFrame=requestAnimationFrame(tick);
    };tick();
  }catch(e){stopMic();notify('No se pudo usar el micrófono: '+errorText(e),true);}
}
function startGps(){
  if(locationWatchId!==null)return;
  if(!navigator.geolocation){locationError='Este navegador no ofrece geolocalización.';updateHud();return;}
  locationError='Buscando ubicación del dispositivo…';updateHud();
  locationWatchId=navigator.geolocation.watchPosition(p=>{
    if(!cameraStream)return;
    const accuracyM=Math.round(p.coords.accuracy);
    if(!Number.isFinite(p.coords.latitude)||!Number.isFinite(p.coords.longitude)||!Number.isFinite(accuracyM)){locationError='El dispositivo no entregó coordenadas válidas.';updateHud();return;}
    coords={lat:Math.round(p.coords.latitude*1e4)/1e4,lng:Math.round(p.coords.longitude*1e4)/1e4,accuracyM,observedAt:p.timestamp||Date.now()};
    locationError='';updateHud();
  },e=>{
    if(!cameraStream)return;
    if(locationWatchId!==null)navigator.geolocation.clearWatch(locationWatchId);locationWatchId=null;
    locationError=e.code===1?'Permiso de ubicación denegado. Actívalo en los ajustes del navegador.':
      e.code===2?'No se pudo determinar el GPS. Revisa la ubicación del dispositivo.':'La ubicación está tardando. Reintentando…';
    coords=null;updateHud();notify(locationError,true);
  },{enableHighAccuracy:true,timeout:20000,maximumAge:0});
}
function measure(){
  if(!readingValid())throw Error('No hay una lectura reciente del micrófono. Activa sus permisos y espera el valor en vivo.');
  return {db:lastReading,unit:'dBFS',source:'microfono'};
}
function wrapLines(ctx,text,maxWidth,maxLines=3){
  const parts=String(text||'').split(/\s+/),out=[];let line='';for(const part of parts){const next=line?`${line} ${part}`:part;if(ctx.measureText(next).width>maxWidth&&line){out.push(line);line=part;}else line=next;}if(line)out.push(line);return out.slice(0,maxLines);
}
function composePhoto(r,sourceCanvas=rawPhotoCanvas){
  if(!sourceCanvas)throw Error('No existe la foto original de esta sesión.');
  const width=Math.min(1500,Math.max(900,sourceCanvas.width));const imageHeight=Math.round(sourceCanvas.height*width/sourceCanvas.width);
  const footerHeight=430;const canvas=document.createElement('canvas');canvas.width=width;canvas.height=imageHeight+footerHeight;
  const c=canvas.getContext('2d');if(!c)throw Error('No se pudo crear la imagen.');c.fillStyle='#0b2433';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(sourceCanvas,0,0,width,imageHeight);
  c.fillStyle='rgba(7,26,40,.94)';c.fillRect(0,imageHeight,width,footerHeight);
  const left=35,available=width-70;
  c.fillStyle='#72f2d7';c.font='bold 32px system-ui';c.fillText('SONOGUARD IA · REPORTE INFORMATIVO',left,imageHeight+50);
  c.fillStyle='#fff';c.font='bold 56px system-ui';c.fillText(`${displayRecord(r)}`,left,imageHeight+118);
  c.font='26px system-ui';let y=imageHeight+165;
  for(const line of [`Fecha y hora (Bolivia): ${formatDate(recordDate(r))}`,`Lugar GPS: ${r.zone}`,`Persona que informa: ${r.ownerName||'No proporcionado'}`]){
    for(const segment of wrapLines(c,line,available,2)){c.fillText(segment,left,y);y+=32;}y+=2;
  }
  if(r.lat!==null&&r.lng!==null){c.font='22px system-ui';c.fillText(`GPS aprox.: ${r.lat}, ${r.lng} · precisión ±${r.gpsAccuracyM??'?'} m`,left,Math.min(y+4,imageHeight+330));}
  c.font='19px system-ui';c.fillStyle='#d9e4eb';c.fillText(`Contacto de PRUEBA: 75830320 · Referencia municipal 2022: ${OFFICIAL_REFERENCE} (sin confirmar)`,left,imageHeight+370);
  c.fillStyle='#ffd39d';c.font='bold 18px system-ui';c.fillText('REGISTRO INFORMATIVO DE PRUEBA · NO ES MEDICIÓN CERTIFICADA',left,imageHeight+406);
  return canvas;
}
function canvasJpeg(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo codificar la imagen.')),'image/jpeg',.83));}
function clearPhotoUrl(){if(currentObjectUrl)URL.revokeObjectURL(currentObjectUrl);currentObjectUrl=null;}
function showPreview(record,blob,{fromHistory=false}={}){
  currentRecord=record;currentImageBlob=blob;currentAnalysis=null;clearPhotoUrl();currentObjectUrl=URL.createObjectURL(blob);
  $('preview-image').src=currentObjectUrl;$('preview-panel').classList.remove('hidden');$('analysis-result').classList.add('hidden');$('ai-question').value='';
  if(fromHistory)rawPhotoCanvas=null;
  $('preview-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
async function captureNow(){
  if(!user)return;
  const btn=$('create-evidence');if(btn.disabled)return;
  busy(btn,true,'📸 Tomar foto ahora');
  try{
    const video=$('camera-video');if(!cameraStream||video.readyState<2||!video.videoWidth)throw Error('Primero abre la cámara y espera la imagen en vivo.');
    if(!gpsValid())throw Error('Aún no hay ubicación GPS reciente y suficientemente precisa. Activa la ubicación del dispositivo.');
    const reading=measure(),point={...coords};const now=Timestamp.now();
    const zone=zoneForGps(point),near=nearestRegisteredPlace(point);
    const width=Math.min(1600,video.videoWidth),height=Math.round(video.videoHeight*width/video.videoWidth);
    rawPhotoCanvas=document.createElement('canvas');rawPhotoCanvas.width=width;rawPhotoCanvas.height=height;
    rawPhotoCanvas.getContext('2d').drawImage(video,0,0,width,height);
    // La ubicación y la lectura salen de APIs del dispositivo, no de formularios.
    const record={ownerUid:user.uid,ownerName:'',nameMode:'full',db:reading.db,unit:reading.unit,source:reading.source,
      zone,placeName:near?.name||'',reportedSource:'',lat:point.lat,lng:point.lng,gpsAccuracyM:point.accuracyM,capturedAt:now};
    const blob=await canvasJpeg(composePhoto(record));showPreview(record,blob);
    downloadJpg(blob);
    $('auto-save-state').textContent='JPG generado. Guardando fotografía con lectura y GPS en historial privado…';
    notify('Foto tomada con micrófono y GPS automáticos. Guardando fotografía en tu historial privado de Firebase…');
    try{
      await persistEvidence(record,blob);
      $('auto-save-state').textContent='✓ JPG descargado y copia privada guardada en Firebase. Puedes borrarla desde Historial.';
    }catch(e){
      $('auto-save-state').textContent='Se generó el JPG, pero no se guardó en Firebase. Puedes descargarlo nuevamente.';
      notify('La foto está tomada, pero el guardado en Firebase falló: '+errorText(e),true);
    }
  }catch(e){notify(errorText(e),true);}
  finally{busy(btn,false,'📸 Tomar foto ahora');refreshCaptureButton();}
}
function downloadJpg(blob=currentImageBlob){if(!blob)return;const url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download=`SonoGuard-evidencia-${Date.now()}.jpg`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function downloadDataUrl(dataUrl){const a=make('a');a.href=dataUrl;a.download=`SonoGuard-evidencia-con-nombre-${Date.now()}.jpg`;document.body.append(a);a.click();a.remove();}
function openReporter(){
  if(!currentRecord)return notify('Primero toma una foto o selecciona una evidencia.',true);
  $('reporter-name').value=profile?.fullName||currentRecord.ownerName||'';
  $('reporter-consent').checked=false;
  $('reporter-dialog').showModal();
}
async function persistEvidence(r,blob){
  if(r.id)return;
  const id=doc(collection(db,'sgEvidence')).id,path=`sgEvidence/${user.uid}/${id}.jpg`;
  // La captura se guarda sin nombre; solo la copia compartida por WhatsApp lo incorpora.
  const record={...r,ownerUid:user.uid,ownerName:'',createdAt:serverTimestamp(),photoPath:path};
  const image=storageRef(storage,path);await uploadBytes(image,blob,{contentType:'image/jpeg'});
  try{await setDoc(doc(db,'sgEvidence',id),record);}catch(e){await deleteObject(image).catch(()=>{});throw e;}
  currentRecord={...r,id,photoPath:path};await loadHistory();
  notify('Fotografía guardada automáticamente en tu historial privado.');
}
async function sharedImage(record){
  if(rawPhotoCanvas)return canvasJpeg(composePhoto(record));
  if(!currentImageBlob)throw Error('No se encuentra la fotografía.');
  // Las imágenes guardadas contienen una franja de 430 px añadida por composePhoto.
  // Recrear la imagen desde su área fotográfica evita duplicar metadatos.
  const bitmap=await createImageBitmap(currentImageBlob);
  try{
    if(bitmap.height<=430)throw Error('La imagen guardada no contiene el formato esperado.');
    const base=document.createElement('canvas');base.width=bitmap.width;base.height=bitmap.height-430;
    base.getContext('2d').drawImage(bitmap,0,0,bitmap.width,base.height,0,0,base.width,base.height);
    return canvasJpeg(composePhoto(record,base));
  }finally{bitmap.close?.();}
}
async function submitReporter(e){
  e.preventDefault();if(!currentRecord||!user)return;
  const name=$('reporter-name').value.trim().replace(/\s+/g,' ');
  if(name.length<5||name.length>100||name.split(' ').length<2)return notify('Escribe nombre y apellido completos.',true);
  if(!$('reporter-consent').checked)return notify('Confirma el uso de tu nombre en la imagen que compartirás.',true);
  const record={...currentRecord,ownerName:name,nameMode:'full'};
  // Abrir de forma inmediata desde el evento del usuario para evitar bloqueos de ventanas.
  const whatsAppWindow=window.open('about:blank','_blank');
  $('reporter-dialog').close();
  const btn=$('confirm-reporter');busy(btn,true,'Preparar aviso y abrir WhatsApp');
  try{
    const blob=await sharedImage(record);
    downloadJpg(blob);
    if(whatsAppWindow)whatsAppWindow.location.replace(trialLink(record));
    else {const link=make('a');link.href=trialLink(record);link.target='_blank';link.rel='noopener noreferrer';document.body.append(link);link.click();link.remove();}
    notify('Aviso informativo preparado. Foto con tu nombre descargada y WhatsApp de PRUEBA abierto: adjunta la imagen, revisa el texto y decide si deseas enviarlo.');
  }catch(err){whatsAppWindow?.close();notify('No se pudo preparar la imagen: '+errorText(err),true);}
  finally{busy(btn,false,'Preparar aviso y abrir WhatsApp');}
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
  const reader=new FileReader();reader.onload=()=>{popup.document.open();popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte SonoGuard</title><style>body{font:16px system-ui;color:#142632;max-width:880px;margin:auto;padding:25px}img{width:100%;object-fit:contain}.warn{border:1px solid #777;padding:15px}button{padding:12px}@media print{button{display:none}}</style></head><body><h1>SonoGuard IA · Evidencia de prueba</h1><img alt="Fotografía de medición" src="${reader.result}"><p><b>Nombre:</b> ${escape(r.ownerName||'No declarado')}<br><b>Lectura:</b> ${escape(displayRecord(r))}<br><b>Lugar:</b> ${escape(r.zone)}<br><b>Fecha y hora:</b> ${escape(formatDate(recordDate(r)))}</p>${currentAnalysis?`<p>${escape(currentAnalysis)}</p>`:''}<p class="warn">Registro ciudadano informativo de prueba. Medición no certificada. No activa visitas ni trámites oficiales. Contacto de prueba 75830320; referencia municipal publicada en 2022 ${OFFICIAL_REFERENCE} (vigencia sin confirmar).</p><button onclick="window.print()">Imprimir / Guardar PDF</button></body></html>`);popup.document.close();};reader.readAsDataURL(currentImageBlob);
}
function historyCard(data,id){
  const card=make('article','history-card');card.append(make('h3','',`${number(data.db)} ${data.unit}`));
  card.append(make('p','meta',`${formatDate(recordDate(data))} · ${data.zone}`));card.append(make('p','meta',`Persona que informa: ${data.ownerName||'se solicita al compartir'}`));
  const image=make('img');image.alt='Foto privada de evidencia';image.loading='lazy';card.insertBefore(image,card.firstChild);
  getBlob(storageRef(storage,data.photoPath)).then(blob=>{const url=URL.createObjectURL(blob);image.src=url;image.addEventListener('load',()=>setTimeout(()=>URL.revokeObjectURL(url),20000),{once:true});}).catch(()=>{image.alt='Foto no disponible';});
  const row=make('div','buttons'),see=make('button','secondary','Ver evidencia'),del=make('button','ghost','Eliminar');
  const view=async()=>{see.disabled=true;try{showPreview({...data,id},await getBlob(storageRef(storage,data.photoPath)),{fromHistory:true});}catch(e){notify(errorText(e),true);}finally{see.disabled=false;}};
  see.addEventListener('click',view);image.addEventListener('click',view);
  del.addEventListener('click',async()=>{if(!confirm('¿Eliminar esta evidencia y su foto? No afecta hospitales ni lugares.'))return;del.disabled=true;try{await deleteObject(storageRef(storage,data.photoPath));await deleteDoc(doc(db,'sgEvidence',id));if(currentRecord?.id===id){$('preview-panel').classList.add('hidden');currentRecord=null;currentImageBlob=null;rawPhotoCanvas=null;clearPhotoUrl();}await loadHistory();notify('Evidencia eliminada.');}catch(e){notify('No se pudo eliminar: '+errorText(e),true);}finally{del.disabled=false;}});
  row.append(see,del);card.append(row);return card;
}
function renderTrends(records){const dest=$('trends');dest.replaceChildren();for(const unit of ['dBFS','dB SPL']){const set=records.filter(r=>r.unit===unit&&Number.isFinite(r.db));const panel=make('div','trend-panel');panel.append(make('h3','',positiveUnit(unit)));if(!set.length){panel.append(make('p','muted small','Sin registros de esta escala.'));dest.append(panel);continue;}const nums=set.map(r=>positiveValue(r.db,r.unit)),median=[...nums].sort((a,b)=>a-b)[Math.floor(nums.length/2)],avg=nums.reduce((a,b)=>a+b,0)/nums.length;panel.append(make('p','trend-stats',`${nums.length} mediciones · Promedio ${avg.toFixed(1)} · Mediana ${median.toFixed(1)} ${positiveUnit(unit)}`));for(const r of set.slice(0,10).reverse()){const row=make('div','trend-row'),bar=make('div','bar');bar.style.width=`${Math.max(2,(positiveValue(r.db,r.unit)/(unit==='dBFS'?100:160))*100)}%`;row.append(make('span','meta',formatDate(recordDate(r)).slice(0,10)),bar,make('span','meta',number(positiveValue(r.db,r.unit))));panel.append(row);}panel.append(make('p','trend-warning','Resumen descriptivo: no determina infracciones ni permite comparar equipos no calibrados.'));dest.append(panel);}}
async function loadHistory(){if(!user)return;const root=$('history');root.replaceChildren(make('p','muted','Cargando…'));try{const q=query(collection(db,'sgEvidence'),where('ownerUid','==',user.uid),orderBy('createdAt','desc'),limit(50)),snap=await getDocs(q);root.replaceChildren();renderTrends(snap.docs.map(d=>d.data()));if(snap.empty){root.append(make('p','muted','Aún no tienes evidencias guardadas.'));return;}for(const d of snap.docs)root.append(historyCard(d.data(),d.id));}catch(e){root.replaceChildren(make('p','muted','No se pudo cargar el historial. Revisa el índice compuesto y las reglas.'));notify(errorText(e),true);}}
async function loadAdmin(){if(!user||user.uid!==appConfig?.adminUid){$('admin-section').classList.add('hidden');return;}$('admin-section').classList.remove('hidden');const el=$('admin-list');el.replaceChildren(make('p','muted','Cargando…'));try{const snap=await getDocs(query(collection(db,'sgEvidence'),orderBy('createdAt','desc'),limit(30)));el.replaceChildren();if(snap.empty)el.append(make('p','muted','Sin registros.'));for(const d of snap.docs){const r=d.data();el.append(make('p','meta',`${r.ownerName||'No declarado'} · ${r.zone} · ${displayRecord(r)} · ${formatDate(recordDate(r))}`));}}catch(e){el.replaceChildren(make('p','muted','No se pudo obtener la lista administrativa.'));}}
function bind(){
  $('start-camera').addEventListener('click',startCamera);$('stop-camera').addEventListener('click',stopCamera);
  $('retry-sensors').addEventListener('click',async()=>{if(!cameraStream)return notify('Abre la cámara antes de reintentar sensores.',true);startGps();await startMic();updateHud();notify('Reintentando GPS y micrófono; revisa los permisos del navegador si siguen pendientes.');});
  $('create-evidence').addEventListener('click',captureNow);
  $('preview-image').addEventListener('click',openReporter);
  $('preview-image').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openReporter();}});
  $('download-image').addEventListener('click',()=>downloadJpg());
  $('open-trial').addEventListener('click',openReporter);
  $('reporter-form').addEventListener('submit',submitReporter);
  $('cancel-reporter').addEventListener('click',()=>$('reporter-dialog').close());
  $('print-report').addEventListener('click',printReport);
  $('analyze').addEventListener('click',()=>aiAnalysis());$('ask-ai').addEventListener('click',()=>{const q=$('ai-question').value.trim();if(q.length<3)return notify('Escribe una pregunta breve.',true);aiAnalysis(q);});
  $('refresh-history').addEventListener('click',loadHistory);
  window.addEventListener('sgia:pause-media',stopCamera);
  window.addEventListener('pagehide',()=>{stopCamera();clearPhotoUrl();});
  updateHud();
}
bind();
onAuthStateChanged(auth,async u=>{
  // Comparte sesión de la aplicación original: NO se muestra login adicional.
  user=u;stopCamera();rawPhotoCanvas=null;currentRecord=null;currentImageBlob=null;clearPhotoUrl();$('preview-panel').classList.add('hidden');
  $('signin').classList.toggle('hidden',!!user);$('workspace').classList.toggle('hidden',!user);
  if(!user){profile=null;coords=null;return;}
  $('user-tag').textContent=user.email||'Cuenta autenticada';
  try{await Promise.all([loadProfile(),loadPlaces(),loadHistory()]);await loadAdmin();}catch(e){notify('Error al cargar SonoGuard IA: '+errorText(e),true);}
});
