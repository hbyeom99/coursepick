const KEY='coursepick.guestDraft.v1';
const storageKey=userId=>userId&&userId!=='guest'?KEY+'.'+userId:KEY;
export function readGuestDraft(userId='guest'){try{return JSON.parse(sessionStorage.getItem(storageKey(userId))||'null');}catch{return null;}}
export function writeGuestDraft(value,userId='guest'){try{sessionStorage.setItem(storageKey(userId),JSON.stringify(value));return true;}catch{return false;}}
export function clearGuestDraft(userId='guest'){try{sessionStorage.removeItem(storageKey(userId));}catch{}}
export function hasGuestWork(value){return Boolean(value&&(value.name?.trim()||value.description?.trim()||value.stopIds?.length||value.accommodationId||value.durationDays>1||(value.transport&&value.transport!=="도보")||(Number(value.hours)>0&&Number(value.hours)!==2)||value.schedule?.length));}
