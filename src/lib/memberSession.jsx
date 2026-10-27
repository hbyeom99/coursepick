import {initialMemberValue} from './memberStoredValue.js';
import React,{createContext,useContext,useEffect,useLayoutEffect,useState,useRef} from 'react';
import {readGuestDraft,writeGuestDraft,clearGuestDraft,hasGuestWork} from './guestDraft.js';
const Context=createContext(null);
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export async function memberRequest(path,data,token,method) {
 const response=await fetch(base+'/api/member/'+path,{method:method||(data?'POST':'GET'),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});
 const value=await response.json();if(!response.ok){const message=typeof value.detail==='string'?value.detail:Array.isArray(value.detail)?'입력 정보를 확인해 주세요.':'회원 정보를 처리하지 못했습니다.';throw Object.assign(Error(message),{status:response.status});}return value;
}
export function MemberProvider({account,children,onLogout,onLogin}) {
 const queues=useRef(new Map());
 const save=(key,value)=>{if(account.isGuest)return Promise.reject(Error('로그인 후 저장할 수 있어요.'));const queueKey=account.userId+':'+key;const previous=queues.current.get(queueKey)||Promise.resolve();const next=previous.catch(()=>{}).then(()=>memberRequest('data',{key,value},account.access_token,'PUT'));queues.current.set(queueKey,next);return next;};
 return <Context.Provider value={{account,save,onLogout,onLogin}}>{children}</Context.Provider>;
}
export function useMemberContext(){return useContext(Context);}
export function useMemberStored(key,initial,valid) {
 const context=useContext(Context),userId=context?.account.userId||'guest',isDraft=key==='coursepick.draft.v1';
 const [value,set]=useState(()=>{const local=isDraft?readGuestDraft(userId):null;const stored=context?.account.values?.[key];return initialMemberValue({isDraft,local,stored,initial,valid});});
 const [failed,setFailed]=useState(false);
 const identity=useRef(userId),committed=useRef(context?.account.isGuest?null:JSON.stringify(value));
 useLayoutEffect(()=>{
  if(!context)return;
  if(identity.current!==userId){
   const fromGuest=identity.current==='guest';identity.current=userId;
   const keep=fromGuest&&!context.account.isGuest&&isDraft&&hasGuestWork(value);
   const stored=context.account.values?.[key];const next=keep?{...value}:valid(stored)?stored:initial;
   committed.current=JSON.stringify(next);set(next);setFailed(false);
   if(keep)writeGuestDraft(next,userId);
   if(fromGuest&&!context.account.isGuest&&isDraft)clearGuestDraft();
   return;
  }
  if(context.account.isGuest){if(isDraft)setFailed(!writeGuestDraft(value));return;}
  if(committed.current===JSON.stringify(value))return;
  if(isDraft)writeGuestDraft(value,userId);
  let active=true;context.save(key,value).then(()=>{if(active){committed.current=JSON.stringify(value);setFailed(false);if(isDraft)clearGuestDraft(userId);}if(key==='coursepick.myCourses.v1')window.dispatchEvent(new Event('member-courses-saved'));}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};
 },[key,value,userId]);
 async function commit(next){if(!context||context.account.isGuest)throw Error('로그인이 필요합니다.');await context.save(key,next);committed.current=JSON.stringify(next);setFailed(false);set(next);if(key==='coursepick.myCourses.v1')window.dispatchEvent(new Event('member-courses-saved'));}
 return [value,set,failed,commit];
}
