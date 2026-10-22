import {straightDistance} from './pickerMap.js';
const clean=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·,().-]/g,'');
export function sameRecommendationPlace(a,b){
 if(a.id===b.id)return true;
 if(!clean(a.name)||clean(a.name)!==clean(b.name))return false;
 const distance=straightDistance(a,b);
 // Nearby branches remain separate unless their coordinates are very close.
 return Number.isFinite(distance)&&distance<50;
}
export function placeTieKey(p){return [clean(p.name),Number(p.latitude).toFixed(6),Number(p.longitude).toFixed(6),clean(p.categoryPath||p.category)].join('|');}
export function dedupeRecommendationPlaces(places,score){
 const sorted=[...places].sort((a,b)=>score(b)-score(a)||placeTieKey(a).localeCompare(placeTieKey(b)));
 const names=new Map(),out=[];
 for(const p of sorted){const name=clean(p.name),same=names.get(name)||[];if(same.some(other=>sameRecommendationPlace(p,other)))continue;out.push(p);same.push(p);names.set(name,same);}
 return out;
}
