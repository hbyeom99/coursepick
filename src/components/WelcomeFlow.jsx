import { useEffect, useState } from 'react';
import DeviceStatusBar from './DeviceStatusBar.jsx';
const questions = [
 {question:'Q1. 여행 첫날,\n생각보다 일찍 숙소에 도착했다.\n아직 체력이 충분하다면? ⚡',options:['숙소에서 쉬면서 여행의 피로를 미리 풀어둔다','근처에 뭐가 있는지 찾아보고 바로 돌아다닌다']},
 {question:'Q2. 여행 중 하루 종일 시간이 생겼다.\n날씨도 좋다면? 🌈',options:['카페, 맛집, 전시 등을 찾아다니며 시간을 보낸다','바다, 공원, 산책로 등 밖에서 시간을 보낸다']},
 {question:'Q3. 새로운 여행지를 고를 때,\n더 설레는 곳은? 💜',options:['유명한 맛집과 핫플이 가득한 활기찬 도시','조용한 풍경과 자연을 느낄 수 있는 곳']},
 {question:'Q4. 여행지에서 딱 하나의\n특별한 경험을 할 수 있다면? ✨',options:['유명한 미술관이나 랜드마크를 직접 둘러본다','원데이 클래스나 액티비티를 직접 해본다']},
 {question:'Q5. 여행 마지막 날,\n가고 싶은 곳이 3곳이나 남았다면? 🤔',options:['아쉬워도 한두 곳만 골라 천천히 즐긴다','남은 곳을 최대한 많이 돌아보고 알차게 마무리한다']},
];
export default function WelcomeFlow({ onHome, onNickname, onComplete, onLogin, onSignup, onRecover, onResetPassword, recovery = false, canBrowse = false, initialPhase = 'splash' }) {
 const [phase,setPhase]=useState(recovery ? 'reset-password' : initialPhase),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[nickname,setNickname]=useState(''),[notice,setNotice]=useState(''),[step,setStep]=useState(0),[answers,setAnswers]=useState(Array(5).fill(null));
 useEffect(()=>{if(phase !== 'splash') return; const timer=setTimeout(()=>setPhase('login'),3000);return()=>clearTimeout(timer);},[phase]);
 function move(next){setPassword('');setNotice('');setPhase(next);}
 async function submit(event){
  event.preventDefault();
  if(phase==='recover'){setNotice('처리 중입니다.');try{const result=await onRecover(email.trim());setNotice(result.message);}catch(error){setNotice(error.message);}return;}
  if(phase==='reset-password'){if(password.length<6){setNotice('비밀번호를 6자 이상 작성해주세요.');return;}try{await onResetPassword(password);setPassword('');setPhase('login');setNotice('비밀번호가 변경되었습니다. 다시 로그인해주세요.');}catch(error){setNotice(error.message);}return;}
  if(!email.trim()||!password.trim()||(phase==='signup'&&!nickname.trim())){setNotice('모든 항목을 입력해 주세요.');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setNotice('이메일 주소를 확인해 주세요.');return;}
  if(phase==='signup' && password.length<6){setNotice('비밀번호를 6자 이상 작성해주세요.');return;}
  setNotice(phase === 'login' ? '' : '처리 중입니다.');
  try {
   if(phase==='signup'){const result=await onSignup(email.trim(),password,nickname.trim());setPhase('login');setNotice(result.message);}
   else await onLogin(email.trim(),password);
  } catch(error){setNotice(error.message);} finally {setPassword('');}
 }

 if(phase==='splash')return <div className="welcome-splash"><img src="/images/coursepick-splash.png" alt="코스픽"/></div>;
 return <><DeviceStatusBar/><div className="device-home-indicator" aria-hidden="true"/>{phase==='test'?<main className="taste-test-page"><div className="taste-test-progress" role="progressbar" aria-label="취향 테스트 진행" aria-valuemin={0} aria-valuemax={5} aria-valuenow={step+1}><span style={{width:`${(step+1)*20}%`}}/></div><div className="taste-test-step">{step>0&&<button type="button" aria-label="이전 질문" onClick={()=>setStep(value=>value-1)}>‹</button>}<span>{step+1} / 5</span></div><h1>나의 여행 취향 테스트</h1><h2>{questions[step].question}</h2><div className="taste-test-options" role="group" aria-label="답변 선택">{questions[step].options.map((option,index)=><button type="button" key={option} aria-pressed={answers[step]===index} className={answers[step]===index?'selected':''} onClick={()=>setAnswers(values=>values.map((v,i)=>i===step?index:v))}><span className="asset-icon asset-check" aria-hidden="true"/>{option}</button>)}</div>{notice && <p className="welcome-notice" role="alert">{notice}</p>}<button type="button" className="welcome-primary taste-test-next" disabled={answers[step]===null} onClick={()=>{if(step===4){if(onComplete(answers)===false)setNotice('답변을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');}else setStep(value=>value+1);}}>다음</button></main>:<main className={`welcome-auth ${phase}`}><header>{phase==='login'?<img className="welcome-color-logo" src="/images/coursepick-logo.png" alt="코스픽"/>:<h1>{phase==='signup'?'회원가입':phase==='recover'?'비밀번호 찾기':phase==='reset-password'?'비밀번호 재설정':'아이디 찾기'}</h1>}<p>{phase==='login'?'여행을 떠날 준비가 되셨나요?':phase==='signup'?'나만의 여행 계획을 시작해보세요':phase==='recover'?'가입한 이메일로 재설정 링크를 보내드립니다.':phase==='reset-password'?'새로운 비밀번호를 입력해주세요.':'코스픽의 아이디는 가입한 이메일 주소입니다.'}</p></header>
{phase==='find-id'?<div className="welcome-find-id"><p>평소 사용하는 메일함에서 코스픽 또는 Supabase 관련 메일을 확인해주세요.</p><p>현재는 본인 확인 정보가 없어 이메일 주소를 자동으로 찾아드릴 수 없습니다.</p><button type="button" className="welcome-primary" onClick={()=>move('login')}>로그인으로 돌아가기</button></div>:<form onSubmit={submit}>
{phase!=='reset-password'&&<><label htmlFor="welcome-email">이메일 주소</label><input id="welcome-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/></>}
{phase!=='recover'&&<><label htmlFor="welcome-password">{phase==='reset-password'?'새 비밀번호':'비밀번호'}</label><input id="welcome-password" type="password" autoComplete={phase==='login'?'current-password':'new-password'} placeholder={phase==='signup'||phase==='reset-password'?'비밀번호를 6자 이상 작성해주세요':'비밀번호 입력'} minLength={phase==='signup'||phase==='reset-password'?6:undefined} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required/></>}
{phase==='signup'&&<><label htmlFor="welcome-nickname">닉네임 (별명)</label><input id="welcome-nickname" maxLength={20} placeholder="여행자 이름" value={nickname} onChange={e=>setNickname(e.target.value)} required/></>}
{notice&&<p className="welcome-notice" role="status">{notice}</p>}<button className="welcome-primary" type="submit">{phase==='login'?'로그인':phase==='signup'?'가입하기':phase==='recover'?'재설정 메일 보내기':'비밀번호 변경'}</button></form>}
{phase==='login'?<><div className="welcome-account-links"><div><button type="button" onClick={()=>move('find-id')}>아이디 찾기</button><span aria-hidden="true">|</span><button type="button" onClick={()=>move('recover')}>비밀번호 찾기</button></div><button type="button" onClick={()=>move('signup')}>회원가입</button></div><div className="welcome-or">간편 로그인</div><div className="welcome-social">{['Google','Kakao','Naver'].map(provider=><button type="button" key={provider} aria-label={`${provider} 로그인 (준비 중)`} aria-disabled="true" title="준비 중"><span className={`social-mark social-${provider.toLowerCase()}`} aria-hidden="true"/></button>)}</div></>:phase!=='find-id'&&<div className="welcome-switch"><button type="button" onClick={()=>move('login')}>로그인으로 돌아가기</button></div>}
{phase==='login'&&<button hidden={!onComplete && !canBrowse} type="button" className="welcome-home" onClick={()=>{setPassword('');onHome();}}>← 비회원 로그인</button>}</main>}</>;
}
