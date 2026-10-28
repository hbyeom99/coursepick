import { useEffect, useState } from 'react';
import DeviceStatusBar from './DeviceStatusBar.jsx';
import TasteQuestionnaire from './TasteQuestionnaire.jsx';
export default function WelcomeFlow({ onHome, onNickname, onComplete, onLogin, onSignup, onRecover, onResetPassword, recovery = false, canBrowse = false, initialPhase = 'splash' }) {
 const [phase,setPhase]=useState(recovery ? 'reset-password' : initialPhase),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[passwordConfirm,setPasswordConfirm]=useState(''),[nickname,setNickname]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{if(phase !== 'splash') return; const timer=setTimeout(()=>setPhase('login'),3000);return()=>clearTimeout(timer);},[phase]);
 function move(next){setPassword('');setPasswordConfirm('');setNotice('');setPhase(next);}
 async function submit(event){
  event.preventDefault();
  if(phase==='recover'){setNotice('처리 중입니다.');try{const result=await onRecover(email.trim());setNotice(result.message);}catch(error){setNotice(error.message);}return;}
  if(phase==='reset-password'){if(password.length<6){setNotice('비밀번호를 6자 이상 작성해주세요.');return;}try{await onResetPassword(password);setPassword('');setPhase('login');setNotice('비밀번호가 변경되었습니다. 다시 로그인해주세요.');}catch(error){setNotice(error.message);}return;}
  if(!email.trim()||!password.trim()||(phase==='signup'&&!nickname.trim())){setNotice('모든 항목을 입력해 주세요.');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setNotice('이메일 주소를 확인해 주세요.');return;}
  if(phase==='signup' && password.length<6){setNotice('비밀번호를 6자 이상 작성해주세요.');return;}
  if(phase==='signup'&&password!==passwordConfirm){setNotice('비밀번호가 일치하지 않습니다.');return;}
  setNotice(phase === 'login' ? '' : '처리 중입니다.');
  try {
   if(phase==='signup'){const result=await onSignup(email.trim(),password,nickname.trim());setPhase('login');setNotice(result.message);}
   else await onLogin(email.trim(),password);
  } catch(error){setNotice(error.message);} finally {setPassword('');setPasswordConfirm('');}
 }

 if(phase==='splash')return <div className="welcome-splash"><img src="/images/coursepick-splash.png" alt="코스픽"/></div>;
 return <><DeviceStatusBar/><div className="device-home-indicator" aria-hidden="true"/>{phase==='test'?<TasteQuestionnaire onComplete={onComplete}/>:<main className={`welcome-auth ${phase}`}><header>{phase==='login'?<img className="welcome-color-logo" src="/images/coursepick-logo.png" alt="코스픽"/>:<h1>{phase==='signup'?'회원가입':phase==='recover'?'비밀번호 찾기':phase==='reset-password'?'비밀번호 재설정':'아이디 찾기'}</h1>}<p>{phase==='login'?'여행을 떠날 준비가 되셨나요?':phase==='signup'?'나만의 여행 계획을 시작해보세요':phase==='recover'?'가입한 이메일로 재설정 링크를 보내드립니다.':phase==='reset-password'?'새로운 비밀번호를 입력해주세요.':'코스픽의 아이디는 가입한 이메일 주소입니다.'}</p></header>
{phase==='find-id'?<div className="welcome-find-id"><p>평소 사용하는 메일함에서 코스픽 또는 Supabase 관련 메일을 확인해주세요.</p><p>현재는 본인 확인 정보가 없어 이메일 주소를 자동으로 찾아드릴 수 없습니다.</p><button type="button" className="welcome-primary" onClick={()=>move('login')}>로그인으로 돌아가기</button></div>:<form onSubmit={submit}>
{phase!=='reset-password'&&<><label htmlFor="welcome-email">이메일 주소</label><input id="welcome-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/></>}
{phase!=='recover'&&<><label htmlFor="welcome-password">{phase==='reset-password'?'새 비밀번호':'비밀번호'}</label><input id="welcome-password" type="password" autoComplete={phase==='login'?'current-password':'new-password'} placeholder={phase==='signup'||phase==='reset-password'?'비밀번호를 6자 이상 작성해주세요':'비밀번호 입력'} minLength={phase==='signup'||phase==='reset-password'?6:undefined} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required/></>}
{phase==='signup'&&<><div className="signup-password-confirm-heading"><label htmlFor="welcome-password-confirm">비밀번호 확인</label>{passwordConfirm&&<span id="signup-password-match" className={password===passwordConfirm?"password-match":"password-mismatch"} role="status">{password===passwordConfirm?"비밀번호가 일치합니다":"비밀번호가 일치하지 않습니다"}</span>}</div><input id="welcome-password-confirm" aria-describedby={passwordConfirm?"signup-password-match":undefined} aria-invalid={Boolean(passwordConfirm&&password!==passwordConfirm)} type="password" autoComplete="new-password" placeholder="비밀번호를 다시 입력해주세요" minLength={6} maxLength={128} value={passwordConfirm} onChange={e=>setPasswordConfirm(e.target.value)} required/></>}
{phase==='signup'&&<><label htmlFor="welcome-nickname">닉네임 (별명)</label><input id="welcome-nickname" maxLength={20} placeholder="여행자 이름" value={nickname} onChange={e=>setNickname(e.target.value)} required/></>}
{notice&&<p className="welcome-notice" role="status">{notice}</p>}<button className="welcome-primary" type="submit">{phase==='login'?'로그인':phase==='signup'?'가입하기':phase==='recover'?'재설정 메일 보내기':'비밀번호 변경'}</button></form>}
{phase==='login'?<><div className="welcome-account-links"><div><button type="button" onClick={()=>move('find-id')}>아이디 찾기</button><span aria-hidden="true">|</span><button type="button" onClick={()=>move('recover')}>비밀번호 찾기</button></div><button type="button" onClick={()=>move('signup')}>회원가입</button></div><div className="welcome-or">간편 로그인</div><div className="welcome-social">{['Google','Kakao','Naver'].map(provider=><button type="button" key={provider} aria-label={`${provider} 로그인 (준비 중)`} aria-disabled="true" title="준비 중"><span className={`social-mark social-${provider.toLowerCase()}`} aria-hidden="true"/></button>)}</div></>:phase!=='find-id'&&<div className="welcome-switch"><button type="button" onClick={()=>move('login')}>로그인으로 돌아가기</button></div>}
{phase==='login'&&<button hidden={!onComplete && !canBrowse} type="button" className="welcome-home" onClick={()=>{setPassword('');onHome();}}>← 비회원 로그인</button>}</main>}</>;
}
