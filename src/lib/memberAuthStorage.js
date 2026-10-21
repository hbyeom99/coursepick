const KEY='coursepick.memberRefresh.v1';
const flights=new Map();
let generation=0;
export function readMemberRefresh(){
 try{const value=localStorage.getItem(KEY);if(value)return value;}catch{}
 try{const legacy=sessionStorage.getItem(KEY)||'';if(legacy)rememberMemberRefresh(legacy);return legacy;}catch{return '';}
}
export function rememberMemberRefresh(token){
 if(!token)generation+=1;
 for(const name of ['localStorage','sessionStorage'])try{if(token)window[name].setItem(KEY,token);else window[name].removeItem(KEY);}catch{}
}
export const isExpiredMemberSession=error=>[400,401,403].includes(error?.status);
export function refreshMemberSession(fallback,request){
 const key=readMemberRefresh()||fallback;
 if(!key)return Promise.reject(Object.assign(Error('로그인이 필요합니다.'),{status:401}));
 if(flights.has(key))return flights.get(key);
 const started=generation;
 const run=async()=>{const latest=readMemberRefresh()||key;const session=await request('refresh',{refresh_token:latest});if(started!==generation)throw Object.assign(Error('로그아웃되었습니다.'),{status:401});rememberMemberRefresh(session.refresh_token);return session;};
 const promise=(navigator.locks?.request?navigator.locks.request('coursepick-member-refresh',run):run()).finally(()=>flights.delete(key));
 flights.set(key,promise);return promise;
}
