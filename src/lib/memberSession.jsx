import React,{createContext,useContext,useEffect,useState,useRef} from 'react';
const Context=createContext(null);
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export async function memberRequest(path,data,token,method) {
 const response=await fetch(base+'/api/member/'+path,{method:method||(data?'POST':'GET'),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});
 const value=await response.json();if(!response.ok){const message=typeof value.detail==='string'?value.detail:Array.isArray(value.detail)?'입력 정보를 확인해 주세요. 비밀번호는 6자 이상이어야 합니다.':'회원 정보를 처리하지 못했습니다.';throw Error(message);}return value;
}
export function MemberProvider({account,children,onLogout,onLogin}) {
 const queues=useRef(new Map());
 const save=(key,value)=>{if(account.isGuest)return Promise.resolve();const previous=queues.current.get(key)||Promise.resolve();const next=previous.catch(()=>{}).then(()=>memberRequest('data',{key,value},account.access_token,'PUT'));queues.current.set(key,next);return next;};
 return <Context.Provider value={{account,save,onLogout,onLogin}}>{children}</Context.Provider>;
}
export function useMemberContext(){return useContext(Context);}
export function useMemberStored(key,initial,valid) {
 const context=useContext(Context);
 const [value,set]=useState(()=>{const stored=context?.account.values?.[key];return valid(stored)?stored:initial;});
 const [failed,setFailed]=useState(false);
 const committed=useRef(null);
 useEffect(()=>{if(!context || committed.current===JSON.stringify(value))return;let active=true;context.save(key,value).then(()=>{if(active)setFailed(false);if(key==='coursepick.myCourses.v1')window.dispatchEvent(new Event('member-courses-saved'));}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[key,value]);
 async function commit(next){
  if(!context)throw Error('로그인이 필요합니다.');
  await context.save(key,next);
  committed.current=JSON.stringify(next);setFailed(false);set(next);
  if(key==='coursepick.myCourses.v1')window.dispatchEvent(new Event('member-courses-saved'));
 }
 return [value,set,failed,commit];
}
