import {tr,getLanguage} from './sonoguard-i18n.js';
/** SonoGuard IA: cámara EN VIVO, sesión compartida, colecciones aditivas. */
import {firebaseConfig,appConfig} from './firebase-config.js';
import {positiveLabel,positiveValue,positiveUnit} from './audio-display.js';
import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,collection,doc,setDoc,getDoc,getDocs,deleteDoc,query,where,orderBy,limit,Timestamp,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {consultarSonoGuardIA} from './sonoguard-ai-client.js';

if(!firebaseConfig?.apiKey||!firebaseConfig?.projectId)throw Error('Firebase no configurado');
const app=getApps().find(a=>a.name==='[DEFAULT]')||initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app);
const viewRoot=document.getElementById('sgIaContainer')||document;
const $=id=>viewRoot.querySelector('#'+(id==='history'&&viewRoot!==document?'sgia-history':id));
const TRIAL='59175830320',OFFICIAL_REFERENCE='67123590'; // solo referencia municipal de 2022, sin confirmar vigencia
let user=null,profile=null,places=[],coords=null,locationWatchId=null,locationError='',gpsInitialRequest=0;
// Ubicación de navegador: puede venir de GPS, Wi-Fi u otra fuente del sistema.
const MAX_GPS_AGE_MS=300000, MAX_GPS_ACCURACY_M=20000;
let cameraStream=null,clockTimer=0,rawPhotoCanvas=null,lastHudRefresh=0,cameraGeneration=0;
let microphone=null,audioContext=null,audioNode=null,analyzer=null,micFrame=0,lastReading=null,lastReadingAt=0;
let currentRecord=null,currentImageBlob=null,currentObjectUrl=null,currentAnalysis=null;
let statusTimer;
function notify(message,error=false){const el=$('status');el.textContent=message;el.classList.toggle('error',error);el.classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>el.classList.remove('visible'),6800);}
function errorText(e){const s=String(e?.code||'');if(s.includes('permission-denied'))return 'Acceso denegado en Firestore. Publica firestore.rules del ZIP en el proyecto correcto y entra con tu cuenta.';if(s.includes('failed-precondition'))return 'Firestore no tiene el índice requerido para esta consulta. Prueba actualizar la página o revisar las reglas.';if(s.includes('unavailable'))return 'Sin conexión con Firebase. Revisa Internet e inténtalo nuevamente.';return String(e?.message||'Ocurrió un error.').slice(0,250);}
function busy(btn,val,original){btn.disabled=val;btn.textContent=val?'Procesando…':original;}
function formatDate(date){return new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);}
const number=v=>Number(v).toFixed(1);
const displayRecord=r=>Number.isFinite(r?.db)?positiveLabel(r.db,r.unit):'Sin lectura de micrófono';
const displayMic=()=>lastReading===null?'—':positiveLabel(lastReading,'dBFS');
const recordDate=r=>r?.capturedAt?.toDate?r.capturedAt.toDate():new Date();
function make(type,cls,txt){const a=document.createElement(type);if(cls)a.className=cls;if(txt!==undefined)a.textContent=txt;return a;}
function trialLink(r){if(getLanguage()==='en'){const text=`SONOGUARD AI · COMMUNITY INFORMATION REPORT (TEST).\nHello, I would like to report a noise problem in this area and kindly request a review of the situation and, if appropriate, a site visit.\nPerson reporting: ${r.ownerName||''}\nRecording location: ${r.zone}.\nIndicative microphone reading: ${displayRecord(r)}.\nDate and time (Bolivia): ${formatDate(recordDate(r))}.\nGoogle Maps: ${r.lat!==null&&r.lng!==null?googleMapsUrl(r.lat,r.lng):'unavailable'}.\nReported GPS accuracy: ±${r.gpsAccuracyM??'?'} m.\nThe downloaded photo must be attached manually. No person or business is blamed.\nThis message goes to a TEST number, not a public authority, and does not guarantee a visit.`;return `https://wa.me/${TRIAL}?text=${encodeURIComponent(text)}`;}const text=`SONOGUARD IA · AVISO CIUDADANO INFORMATIVO (PRUEBA).\nHola, quisiera informar que se percibe un problema de ruido en esta zona y solicitar amablemente que se revise la situación y, si corresponde, se programe una visita de verificación.\nPersona que informa: ${r.ownerName||''}\nPunto donde se realizó el registro: ${r.zone}.\nLectura orientativa del micrófono: ${displayRecord(r)}.\nFecha y hora (Bolivia): ${formatDate(recordDate(r))}.\nUbicación en Google Maps: ${r.lat!==null&&r.lng!==null?googleMapsUrl(r.lat,r.lng):'no disponible'}.\nPrecisión GPS reportada: ±${r.gpsAccuracyM??'?'} m.\nLa fotografía se adjunta manualmente. No se atribuye el ruido a una persona o establecimiento.\nEste mensaje se dirige a un número de PRUEBA: no se envía a una autoridad ni garantiza una visita.`;return `https://wa.me/${TRIAL}?text=${encodeURIComponent(text)}`;}

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
  const btn=$('create-evidence'),cameraReady=Boolean(cameraStream&&$('camera-video').readyState>=2&&$('camera-video').videoWidth);
  const ready=cameraReady;
  btn.disabled=!ready;
  btn.title=!cameraReady?'Primero abre la cámara y espera la imagen en vivo.':
    !readingValid()?'Capturar sin valor de ruido: el micrófono no está disponible. No se inventarán dB.':
    gpsValid()?'Capturar con lectura de micrófono y ubicación.':'Capturar con lectura de micrófono; ubicación no disponible.';
}
function updateHud(){
  $('hud-time').textContent=formatDate(new Date()).split(',').at(-1)?.trim()||formatDate(new Date());
  $('hud-db').textContent=displayMic();
  $('hud-source').textContent=readingValid()?'Índice relativo de micrófono (no dB SPL)':'Esperando lectura digital del micrófono';
  $('hud-place').textContent=gpsValid()?`Lugar: ${zoneForGps(coords)}`:'Lugar: ubicación no disponible (se puede fotografiar)';
  $('gps-status').textContent=gpsValid()?`${zoneForGps(coords)} · precisión reportada ±${coords.accuracyM} m`:
    coords?`Ubicación del navegador poco precisa o antigua (±${coords.accuracyM} m). Puedes tomar la foto sin ubicación.`:
    (locationError||'Buscando ubicación del navegador. La cámara puede funcionar sin GPS.');
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
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Abre SonoGuard por HTTPS, concede permiso de cámara y usa un navegador compatible.');
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    if(generation!==cameraGeneration){stream.getTracks().forEach(t=>t.stop());return;}
    cameraStream=stream;const video=$('camera-video');video.srcObject=cameraStream;await video.play();
    if(generation!==cameraGeneration)return;
    $('camera-empty').classList.add('hidden');$('stop-camera').disabled=false;
    startGps();await startMic(generation);
    if(generation!==cameraGeneration)return;
    updateHud();clockTimer=setInterval(updateHud,1000);
    notify('Cámara activada. Puedes fotografiar ya; las lecturas y la ubicación que estén disponibles se incluirán automáticamente.');
  }catch(e){stopCamera();notify('No se pudo abrir la cámara: '+errorText(e),true);}finally{busy(btn,false,'📷 Abrir cámara y sensores');}
}
function stopGps(){
  if(locationWatchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(locationWatchId);
  locationWatchId=null;gpsInitialRequest++;coords=null;locationError='';updateHud();
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
function acceptLocation(position){
  if(!cameraStream)return;
  const p=position?.coords, accuracyM=Math.round(p?.accuracy);
  if(!Number.isFinite(p?.latitude)||!Number.isFinite(p?.longitude)||!Number.isFinite(accuracyM)){
    locationError='El dispositivo no proporcionó una posición válida.';updateHud();return;
  }
  const observedAt=position.timestamp||Date.now();
  // La posición más reciente se muestra incluso cuando es demasiado imprecisa para guardarla.
  coords={lat:Math.round(p.latitude*1e5)/1e5,lng:Math.round(p.longitude*1e5)/1e5,
    accuracyM,observedAt};
  locationError='';updateHud();
}
function gpsErrorMessage(e){
  if(e?.code===1)return 'Ubicación bloqueada: permite el acceso en el icono del sitio del navegador y activa la ubicación en Windows/Android/iOS.';
  if(e?.code===2)return 'No se pudo localizar el dispositivo. Activa ubicación del sistema o prueba desde un celular con GPS.';
  return 'No llegó la ubicación a tiempo. Prueba «Reintentar sensores». La foto funciona sin coordenadas.';
}
function startGps(force=false){
  if(!cameraStream)return;
  if(!navigator.geolocation){locationError='Este navegador no permite conocer la ubicación. Puedes fotografiar sin coordenadas.';updateHud();return;}
  if(force)stopGps();
  if(locationWatchId!==null)return;
  locationError='Buscando ubicación del dispositivo…';updateHud();
  const myRequest=++gpsInitialRequest;
  // Primer intento rápido con cualquier método del navegador (GPS, Wi-Fi o red).
  try{locationWatchId=navigator.geolocation.watchPosition(acceptLocation,e=>{
    if(!cameraStream||myRequest!==gpsInitialRequest)return;
    locationError=gpsErrorMessage(e);updateHud();
    // No bloquear la cámara; se conserva un GPS válido previo si lo hay.
    if(e.code===1){navigator.geolocation.clearWatch(locationWatchId);locationWatchId=null;}
  },{enableHighAccuracy:false,timeout:25000,maximumAge:30000});}
  catch(e){locationError='El navegador impide obtener la ubicación. La foto aún funciona.';updateHud();}
  // Segundo intento de mayor precisión. No provoca bloqueo cuando falla.
  try{navigator.geolocation.getCurrentPosition(acceptLocation,e=>{
    if(!cameraStream||myRequest!==gpsInitialRequest)return;
    if(!coords){locationError=gpsErrorMessage(e);updateHud();}
  },{enableHighAccuracy:true,timeout:15000,maximumAge:30000});}
  catch(e){if(!coords){locationError='Ubicación no disponible; puedes tomar la foto.';updateHud();}}
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
  c.fillStyle='#72f2d7';c.font='bold 32px system-ui';c.fillText(tr('SONOGUARD IA · REPORTE INFORMATIVO'),left,imageHeight+50);
  c.fillStyle='#fff';c.font='bold 56px system-ui';c.fillText(`${displayRecord(r)}`,left,imageHeight+118);
  c.font='26px system-ui';let y=imageHeight+165;
  for(const line of [tr(`Fecha y hora (Bolivia): ${formatDate(recordDate(r))}`),tr(`Lugar GPS: ${r.zone}`),tr(`Persona que informa: ${r.ownerName||'No proporcionado'}`)]){
    for(const segment of wrapLines(c,line,available,2)){c.fillText(segment,left,y);y+=32;}y+=2;
  }
  if(r.lat!==null&&r.lng!==null){c.font='22px system-ui';c.fillText(tr(`GPS aprox.: ${r.lat}, ${r.lng} · precisión ±${r.gpsAccuracyM??'?'} m`),left,Math.min(y+4,imageHeight+330));}
  c.font='19px system-ui';c.fillStyle='#d9e4eb';c.fillText(tr(`Contacto de PRUEBA: 75830320 · Referencia municipal 2022: ${OFFICIAL_REFERENCE} (sin confirmar)`),left,imageHeight+370);
  c.fillStyle='#ffd39d';c.font='bold 18px system-ui';c.fillText(tr('REGISTRO INFORMATIVO DE PRUEBA · NO ES MEDICIÓN CERTIFICADA'),left,imageHeight+406);
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
    const reading=readingValid()?measure():{db:null,unit:'sin lectura',source:'sin_mic'},point=gpsValid()?{...coords}:null;const now=Timestamp.now();
    const zone=point?zoneForGps(point):'Ubicación no disponible',near=point?nearestRegisteredPlace(point):null;
    const width=Math.min(1600,video.videoWidth),height=Math.round(video.videoHeight*width/video.videoWidth);
    rawPhotoCanvas=document.createElement('canvas');rawPhotoCanvas.width=width;rawPhotoCanvas.height=height;
    rawPhotoCanvas.getContext('2d').drawImage(video,0,0,width,height);
    // La ubicación y la lectura salen de APIs del dispositivo, no de formularios.
    const record={ownerUid:user.uid,ownerName:'',nameMode:'full',db:reading.db,unit:reading.unit,source:reading.source,
      zone,placeName:near?.name||'',reportedSource:'',lat:point?.lat??null,lng:point?.lng??null,gpsAccuracyM:point?.accuracyM??null,capturedAt:now};
    const blob=await canvasJpeg(composePhoto(record));showPreview(record,blob);
    downloadJpg(blob);
    $('auto-save-state').textContent='Descargando foto al dispositivo… Guardando únicamente fecha, ubicación y lectura en Firestore (sin imagen)…';
    notify('Foto tomada y preparada para descargar. Solo se guardarán los datos en Firebase.');
    try{
      await persistEvidence(record);
      $('auto-save-state').textContent='✓ Foto descargada. Solo datos guardados en Firestore; NO se subió ninguna imagen.';
      if(!point||reading.db===null)notify('Registro guardado: los sensores no disponibles quedaron indicados, sin datos inventados.');
    }catch(e){
      $('auto-save-state').textContent='Foto lista para descargar, pero el registro de datos no se guardó en Firestore. Usa «Descargar foto JPG» y revisa las reglas.';
      notify('No se guardaron los datos en Firestore: '+errorText(e),true);
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
async function persistEvidence(r){
  if(r.id)return;
  const id=doc(collection(db,'sgEvidence')).id;
  // Solo METADATOS, nunca bytes, foto, URL, base64 ni ruta de Storage.
  const record={ownerUid:user.uid,ownerName:'',nameMode:'full',db:r.db,unit:r.unit,
    source:r.source,zone:r.zone,placeName:r.placeName||'',reportedSource:'',
    lat:r.lat,lng:r.lng,gpsAccuracyM:r.gpsAccuracyM,capturedAt:r.capturedAt,
    createdAt:serverTimestamp()};
  await setDoc(doc(db,'sgEvidence',id),record);
  currentRecord={...r,id};
  await loadHistory();
  notify('Datos guardados en Firestore. La foto queda solo en tu dispositivo.');
}
async function sharedImage(record){
  if(!rawPhotoCanvas)throw Error('La fotografía ya no está abierta en esta sesión. Toma otra para compartir.');
  return canvasJpeg(composePhoto(record,rawPhotoCanvas));
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
// Solamente se envía la lectura acústica y su escala; no enviamos fotografías,
// nombres, emails, dirección, fecha ni coordenadas a OpenAI.
function resumenSeguro(r,question=''){
  return {db:Number.isFinite(r?.db)?r.db:null,unit:r?.unit==='dB SPL'?'dB SPL':'dBFS',question:String(question||'').slice(0,400)};
}
async function aiAnalysis(question=''){
  if(!currentRecord?.id)return notify('Para analizar esta lectura, primero deben guardarse los datos del registro en Firestore.',true);
  if(!Number.isFinite(currentRecord.db))return notify('Este registro no tiene lectura del micrófono para analizar. Prueba de nuevo con el permiso activado.',true);
  const btn=$('analyze');busy(btn,true,'Analizar con IA');
  try{const result=await consultarSonoGuardIA(auth,'analyze',resumenSeguro(currentRecord,question));currentAnalysis=result?.answer||'Sin respuesta';$('analysis-result').textContent=currentAnalysis;$('analysis-result').classList.remove('hidden');}
  catch(e){notify('IA no disponible: '+errorText(e),true);}finally{busy(btn,false,'Analizar con IA');}
}
async function printReport(){
  if(!currentRecord||!currentImageBlob)return;
  const popup=window.open('','_blank');if(!popup)return notify('Habilita ventanas emergentes para imprimir.',true);
  const r=currentRecord;const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const reader=new FileReader();reader.onload=()=>{popup.document.open();popup.document.write(`<!doctype html><html lang="${getLanguage()}"><head><meta charset="utf-8"><title>${tr('Reporte SonoGuard')}</title><style>body{font:16px system-ui;color:#142632;max-width:880px;margin:auto;padding:25px}img{width:100%;object-fit:contain}.warn{border:1px solid #777;padding:15px}button{padding:12px}@media print{button{display:none}}</style></head><body><h1>${tr('SonoGuard IA · Evidencia de prueba')}</h1><img alt="${tr('Fotografía de medición')}" src="${reader.result}"><p><b>${tr('Nombre:')}</b> ${escape(r.ownerName||'No declarado')}<br><b>${tr('Lectura:')}</b> ${escape(displayRecord(r))}<br><b>${tr('Lugar:')}</b> ${escape(r.zone)}<br><b>${tr('Fecha y hora:')}</b> ${escape(formatDate(recordDate(r)))}</p>${currentAnalysis?`<p>${escape(currentAnalysis)}</p>`:''}<p class="warn">${getLanguage()==='en'?'Informational test record. Uncertified measurement. Does not initiate official visits or proceedings. Test contact: 75830320; 2022 published municipal reference: '+OFFICIAL_REFERENCE+' (unverified).':'Registro ciudadano informativo de prueba. Medición no certificada. No activa visitas ni trámites oficiales. Contacto de prueba 75830320; referencia municipal publicada en 2022 '+OFFICIAL_REFERENCE+' (vigencia sin confirmar).'}</p><button onclick="window.print()">${tr('Imprimir / Guardar PDF')}</button></body></html>`);popup.document.close();};reader.readAsDataURL(currentImageBlob);
}
function historyCard(data,id){
  const card=make('article','history-card');
  card.append(make('h3','',displayRecord(data)));
  card.append(make('p','meta',`${formatDate(recordDate(data))} · ${data.zone||'Sin ubicación'}`));
  card.append(make('p','meta','Registro de datos únicamente. No se almacenó una foto en esta sección.'));
  const details=make('div','history-details');details.hidden=true;
  details.append(make('p','meta',`Origen: ${data.source==='microfono'?'micrófono del dispositivo':data.source==='sin_mic'?'sin lectura por falta de micrófono':'lectura histórica'} · Escala original: ${data.unit||'sin identificar'}`));
  details.append(make('p','meta',`Coordenadas: ${Number.isFinite(data.lat)&&Number.isFinite(data.lng)?`${data.lat}, ${data.lng}`:'No disponibles'}`));
  details.append(make('p','meta',`Precisión reportada: ${Number.isFinite(data.gpsAccuracyM)?'±'+data.gpsAccuracyM+' m':'no disponible'}`));
  if(Number.isFinite(data.lat)&&Number.isFinite(data.lng)){
    const map=make('a','maps-link','Abrir ubicación en Google Maps ↗');
    map.href=googleMapsUrl(data.lat,data.lng);map.target='_blank';map.rel='noopener noreferrer';details.append(map);
  }
  const answer=make('p','ai-result hidden');answer.setAttribute('aria-live','polite');
  const row=make('div','buttons'),see=make('button','secondary','Ver datos'),analyze=make('button','secondary','Explicar con IA'),del=make('button','ghost','Eliminar registro');
  see.addEventListener('click',()=>{details.hidden=!details.hidden;see.textContent=details.hidden?'Ver datos':'Ocultar datos';});
  analyze.addEventListener('click',async()=>{
    if(!user)return;
    if(!Number.isFinite(data.db))return notify('No hay lectura de micrófono para analizar con IA.',true);
    busy(analyze,true,'Explicar con IA');
    try{
      const result=await consultarSonoGuardIA(auth,'analyze',resumenSeguro(data,''));
      answer.textContent=result?.answer||'Sin respuesta';answer.classList.remove('hidden');
    }catch(e){notify('IA no disponible: '+errorText(e),true);}
    finally{busy(analyze,false,'Explicar con IA');}
  });
  del.addEventListener('click',async()=>{
    if(!confirm(tr('¿Eliminar solo este registro de datos de Firebase? No afecta hospitales ni elimina fotos de tu celular.')))return;
    del.disabled=true;
    try{
      await deleteDoc(doc(db,'sgEvidence',id));
      if(currentRecord?.id===id){currentRecord={...currentRecord,id:undefined};}
      await loadHistory();notify('Registro de datos eliminado de Firebase.');
    }catch(e){notify('No se pudo eliminar: '+errorText(e),true);del.disabled=false;}
  });
  row.append(see,analyze,del);card.append(details,answer,row);return card;
}
function renderTrends(records){const dest=$('trends');dest.replaceChildren();for(const unit of ['dBFS','dB SPL']){const set=records.filter(r=>r.unit===unit&&Number.isFinite(r.db));const panel=make('div','trend-panel');panel.append(make('h3','',positiveUnit(unit)));if(!set.length){panel.append(make('p','muted small','Sin registros de esta escala.'));dest.append(panel);continue;}const nums=set.map(r=>positiveValue(r.db,r.unit)),median=[...nums].sort((a,b)=>a-b)[Math.floor(nums.length/2)],avg=nums.reduce((a,b)=>a+b,0)/nums.length;panel.append(make('p','trend-stats',`${nums.length} mediciones · Promedio ${avg.toFixed(1)} · Mediana ${median.toFixed(1)} ${positiveUnit(unit)}`));for(const r of set.slice(0,10).reverse()){const row=make('div','trend-row'),bar=make('div','bar');bar.style.width=`${Math.max(2,(positiveValue(r.db,r.unit)/(unit==='dBFS'?100:160))*100)}%`;row.append(make('span','meta',formatDate(recordDate(r)).slice(0,10)),bar,make('span','meta',number(positiveValue(r.db,r.unit))));panel.append(row);}panel.append(make('p','trend-warning','Resumen descriptivo: no determina infracciones ni permite comparar equipos no calibrados.'));dest.append(panel);}}
async function loadHistory(){
  if(!user)return;
  const root=$('history');root.replaceChildren(make('p','muted','Cargando datos…'));
  try{
    // Solo filtro ownerUid: no necesita índice compuesto (ordenado en el navegador).
    const q=query(collection(db,'sgEvidence'),where('ownerUid','==',user.uid),limit(100));
    const snap=await getDocs(q);
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    const millis=r=>r.createdAt?.toMillis?.()||r.capturedAt?.toMillis?.()||0;
    rows.sort((a,b)=>millis(b)-millis(a));
    root.replaceChildren();renderTrends(rows);
    if(!rows.length){root.append(make('p','muted','Aún no hay registros de datos. Toma una foto para registrar fecha, hora, ubicación y lectura.'));return;}
    for(const row of rows)root.append(historyCard(row,row.id));
  }catch(e){
    const explain=String(e?.code||'').includes('permission-denied')?
      'No se pudo leer Firestore: publica las reglas actualizadas en tu proyecto y verifica que estés conectado.':
      'No se pudo cargar el historial: '+errorText(e);
    root.replaceChildren(make('p','muted',explain));notify(explain,true);
  }
}
async function loadAdmin(){if(!user||user.uid!==appConfig?.adminUid){$('admin-section').classList.add('hidden');return;}$('admin-section').classList.remove('hidden');const el=$('admin-list');el.replaceChildren(make('p','muted','Cargando…'));try{const snap=await getDocs(query(collection(db,'sgEvidence'),orderBy('createdAt','desc'),limit(30)));el.replaceChildren();if(snap.empty)el.append(make('p','muted','Sin registros.'));for(const d of snap.docs){const r=d.data();el.append(make('p','meta',`${r.ownerName||'No declarado'} · ${r.zone} · ${displayRecord(r)} · ${formatDate(recordDate(r))}`));}}catch(e){el.replaceChildren(make('p','muted','No se pudo obtener la lista administrativa.'));}}
function bind(){
  $('start-camera').addEventListener('click',startCamera);$('stop-camera').addEventListener('click',stopCamera);
  $('retry-sensors').addEventListener('click',async()=>{if(!cameraStream)return notify('Abre la cámara antes de reintentar sensores.',true);startGps(true);await startMic();updateHud();notify('Reintentando ubicación y micrófono. Si el GPS falla, todavía puedes fotografiar con el micrófono.');});
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
