import React,{useEffect,useRef,useState} from 'react';
import App from '../App.jsx';
import {ZipModal} from './zip/ZipPrimitives.jsx';
import WelcomeFlow from './WelcomeFlow.jsx';
import {MemberProvider,memberRequest} from '../lib/memberSession.jsx';

const SESSION_KEY='coursepick.memberRefresh.v1';
function readRefresh(){
 try{return window.sessionStorage.getItem(SESSION_KEY)||'';}catch{return '';}
}
function rememberRefresh(token){
 try{
  if(token)window.sessionStorage.setItem(SESSION_KEY,token);
  else window.sessionStorage.removeItem(SESSION_KEY);
 }catch{/* Login still works when browser storage is unavailable. */}
}

export default function MemberGate(){
 const [recoveryToken,setRecoveryToken]=useState(()=>{const hash=new URLSearchParams(window.location.hash.slice(1));if(hash.get('type')!=='recovery')return '';const token=hash.get('access_token')||'';window.history.replaceState(null,'',window.location.pathname+window.location.search);return token;});
 const [account,setAccount]=useState(null);
 const [browsing,setBrowsing]=useState(!recoveryToken);
 const [loginQuestion,setLoginQuestion]=useState(false);
 const [restoreToken]=useState(()=>recoveryToken?'':readRefresh());
 const [restoring,setRestoring]=useState(Boolean(restoreToken));
 const restoreRequest=useRef(null);

 useEffect(()=>{
  if(!restoreToken)return;
  let active=true;
  // Reuse the request during React StrictMode effect replay to avoid rotating twice.
  if(!restoreRequest.current)restoreRequest.current=(async()=>{
   const session=await memberRequest('refresh',{refresh_token:restoreToken});
   rememberRefresh(session.refresh_token);
   const data=await memberRequest('data',null,session.access_token);
   return {...session,...data};
  })();
  restoreRequest.current.then(next=>{if(active)setAccount(next);})
   .catch(()=>{if(active)rememberRefresh('');})
   .finally(()=>{if(active)setRestoring(false);});
  return()=>{active=false;};
 },[restoreToken]);

 useEffect(()=>{
  if(!account)return;
  let active=true;
  const timer=setTimeout(async()=>{
   try{
    const next=await memberRequest('refresh',{refresh_token:account.refresh_token});
    if(!active)return;
    rememberRefresh(next.refresh_token);
    setAccount(current=>current?{...current,...next}:null);
   }catch{
    if(active){rememberRefresh('');setAccount(null);}
   }
  },Math.max(10000,((account.expires_at*1000||Date.now()+3600000)-Date.now()-60000)));
  return()=>{active=false;clearTimeout(timer);};
 },[account?.access_token]);

 async function login(email,password){
  const session=await memberRequest('login',{email,password});
  const data=await memberRequest('data',null,session.access_token);
  rememberRefresh(session.refresh_token);
  setAccount({...session,...data});setBrowsing(true);setLoginQuestion(false);
 }
 async function signup(email,password,nickname){const result=await memberRequest('signup',{email,password,nickname});await login(email,password);return result;}
 async function logout(){
  try{await memberRequest('logout',{},account.access_token);}
  finally{rememberRefresh('');setAccount(null);setBrowsing(true);}
 }
 if(restoring)return <div className="app-shell view-welcome"><div role="status" style={{padding:32,textAlign:'center'}}>로그인 상태를 확인하고 있어요.</div></div>;
 const authVisible=!browsing;
 return <MemberProvider account={account || {userId:'guest',nickname:'방문자',values:{},isGuest:true}} onLogin={options=>{if(options?.direct)setBrowsing(false);else setLoginQuestion(true);}} onLogout={logout}>
 <div className="member-app-surface" hidden={authVisible} style={authVisible?{display:'none'}:undefined}><App/></div>
 {authVisible&&<div className="app-shell view-welcome"><WelcomeFlow initialPhase="login" onLogin={login} onSignup={signup} recovery={Boolean(recoveryToken)} onRecover={email=>memberRequest('recover',{email})} onResetPassword={async password=>{await memberRequest('reset-password',{password},recoveryToken);rememberRefresh('');setRecoveryToken('');}} onHome={()=>setBrowsing(true)} canBrowse/></div>}
 {loginQuestion&&<ZipModal title="로그인하시겠습니까?" onClose={()=>setLoginQuestion(false)}><p>회원 기능은 로그인 후 이용할 수 있어요. 작성 중인 내용은 그대로 유지됩니다.</p><div className="guest-login-actions"><button type="button" className="zip-primary" onClick={()=>{setLoginQuestion(false);setBrowsing(false);}}>네</button><button type="button" className="zip-secondary" onClick={()=>setLoginQuestion(false)}>아니오</button></div></ZipModal>}
 </MemberProvider>;
}
