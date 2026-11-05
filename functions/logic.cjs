'use strict';
function normalizeEvidence(record) {
  const unit=record?.unit==='dBFS'?'dBFS':record?.unit==='dB SPL'?'dB SPL':null;
  const db=Number(record?.db);
  if(!unit||!Number.isFinite(db)||db < (unit==='dBFS' ? -120 : 0) || db > (unit==='dBFS' ? 0 : 160)) throw new Error('Medición inválida');
  return {db:Math.round(db*10)/10,unit,source:record.source==='microfono'?'micrófono digital':'lectura declarada'};
}
function responseText(payload){
  const chunks=[];
  for(const item of payload?.output||[]){for(const c of item.content||[]){if(c.type==='output_text'&&typeof c.text==='string')chunks.push(c.text);}}
  return chunks.join('\n').trim().slice(0,1700);
}
module.exports={normalizeEvidence,responseText};
