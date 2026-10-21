import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,onAuthStateChanged,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,onSnapshot,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {firebaseConfig,appConfig} from './firebase-config.js';
import {defaults,normalizeSettings,validatePlace,validateSettings} from './data-model.js';
let auth,db;
function init(){if(auth)return;if(!firebaseConfig.apiKey||firebaseConfig.apiKey.startsWith('REEMPLAZA')||firebaseConfig.projectId==='TU_PROYECTO')throw Error('Configura public/firebase-config.js con los datos de tu proyecto Firebase. Lee INSTRUCCIONES.md.');const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app)}
function requireUser(admin=false){init();const u=auth.currentUser;if(!u)throw Error('Inicia sesión para continuar.');if(admin&&u.uid!==appConfig.adminUid)throw Error('Solo el administrador puede editar esta información.');return u}
function userInfo(){const u=requireUser();return{uid:u.uid,email:u.email||'',name:u.displayName||u.email||'Usuario',role:u.uid===appConfig.adminUid?'admin':'user'}}
const locationList=s=>s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>a.name.localeCompare(b.name));
export function subscribeAuth(callback){init();return onAuthStateChanged(auth,callback)}
export async function login(email,password){init();await setPersistence(auth,browserLocalPersistence);return signInWithEmailAndPassword(auth,email,password)}
export async function register(email,password){init();await setPersistence(auth,browserLocalPersistence);return createUserWithEmailAndPassword(auth,email,password)}
export async function resetPassword(email){init();return sendPasswordResetEmail(auth,email)}
export async function logout(){init();return signOut(auth)}
export function subscribeState(callback,onError){requireUser();let locations=null,config=null,rev=0,active=true;const emit=()=>{if(active&&locations!==null&&config!==null)callback({user:userInfo(),places:locations,settings:config,revision:rev})};const fail=e=>{if(active)onError(e)};
const offPlaces=onSnapshot(collection(db,'places'),s=>{locations=locationList(s);emit()},fail);
const offSettings=onSnapshot(doc(db,'settings','global'),s=>{config=s.exists()?normalizeSettings(s.data()):{...defaults};rev=s.exists()?s.data().revision:0;emit()},fail);
return()=>{active=false;offPlaces();offSettings()}}
export async function backend(path,body){requireUser();if(path==='/api/state'){const [p,s]=await Promise.all([getDocs(collection(db,'places')),getDoc(doc(db,'settings','global'))]);return{user:userInfo(),places:locationList(p),settings:s.exists()?normalizeSettings(s.data()):{...defaults},revision:s.exists()?s.data().revision:0}}
requireUser(true);
if(path==='/api/places'){if(!body)throw Error('Faltan los datos del lugar.');if(body.action==='delete'){const ref=doc(db,'places',body.id);await runTransaction(db,async tx=>{const current=await tx.get(ref);if(!current.exists()||current.data().revision!==body.revision)throw Error('El lugar cambió. Actualiza la lista antes de eliminarlo.');tx.delete(ref)});return{ok:true}}
const data=validatePlace(body),ref=body.id?doc(db,'places',body.id):doc(collection(db,'places'));await runTransaction(db,async tx=>{if(body.id){const current=await tx.get(ref);if(!current.exists()||current.data().revision!==body.revision)throw Error('El lugar cambió en otra sesión. Actualiza la lista.');tx.update(ref,{...data,revision:body.revision+1,updatedAt:serverTimestamp()})}else tx.set(ref,{...data,revision:1,updatedAt:serverTimestamp()})});return{ok:true,id:ref.id}}
if(path==='/api/settings'){const data=validateSettings(body.settings),ref=doc(db,'settings','global');await runTransaction(db,async tx=>{const current=await tx.get(ref),revision=current.exists()?current.data().revision:0;if(revision!==body.revision)throw Error('Los ajustes cambiaron. Recarga antes de guardar.');tx.set(ref,{...data,revision:revision+1,updatedAt:serverTimestamp()})});return{ok:true}}
throw Error('Operación desconocida.')}
