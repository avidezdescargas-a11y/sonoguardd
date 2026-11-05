/** Escala visual positiva para datos digitales; NO es una medición de dB SPL. */
export const DBFS_FLOOR = -110;
export function relativeIndex(rawDbfs){
  if(!Number.isFinite(rawDbfs))return null;
  return Math.max(0,Math.min(100,(rawDbfs-DBFS_FLOOR)*100/(-DBFS_FLOOR)));
}
export function fromRelativeIndex(index){
  if(!Number.isFinite(index))return null;
  return DBFS_FLOOR+Math.max(0,Math.min(100,index))*(-DBFS_FLOOR)/100;
}
export function positiveValue(value,unit){
  if(!Number.isFinite(value))return null;
  return unit==='dBFS'?relativeIndex(value):Math.max(0,value);
}
export function positiveUnit(unit){return unit==='dBFS'?'índice /100':unit;}
export function positiveLabel(value,unit){
  const x=positiveValue(value,unit);
  return x===null?'—':`${x.toFixed(1)} ${positiveUnit(unit)}`;
}
export function historyLevel(raw){
  const s=String(raw??'');const m=s.match(/^(-?\d+(?:\.\d+)?)\s+dBFS$/);
  return m?positiveLabel(Number(m[1]),'dBFS'):s;
}

/** Formatea textos históricos de alertas sin alterar los datos originales guardados. */
export function displayHistoryText(text){
  return String(text??'').replace(/(-?\d+(?:\.\d+)?)\s+dBFS\b/g,(_,raw)=>positiveLabel(Number(raw),'dBFS'));
}
