/** SonoGuard IA - módulo ADITIVO. No lee ni escribe places/ ni settings/global salvo consultar places/. */
import * as projectConfig from './firebase-config.js';
import { getApps, getApp, initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, limit, Timestamp, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getBlob, deleteObject } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-functions.js';

const cfg = projectConfig.firebaseConfig;
if (!cfg?.apiKey || !cfg?.projectId) throw new Error('Configura public/firebase-config.js con los datos de tu proyecto Firebase.');
const app = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');
const $ = id => document.getElementById(id);
const OFFICIAL_REFERENCE = '67123590'; // Publicado en ficha GAMLP de 2022; vigencia NO confirmada.
const TRIAL_NUMBER = '59175830320';     // Número de PRUEBA indicado por el autor.
let user = null, profile = null, coords = null, places = [];
let microphone = null, audioContext = null, analyzer = null, audioNode = null, frame = 0;
let lastReading = null, lastReadingAt = 0, currentRecord = null, currentImageBlob = null;
let currentObjectUrl = null, currentAnalysis = null;
let statusTimer;

function alertUser(message, isError=false) {
  const n = $('status'); n.textContent = message; n.classList.add('visible');
  n.classList.toggle('error',isError); clearTimeout(statusTimer);
  statusTimer = setTimeout(() => n.classList.remove('visible'), 6500);
}
function humanError(error) {
  const code = String(error?.code || '');
  if(code.includes('permission-denied')||code.includes('unauthorized')) return 'Permiso denegado. Revisa reglas, login y que el proyecto Firebase sea el correcto.';
  if(code.includes('billing')||code.includes('storage/unknown')) return 'Comprueba que Firebase Storage y la facturación necesaria estén activados.';
  if(code.includes('auth/invalid-credential')) return 'Correo o contraseña incorrectos.';
  return String(error?.message || 'Ocurrió un error').slice(0,280);
}
function setBusy(button, busy, label) { button.disabled=busy; button.textContent=busy ? 'Procesando…' : label; }
function fmtDate(date) { return new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date); }
function fmtNumber(value) { return Number(value).toFixed(1); }
function protectedName(name) {
  return name.trim().split(/\s+/).map((word,index)=>index<2 ? `${word[0] || ''}.` : word).join(' ');
}
function recordLabel(record) {return `${fmtNumber(record.db)} ${record.unit} · ${record.zone}`;}
function trialLink(record) {
  const txt = `SONOGUARD IA - PROYECTO DE PRUEBA. No es una denuncia oficial.\nResponsable: ${record?.nameMode==='protected' ? protectedName(record.ownerName) : record?.ownerName || ''}\nMedición orientativa: ${record ? recordLabel(record) : 'sin datos'}.\nRegistro: ${record?.capturedAt?.toDate ? fmtDate(record.capturedAt.toDate()) : fmtDate(new Date())}.\nFoto: se adjunta manualmente.`;
  return `https://wa.me/${TRIAL_NUMBER}?text=${encodeURIComponent(txt)}`;
}
function create(type,cls,textContent) {const el=document.createElement(type); if(cls)el.className=cls; if(textContent !== undefined) el.textContent=textContent; return el;}
function attr(el,props) { Object.entries(props).forEach(([key,value])=>el.setAttribute(key,value)); return el; }
function readProfile() {
  if(!user) return null;
  const name=$('full-name').value.trim().replace(/\s+/g,' ');
  if(name.length<5||name.length>100) throw new Error('Escribe tu nombre completo (mínimo cinco caracteres).');
  if(!$('profile-consent').checked) throw new Error('Debes aceptar el consentimiento del perfil.');
  return {fullName:name,organization:$('organization').value.trim(),type:$('profile-type').value,consent:true,updatedAt:serverTimestamp()};
}
async function saveProfile(ev) {
  ev.preventDefault();
  if(!user) return;
  const btn=ev.submitter || $('profile-form').querySelector('button');setBusy(btn,true,'Guardar mi perfil');
  try {const data=readProfile();await setDoc(doc(db,'sgProfiles',user.uid),data);profile={...data};alertUser('Perfil guardado correctamente.');}
  catch(error){alertUser(humanError(error),true);}finally{setBusy(btn,false,'Guardar mi perfil');}
}
async function loadProfile() {
  const snapshot=await getDoc(doc(db,'sgProfiles',user.uid));
  profile=snapshot.exists()?snapshot.data():null;
  $('full-name').value=profile?.fullName || user.displayName || '';
  $('organization').value=profile?.organization||'';
  $('profile-type').value=profile?.type||'ciudadano';
  $('profile-consent').checked=profile?.consent===true;
}
async function loadPlaces() {
  const select=$('known-place');select.replaceChildren(new Option('Sin seleccionar',''));
  try {
    const snap=await getDocs(query(collection(db,'places'),limit(250)));
    places=snap.docs.map(d=>({id:d.id,...d.data()})).filter(d=>typeof d.name==='string').sort((a,b)=>a.name.localeCompare(b.name,'es'));
    places.forEach(place=>select.add(new Option(`${place.name} · ${place.type||'Lugar'}`,place.id)));
  } catch(error) {alertUser('No se pudieron consultar los lugares existentes: '+humanError(error),true);}
}
function stopMic(){if(frame) cancelAnimationFrame(frame);frame=0;if(microphone)microphone.getTracks().forEach(t=>t.stop());microphone=null;if(audioNode)audioNode.disconnect();audioNode=null;if(audioContext)audioContext.close().catch(()=>{});audioContext=null;analyzer=null;lastReading=null;lastReadingAt=0;$('live-db').textContent='—';$('mic-toggle').textContent='Iniciar micrófono';}
async function toggleMic(){
  if(microphone){stopMic();return;}
  try {
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('El navegador requiere HTTPS o localhost para usar micrófono.');
    microphone=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    audioContext=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
    audioNode=audioContext.createMediaStreamSource(microphone);
    analyzer=audioContext.createAnalyser();analyzer.fftSize=4096;audioNode.connect(analyzer);
    const samples=new Float32Array(analyzer.fftSize);
    $('mic-toggle').textContent='Detener micrófono';
    function render(){
      if(!analyzer)return;
      analyzer.getFloatTimeDomainData(samples);let sum=0;for(let i=0;i<samples.length;i++)sum+=samples[i]*samples[i];
      const rms=Math.sqrt(sum/samples.length);
      const reading=Math.max(-120,Math.min(0,20*Math.log10(Math.max(rms,1e-6))));
      lastReading=Math.round(reading*10)/10;lastReadingAt=Date.now();$('live-db').textContent=lastReading.toFixed(1);
      frame=requestAnimationFrame(render);
    }
    render();
  }catch(error){stopMic();alertUser('No se pudo usar el micrófono: '+humanError(error),true);}
}
async function requestLocation(){
  if(!navigator.geolocation){alertUser('La geolocalización no está disponible.',true);return;}
  $('get-location').disabled=true;
  navigator.geolocation.getCurrentPosition(pos=>{
    // ~11 m de resolución; no almacenar más precisión que la necesaria.
    coords={lat:Math.round(pos.coords.latitude*1e4)/1e4,lng:Math.round(pos.coords.longitude*1e4)/1e4};
    $('coords').textContent=`Coordenadas autorizadas: ${coords.lat}, ${coords.lng} (precisión redondeada)`;
    $('get-location').disabled=false;
  },error=>{
    $('get-location').disabled=false;
    alertUser('Ubicación no autorizada o no disponible. Puedes introducir la zona manualmente.',true);
  },{enableHighAccuracy:false,timeout:10000,maximumAge:30000});
}
function measure(){
  if($('reading-type').value==='mic'){
    if(lastReading===null||Date.now()-lastReadingAt>2500) throw new Error('Inicia el micrófono y espera una lectura actual.');
    return {db:lastReading,unit:'dBFS',source:'microfono'};
  }
  const value=Number($('declared-db').value);
  if(!$('declared-db').value.trim()||!Number.isFinite(value)||value<0||value>160)throw new Error('Escribe una lectura declarada entre 0 y 160 dB SPL.');
  return {db:value,unit:'dB SPL',source:'declarada'};
}
function splitCanvasLine(ctx,text,maxWidth){
  const words=String(text).split(/\s+/), lines=[];let line='';
  for(const w of words){const candidate=line?line+' '+w:w;if(ctx.measureText(candidate).width>maxWidth && line){lines.push(line);line=w;}else{line=candidate;}}
  if(line)lines.push(line);return lines.slice(0,3);
}
function printLine(ctx,text,x,y,w,step=32){for(const ln of splitCanvasLine(ctx,text,w)){ctx.fillText(ln,x,y);y+=step;}return y;}
async function evidenceJpeg(file,record){
  if(file.size>10*1024*1024) throw new Error('La foto original supera los 10 MB.');
  if(!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
  const image=await createImageBitmap(file);
  try {
    const width=Math.max(900,Math.min(1500,image.width));const height=Math.max(1,Math.round(image.height*width/image.width));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height+460;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo preparar la imagen.');
    ctx.fillStyle='#0a2030';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,width,height);
    ctx.fillStyle='rgba(4,19,31,.86)';ctx.fillRect(0,height,width,460);
    const x=Math.max(24,width*.04), available=width-x*2;
    ctx.fillStyle='#6af0d4';ctx.font=`bold ${Math.max(22,Math.round(width*.026))}px system-ui`;ctx.fillText('SONOGUARD IA · EVIDENCIA ACÚSTICA',x,height+49);
    ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(33,Math.round(width*.048))}px system-ui`;ctx.fillText(`${fmtNumber(record.db)} ${record.unit} · ${record.source==='microfono'?'MICRÓFONO DIGITAL':'LECTURA DECLARADA'}`,x,height+122);
    ctx.font=`${Math.max(17,Math.round(width*.022))}px system-ui`;
    let y=height+160;
    const name=record.nameMode==='protected'?protectedName(record.ownerName):record.ownerName;
    y=printLine(ctx,`Denunciante (prueba): ${name}`,x,y,available,31);
    y=printLine(ctx,`Hora del dispositivo: ${fmtDate(record.capturedAt.toDate())}`,x,y+5,available,31);
    y=printLine(ctx,`Lugar: ${record.zone}`,x,y+5,available,31);
    if(record.lat!==null&&record.lng!==null) y=printLine(ctx,`Coordenadas aproximadas: ${record.lat}, ${record.lng}`,x,y+4,available,27);
    ctx.font=`${Math.max(14,Math.round(width*.016))}px system-ui`;
    y=printLine(ctx,`Contacto de PRUEBA: 75830320 · GAMLP publicado en 2022: ${OFFICIAL_REFERENCE} (sin confirmar)`,x,y+7,available,26);
    ctx.fillStyle='#f4be85';ctx.font=`bold ${Math.max(13,Math.round(width*.015))}px system-ui`;
    printLine(ctx,'PROYECTO ACADÉMICO DE PRUEBA · MEDICIÓN NO CERTIFICADA · NO ES DENUNCIA OFICIAL',x,canvas.height-42,available,23);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se generó la imagen.')),'image/jpeg',.84));
    if(blob.size>6*1024*1024)throw new Error('La imagen resultante supera el límite de 6 MB.');
    return blob;
  } finally{image.close?.();}
}
function clearPreviewUrl(){if(currentObjectUrl)URL.revokeObjectURL(currentObjectUrl);currentObjectUrl=null;}
function showPreview(record,blob){
  currentRecord=record;currentImageBlob=blob;clearPreviewUrl();currentObjectUrl=URL.createObjectURL(blob);
  $('preview-image').src=currentObjectUrl;$('preview-link').href=trialLink(record);
  $('preview-panel').classList.remove('hidden');$('analysis-result').classList.add('hidden');currentAnalysis=null;$('ai-question').value='';
  $('preview-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
async function saveEvidence(){
  const btn=$('create-evidence');if(!user)return;
  if(!profile?.fullName||!profile?.consent) {alertUser('Primero guarda tu perfil para vincular tu nombre a la evidencia.',true);return;}
  if(!$('share-consent').checked){alertUser('Confirma el consentimiento para generar la fotografía.',true);return;}
  const file=$('photo').files?.[0];if(!file){alertUser('Selecciona o toma una fotografía.',true);return;}
  const zone=$('zone').value.trim();if(zone.length<3){alertUser('Escribe una zona o dirección aproximada.',true);return;}
  setBusy(btn,true,'Crear imagen y guardar en historial');
  try {
    const reading=measure();const id=doc(collection(db,'sgEvidence')).id;const photoPath=`sgEvidence/${user.uid}/${id}.jpg`;
    const record={ownerUid:user.uid,ownerName:profile.fullName,nameMode:$('photo-name-mode').value,db:reading.db,unit:reading.unit,source:reading.source,zone,
      placeName:places.find(p=>p.id===$('known-place').value)?.name || '',reportedSource:$('possible-source').value.trim(),
      lat:coords?.lat??null,lng:coords?.lng??null,capturedAt:Timestamp.now(),createdAt:serverTimestamp(),photoPath};
    const blob=await evidenceJpeg(file,record);const imgRef=storageRef(storage,photoPath);
    await uploadBytes(imgRef,blob,{contentType:'image/jpeg'});
    try {await setDoc(doc(db,'sgEvidence',id),record);}catch(error){await deleteObject(imgRef).catch(()=>{});throw error;}
    showPreview({...record,id,createdAt:record.capturedAt},blob);
    $('share-consent').checked=false;
    alertUser('Evidencia guardada en Firestore y fotografía privada en Storage.');
    await loadHistory();
  }catch(error){alertUser('No se pudo guardar: '+humanError(error),true);}finally{setBusy(btn,false,'Crear imagen y guardar en historial');}
}
async function saveJpg(){if(!currentImageBlob)return;const url=URL.createObjectURL(currentImageBlob);const a=create('a');a.href=url;a.download=`SonoGuard-evidencia-${Date.now()}.jpg`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function openTrial(){if(!currentRecord){alertUser('Primero crea o selecciona una evidencia.',true);return;}window.open(trialLink(currentRecord),'_blank','noopener,noreferrer');}
async function aiAnalysis(question=""){
  if(!currentRecord?.id)return;
  const btn=$('analyze');setBusy(btn,true,'Analizar con IA');
  try {
    const response=await httpsCallable(functions,'analyzeSonoGuardEvidence')({recordId:currentRecord.id,question});
    currentAnalysis=response.data?.analysis||'Sin respuesta';$('analysis-result').textContent=currentAnalysis;$('analysis-result').classList.remove('hidden');
  }catch(error){alertUser('Análisis IA no disponible: '+humanError(error),true);}finally{setBusy(btn,false,'Analizar con IA');}
}
async function printReport(){
  if(!currentRecord||!currentImageBlob)return;
  const popup=window.open('','_blank');if(!popup){alertUser('Autoriza ventanas emergentes para generar el PDF.',true);return;}
  const r=currentRecord;
  const visibleReporter=r.nameMode==='protected'?protectedName(r.ownerName):r.ownerName;
  const reader=new FileReader();reader.onload=()=>{
    const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    popup.document.open();popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte SonoGuard IA</title><style>body{font:16px system-ui;max-width:850px;margin:24px auto;padding:18px;color:#152b39}img{width:100%;max-height:750px;object-fit:contain}small{color:#596d77}.warn{border:1px solid #a7a7a7;padding:12px}button{padding:12px;cursor:pointer}@media print{button{display:none}}</style></head><body><h1>SONOGUARD IA · Reporte académico</h1><img src="${reader.result}" alt="Evidencia acústica"><p><b>Responsable:</b> ${escapeHTML(visibleReporter)}<br><b>Medición:</b> ${fmtNumber(r.db)} ${escapeHTML(r.unit)}<br><b>Zona:</b> ${escapeHTML(r.zone)}<br><b>Registro:</b> ${escapeHTML(fmtDate(r.capturedAt.toDate()))}</p>${currentAnalysis?`<h2>Interpretación orientativa de IA</h2><p>${escapeHTML(currentAnalysis)}</p>`:""}<div class="warn"><b>NO ES DENUNCIA OFICIAL</b><p>Proyecto de prueba; resultados orientativos no certificados. Contacto de prueba 75830320. Referencia municipal publicada en 2022: ${OFFICIAL_REFERENCE} (verificar vigencia).</p></div><button onclick="window.print()">Imprimir / Guardar como PDF</button></body></html>`);popup.document.close();
  };reader.readAsDataURL(currentImageBlob);
}
function renderRecordCard(data,id){
  const card=create('article','history-card');const title=create('h3','',`${fmtNumber(data.db)} ${data.unit}`);card.append(title);
  card.append(create('p','meta',`${fmtDate(data.capturedAt.toDate())} · ${data.zone}`));
  card.append(create('p','meta',`Responsable: ${data.ownerName} · ${data.source==='microfono'?'Micrófono digital':'Lectura declarada'}`));
  const image=create('img');image.alt='Foto acústica privada; tocar abre contacto de prueba';image.loading='lazy';image.addEventListener('click',()=>window.open(trialLink(data),'_blank','noopener,noreferrer'));
  card.insertBefore(image,title);getBlob(storageRef(storage,data.photoPath)).then(blob=>{const url=URL.createObjectURL(blob);image.src=url;image.addEventListener('load',()=>setTimeout(()=>URL.revokeObjectURL(url),30000),{once:true});}).catch(()=>{image.alt='Foto no disponible';image.removeAttribute('src');});
  const bar=create('div','buttons');
  const see=create('button','secondary','Ver evidencia');see.addEventListener('click',async()=>{see.disabled=true;try{showPreview({...data,id},await getBlob(storageRef(storage,data.photoPath)));}catch(e){alertUser(humanError(e),true);}finally{see.disabled=false;}});
  const del=create('button','ghost','Eliminar');del.addEventListener('click',async()=>{
    if(!window.confirm('¿Eliminar permanentemente esta evidencia y su imagen? Los hospitales y lugares NO se modificarán.'))return;
    del.disabled=true;try{await deleteObject(storageRef(storage,data.photoPath));await deleteDoc(doc(db,'sgEvidence',id));if(currentRecord?.id===id){$('preview-panel').classList.add('hidden');currentRecord=null;currentImageBlob=null;clearPreviewUrl();}await loadHistory();alertUser('Evidencia eliminada.');}catch(error){alertUser('No se pudo completar la eliminación: '+humanError(error),true);}
    finally{del.disabled=false;}
  });bar.append(see,del);card.append(bar);return card;
}
function renderTrends(records){
  const dest=$('trends');dest.replaceChildren();
  for(const unit of ['dBFS','dB SPL']){
    const set=records.filter(r=>r.unit===unit&&Number.isFinite(r.db));
    const p=create('div','trend-panel');p.append(create('h3','',unit));
    if(!set.length){p.append(create('p','muted small','Sin mediciones de esta escala.'));dest.append(p);continue;}
    const nums=set.map(r=>r.db), sorted=[...nums].sort((a,b)=>a-b), median=sorted[Math.floor(sorted.length/2)];
    const average=nums.reduce((a,b)=>a+b,0)/nums.length;
    p.append(create('p','trend-stats',`${set.length} mediciones · Media ${average.toFixed(1)} ${unit} · Mediana ${median.toFixed(1)}`));
    const recent=[...set].slice(0,10).reverse();
    for(const r of recent){
      const bar=create('div','trend-row'), fill=create('div','bar');
      // La barra representa posición relativa DENTRO de la escala seleccionada, no límites legales.
      fill.style.width=`${Math.max(2,((r.db+(unit==='dBFS'?120:0))/(unit==='dBFS'?120:160))*100)}%`;
      bar.append(create('span','meta',fmtDate(r.capturedAt.toDate()).slice(0,10)),fill,create('span','meta',fmtNumber(r.db)));p.append(bar);
    }
    const deviations=set.filter(r=>r.db-median>=12).length;
    if(set.length>=5 && deviations)p.append(create('p','trend-warning',`${deviations} registro(s) superan en 12 dB la mediana de esta muestra: revisar condiciones del dispositivo, horarios y posibles causas. No indica incumplimiento.`));
    else p.append(create('p','trend-warning','Las tendencias son descriptivas. No comparan de forma confiable distintos dispositivos ni demuestran infracciones.'));
    dest.append(p);
  }
}
async function loadHistory(){
  if(!user)return;
  const root=$('history');root.replaceChildren(create('p','muted','Cargando historial…'));
  try {
    const q=query(collection(db,'sgEvidence'),where('ownerUid','==',user.uid),orderBy('createdAt','desc'),limit(50));
    const snap=await getDocs(q);root.replaceChildren();renderTrends(snap.docs.map(d=>d.data()));
    if(snap.empty){root.append(create('p','muted','Todavía no hay registros.'));return;}
    snap.docs.forEach(docu=>root.append(renderRecordCard(docu.data(),docu.id)));
  }catch(error){root.replaceChildren(create('p','muted','No se pudo cargar el historial. Verifica que se desplegó el índice compuesto.'));alertUser(humanError(error),true);}
}
async function loadAdmin(){
  const adminUid=projectConfig.appConfig?.adminUid;
  if(!adminUid||user?.uid!==adminUid)return;
  $('admin-section').classList.remove('hidden');
  const dest=$('admin-list');dest.replaceChildren(create('p','muted','Cargando…'));
  try{const snap=await getDocs(query(collection(db,'sgEvidence'),orderBy('createdAt','desc'),limit(30)));dest.replaceChildren();
    if(snap.empty)dest.append(create('p','muted','Aún no hay evidencias.'));
    snap.docs.forEach(docu=>{const d=docu.data();dest.append(create('p','meta',`${d.ownerName} · ${d.zone} · ${fmtNumber(d.db)} ${d.unit} · ${fmtDate(d.capturedAt.toDate())}`));});
  }catch(e){dest.replaceChildren(create('p','muted','Sin acceso administrativo a historial.'));}
}
function bind(){
  $('login-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter;setBusy(button,true,'Ingresar');try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);}catch(error){alertUser(humanError(error),true);}finally{setBusy(button,false,'Ingresar');}});
  $('profile-form').addEventListener('submit',saveProfile);
  $('logout').addEventListener('click',()=>signOut(auth));
  $('mic-toggle').addEventListener('click',toggleMic);
  $('reading-type').addEventListener('change',()=>{const isMic=$('reading-type').value==='mic';$('mic-area').classList.toggle('hidden',!isMic);$('declared-area').classList.toggle('hidden',isMic);if(!isMic)stopMic();});
  $('get-location').addEventListener('click',requestLocation);
  $('clear-location').addEventListener('click',()=>{coords=null;$('coords').textContent='Coordenadas no guardadas.';});
  $('known-place').addEventListener('change',()=>{const place=places.find(p=>p.id===$('known-place').value);if(place&&!$('zone').value.trim())$('zone').value=`${place.name}, La Paz`;});
  $('create-evidence').addEventListener('click',saveEvidence);
  $('download-image').addEventListener('click',saveJpg);
  $('open-trial').addEventListener('click',openTrial);
  $('print-report').addEventListener('click',printReport);
  $('analyze').addEventListener('click',()=>aiAnalysis());
  $('ask-ai').addEventListener('click',()=>{const question=$('ai-question').value.trim();if(question.length<3){alertUser('Escribe una pregunta breve sobre la medición.',true);return;}aiAnalysis(question);});
  $('refresh-history').addEventListener('click',loadHistory);
  window.addEventListener('pagehide',()=>{stopMic();clearPreviewUrl();});
}
bind();
onAuthStateChanged(auth,async newUser=>{
  user=newUser;stopMic();clearPreviewUrl();$('preview-panel').classList.add('hidden');
  $('signin').classList.toggle('hidden',!!user);$('workspace').classList.toggle('hidden',!user);$('logout').classList.toggle('hidden',!user);
  if(!user){profile=null;coords=null;return;}
  $('user-tag').textContent=user.email||'Usuario autenticado';
  try{await Promise.all([loadProfile(),loadPlaces(),loadHistory()]);await loadAdmin();}
  catch(error){alertUser('Error al iniciar: '+humanError(error),true);}
});
