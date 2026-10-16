const marker='\n\n[COURSEPICK_COMPANION_INFO_V1]\n';
export function readCompanionMetadata(description,provided) {
 const text=typeof description==='string'?description:'';const index=text.indexOf(marker);
 let info=provided;
 if(index>=0){try{const parsed=JSON.parse(text.slice(index+marker.length));if(parsed && typeof parsed==='object'&&!Array.isArray(parsed))info={...parsed,...provided};}catch{}}
 return {description:index>=0?text.slice(0,index):text,info};
}
