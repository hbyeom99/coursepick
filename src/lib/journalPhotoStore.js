const DB_NAME='coursepick-journal-photos';
const STORE='photos';
let opening;
function database(){
 if(!('indexedDB' in window))return Promise.reject(new Error('이 브라우저에서는 사진을 저장할 수 없습니다.'));
 if(!opening)opening=new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 return opening;
}
async function transact(mode,action){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),request=action(tx.objectStore(STORE));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);tx.onabort=()=>reject(tx.error);});}
export const putJournalPhoto=(id,blob)=>transact('readwrite',store=>store.put({id,blob}));
export const getJournalPhoto=id=>transact('readonly',store=>store.get(id));
export const deleteJournalPhoto=id=>transact('readwrite',store=>store.delete(id));

export async function compressJournalPhoto(file){
 let image;
 if('createImageBitmap' in window)image=await createImageBitmap(file);
 else image=await new Promise((resolve,reject)=>{const element=new Image(),url=URL.createObjectURL(file);element.onload=()=>{URL.revokeObjectURL(url);resolve(element);};element.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('사진을 읽지 못했습니다.'));};element.src=url;});
 const scale=Math.min(1,1600/Math.max(image.width,image.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
 canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close?.();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));
 if(!blob)throw new Error('사진을 처리하지 못했습니다.');return blob;
}
