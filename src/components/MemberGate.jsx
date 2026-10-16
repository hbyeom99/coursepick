import React,{useEffect,useState} from 'react';
import App from '../App.jsx';
import WelcomeFlow from './WelcomeFlow.jsx';
import {MemberProvider,memberRequest} from '../lib/memberSession.jsx';
export default function MemberGate(){
 const [recoveryToken,setRecoveryToken]=useState(()=>{const hash=new URLSearchParams(window.location.hash.slice(1));if(hash.get('type')!=='recovery')return '';const token=hash.get('access_token')||'';window.history.replaceState(null,'',window.location.pathname+window.location.search);return token;});
 const [account,setAccount]=useState(null);
 const [browsing,setBrowsing]=useState(false);
 useEffect(()=>{if(!account)return;const timer=setTimeout(async()=>{try{const next=await memberRequest('refresh',{refresh_token:account.refresh_token});setAccount(current=>current?{...current,...next}:null);}catch{setAccount(null);}},Math.max(10000,((account.expires_at*1000||Date.now()+3600000)-Date.now()-60000)));return()=>clearTimeout(timer);},[account?.access_token]);
 async function login(email,password){
  const session=await memberRequest('login',{email,password});
  const data=await memberRequest('data',null,session.access_token);
  setAccount({...session,...data});
 }
 async function signup(email,password,nickname){return memberRequest('signup',{email,password,nickname});}
 async function logout(){await memberRequest('logout',{},account.access_token);setAccount(null);}
 if(!account&&!browsing)return <div className="app-shell view-welcome"><WelcomeFlow initialPhase="login" onLogin={login} onSignup={signup} recovery={Boolean(recoveryToken)} onRecover={email=>memberRequest('recover',{email})} onResetPassword={async password=>{await memberRequest('reset-password',{password},recoveryToken);setRecoveryToken('');}} onHome={()=>setBrowsing(true)} canBrowse/></div>;
 return <MemberProvider key={account?.userId || 'guest'} account={account || {userId:'guest',nickname:'방문자',values:{},isGuest:true}} onLogin={()=>setBrowsing(false)} onLogout={logout}><App/></MemberProvider>;
}
