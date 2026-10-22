// p1..p12 are the project's explicitly fictional seed places, not real venues.
export function isFictionalPlace(place){return Boolean(place)&&(/^p\d+$/.test(String(place.id||''))||place.isVirtual===true||place.source==='fictional-place');}
export const realPlaceCandidates=places=>places.filter(place=>!isFictionalPlace(place));
