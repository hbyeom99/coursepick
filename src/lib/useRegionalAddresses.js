import {useEffect,useRef} from 'react';
import index from '../data/jibunRegionIndex.json';
const loaders=import.meta.glob('../data/jibunRegions/*.json');
export default function useRegionalAddresses(locations,onLoaded){
 const requested=useRef(new Map()),loaded=useRef(new Set());
 const codes=[...new Set(locations.map(value=>index[String(value||'').trim().split(/\s+/)[0]]).filter(value=>value!==undefined))].sort().join('|');
 useEffect(()=>{
  let active=true;
  for(const code of codes.split('|').filter(Boolean)){
   if(loaded.current.has(code))continue;
   if(!requested.current.has(code))requested.current.set(code,loaders[`../data/jibunRegions/${code}.json`]());
   requested.current.get(code).then(module=>{if(active){loaded.current.add(code);onLoaded(previous=>({...previous,...module.default}));}}).catch(()=>requested.current.delete(code));
  }
  return()=>{active=false;};
 },[codes,onLoaded]);
}
