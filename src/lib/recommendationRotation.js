// Advance in ranked order without repeating places until the pool is exhausted.
export function nextRecommendationBatch(pool, previous, context, size = 3) {
 const ids = [...new Set(pool.map(item => item.place.id))];
 const seen = new Set(previous?.context === context ? previous.seen : ids.slice(0,size));
 let next = ids.filter(id => !seen.has(id));
 const recycled = ids.length > 0 && next.length === 0;
 if (recycled) { seen.clear(); next = ids; }
 const selected = next.slice(0,size);
 selected.forEach(id => seen.add(id));
 return {context, selected, seen:[...seen], recycled};
}
