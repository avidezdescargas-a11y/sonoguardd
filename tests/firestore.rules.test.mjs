import {readFileSync} from 'node:fs';
import {test,before,after,beforeEach} from 'node:test';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
let env;
const admin='test-admin';
const sample=()=>({name:'Salón de prueba',type:'Salón de eventos',lat:-16.5,lng:-68.15,radius:100,limit_db:80,limit_note:'Interior',revision:1,updatedAt:serverTimestamp()});
before(async()=>{const rules=readFileSync('firestore.rules','utf8').replace(/return '[^']*';/,`return '${admin}';`);env=await initializeTestEnvironment({projectId:'demo-sonoguard',firestore:{rules,host:'127.0.0.1',port:8080}})});
after(async()=>env?.cleanup());beforeEach(async()=>env.clearFirestore());
test('sin sesión no puede leer ni escribir',async()=>{const db=env.unauthenticatedContext().firestore();await assertFails(getDoc(doc(db,'places','x')));await assertFails(setDoc(doc(db,'places','x'),sample()))});
test('usuario puede consultar pero no crear ni hacerse administrador',async()=>{const db=env.authenticatedContext('student').firestore();await assertSucceeds(getDoc(doc(db,'places','x')));await assertFails(setDoc(doc(db,'places','x'),sample()));await assertFails(setDoc(doc(db,'users','student'),{role:'admin'}));await assertFails(setDoc(doc(db,'settings','global'),{}))});
test('administrador crea, edita y borra; usuario no modifica',async()=>{const db=env.authenticatedContext(admin).firestore(),ref=doc(db,'places','x');await assertSucceeds(setDoc(ref,sample()));const uref=doc(env.authenticatedContext('student').firestore(),'places','x');await assertFails(updateDoc(uref,{limit_db:100,revision:2,updatedAt:serverTimestamp()}));await assertFails(deleteDoc(uref));await assertSucceeds(updateDoc(ref,{limit_db:70,revision:2,updatedAt:serverTimestamp()}));await assertSucceeds(deleteDoc(ref))});
test('administrador también debe respetar esquema y revisión',async()=>{const db=env.authenticatedContext(admin).firestore();await assertFails(setDoc(doc(db,'places','bad'),{...sample(),limit_db:180}));const ref=doc(db,'places','x');await assertSucceeds(setDoc(ref,sample()));await assertFails(updateDoc(ref,{revision:1,updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{role:'admin',revision:2,updatedAt:serverTimestamp()}))});
test('ajustes generales reservados al admin y validados',async()=>{const db=env.authenticatedContext(admin).firestore(),ref=doc(db,'settings','global');const config={warnDigital:-25,limitDigital:-12,warnSpl:80,limitSpl:90,bandLimit:-35,hold:3,schedule:false,levelProfile:2,revision:1,updatedAt:serverTimestamp()};await assertSucceeds(setDoc(ref,config));await assertFails(updateDoc(ref,{warnSpl:95,revision:2,updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(ref,{hold:4,revision:2,updatedAt:serverTimestamp()}));await assertFails(deleteDoc(ref))});

// Ampliación: guardar fotografía privada sin obligar a declarar nombre antes del envío.
test('evidencia de cámara sin nombre se guarda y es privada', async()=>{
  const db=env.authenticatedContext('student').firestore();
  const id='evidenciaSinNombre01';
  const example={ownerUid:'student',ownerName:'',nameMode:'full',db:-32.5,unit:'dBFS',source:'microfono',zone:'Miraflores La Paz',placeName:'',reportedSource:'',lat:null,lng:null,capturedAt:serverTimestamp(),createdAt:serverTimestamp(),photoPath:`sgEvidence/student/${id}.jpg`};
  await assertSucceeds(setDoc(doc(db,'sgEvidence',id),example));
  await assertSucceeds(getDoc(doc(db,'sgEvidence',id)));
  const other=env.authenticatedContext('another').firestore();
  await assertFails(getDoc(doc(other,'sgEvidence',id)));
  await assertFails(setDoc(doc(other,'sgEvidence','otherEvidence01'),{...example,photoPath:'sgEvidence/another/otherEvidence01.jpg'}));
  await assertFails(updateDoc(doc(db,'sgEvidence',id),{ownerName:'Persona Falsa'}));
});
