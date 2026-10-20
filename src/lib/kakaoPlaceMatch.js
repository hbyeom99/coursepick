import {straightDistance} from './pickerMap.js';
const normalized=value=>(value||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}]/gu,'');
export function matchExistingPlace(result,catalog) {
 const addresses=[result.address,result.roadAddress].filter(Boolean).map(normalized);
 const matches=catalog.filter(place=>normalized(place.name)===normalized(result.name)&&addresses.includes(normalized(place.location))&&((straightDistance(place,result)??Infinity)<=100));
 return matches.length===1?matches[0]:null;
}
