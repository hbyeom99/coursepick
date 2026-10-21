import {courseTraitAffinity} from './courseTraitsV2.js';
export function rankTasteFirst(items) {
 return [...new Map(items.map(item=>[item.place.id,item])).values()].sort((a,b)=>(b.tasteScore??0)-(a.tasteScore??0)||(a.insertionDistance??a.distance??Infinity)-(b.insertionDistance??b.distance??Infinity)||a.place.id.localeCompare(b.place.id));
}
export function recommendationBatch(pool,previous,context,size=5) {
 if(previous?.context===context)return {...previous,selected:previous.selected.filter(id=>pool.some(item=>item.place.id===id)),exhausted:pool.every(item=>previous.seen.includes(item.place.id))};
 const selected=pool.slice(0,size).map(item=>item.place.id);
 return {context,selected,seen:selected,exhausted:pool.length<=size};
}
export function advanceTasteBatch(pool,previous,context,size=5) {
 const current=recommendationBatch(pool,previous,context,size);
 const seen=new Set(current.seen);
 const remaining=pool.filter(item=>!seen.has(item.place.id));
 if(!remaining.length)return {...current,exhausted:true};
 const selected=remaining.slice(0,size).map(item=>item.place.id);
 return {context,selected,seen:[...new Set([...current.seen,...selected])],exhausted:remaining.length<=size};
}
import {scoreTags} from './exploreTags.js';
export function scorePickerTaste(place,interests=[],taste={},assessment=null) {
 const keywords=scoreTags(place.tags||[]),wanted=new Set(scoreTags(interests));
 return keywords.filter(tag=>wanted.has(tag)).length*3+(assessment?courseTraitAffinity(assessment,taste)*3:0);
}
