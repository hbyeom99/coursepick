import { useEffect, useState } from 'react';
import DeviceStatusBar from './DeviceStatusBar.jsx';
const questions=[
 {question:'Q1. 여행 일정을 정할 때 더 편한 방식은?',options:['핵심 장소만 정하고 현장에서 자유롭게 바꾼다','방문 순서·시간·예약을 미리 정한다']},
 {question:'Q2. 여행에서 더 즐기고 싶은 경험은?',options:['카페·풍경 감상·가벼운 산책','직접 참여하는 체험·스포츠·활동']},
 {question:'Q3. 다음 여행의 장소를 고른다면?',options:['평소 좋아하던 장소·분위기와 비슷한 곳','경험하지 않은 새로운 카테고리·활동']},
 {question:'Q4. 1인 하루 여행 예산은?\n숙박·지역 간 이동비는 제외해요.',options:['3만원 이하로 즐기고 싶다','8~12만원 정도로 여유 있게 즐기고 싶다']}
];
export default function WelcomeFlow({ onHome, onNickname, onComplete, onLogin, onSignup, onRecover, onResetPassword, recovery = false, canBrowse = false, initialPhase = 'splash' }) {
 const [phase,setPhase]=useState(recovery ? 'reset-password' : initialPhase),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[nickname,setNickname]=useState(''),[notice,setNotice]=useState(''),[step,setStep]=useState(0),[answers,setAnswers]=useState(Array(questions.length).fill(null));
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
 return <><DeviceStatusBar/><div className="device-home-indicator" aria-hidden="true"/>{phase==='test'?<main className="taste-test-page"><div className="taste-test-progress" role="progressbar" aria-label="취향 테스트 진행" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={step+1}><span style={{width:`${(step+1)/questions.length*100}%`}}/></div><div className="taste-test-step">{step>0&&<button type="button" aria-label="이전 질문" onClick={()=>setStep(value=>value-1)}>‹</button>}<span>{step+1} / {questions.length}</span></div><h1>나의 여행 취향 테스트</h1><h2>{questions[step].question}</h2><div className="taste-test-options" role="group" aria-label="답변 선택">{questions[step].options.map((option,index)=><button type="button" key={option} aria-pressed={answers[step]===index} className={answers[step]===index?'selected':''} onClick={()=>setAnswers(values=>values.map((v,i)=>i===step?index:v))}><span className="asset-icon asset-check" aria-hidden="true"/>{option}</button>)}</div>{notice && <p className="welcome-notice" role="alert">{notice}</p>}<button type="button" className="welcome-primary taste-test-next" disabled={answers[step]===null} onClick={async()=>{if(step===questions.length-1){try{if(await onComplete(answers)===false)setNotice('성향을 저장하지 못했습니다. 다시 시도해 주세요.');}catch{setNotice('성향을 저장하지 못했습니다. 연결 상태를 확인해 주세요.');}}else setStep(value=>value+1);}}>다음</button></main>:<main className={`welcome-auth ${phase}`}><header>{phase==='login'?<img className="welcome-color-logo" src="/images/coursepick-logo.png" alt="코스픽"/>:<h1>{phase==='signup'?'회원가입':phase==='recover'?'비밀번호 찾기':phase==='reset-password'?'비밀번호 재설정':'아이디 찾기'}</h1>}<p>{phase==='login'?'여행을 떠날 준비가 되셨나요?':phase==='signup'?'나만의 여행 계획을 시작해보세요':phase==='recover'?'가입한 이메일로 재설정 링크를 보내드립니다.':phase==='reset-password'?'새로운 비밀번호를 입력해주세요.':'코스픽의 아이디는 가입한 이메일 주소입니다.'}</p></header>
{phase==='find-id'?<div className="welcome-find-id"><p>평소 사용하는 메일함에서 코스픽 또는 Supabase 관련 메일을 확인해주세요.</p><p>현재는 본인 확인 정보가 없어 이메일 주소를 자동으로 찾아드릴 수 없습니다.</p><button type="button" className="welcome-primary" onClick={()=>move('login')}>로그인으로 돌아가기</button></div>:<form onSubmit={submit}>
{phase!=='reset-password'&&<><label htmlFor="welcome-email">이메일 주소</label><input id="welcome-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/></>}
{phase!=='recover'&&<><label htmlFor="welcome-password">{phase==='reset-password'?'새 비밀번호':'비밀번호'}</label><input id="welcome-password" type="password" autoComplete={phase==='login'?'current-password':'new-password'} placeholder={phase==='signup'||phase==='reset-password'?'비밀번호를 6자 이상 작성해주세요':'비밀번호 입력'} minLength={phase==='signup'||phase==='reset-password'?6:undefined} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required/></>}
{phase==='signup'&&<><label htmlFor="welcome-nickname">닉네임 (별명)</label><input id="welcome-nickname" maxLength={20} placeholder="여행자 이름" value={nickname} onChange={e=>setNickname(e.target.value)} required/></>}
{notice&&<p className="welcome-notice" role="status">{notice}</p>}<button className="welcome-primary" type="submit">{phase==='login'?'로그인':phase==='signup'?'가입하기':phase==='recover'?'재설정 메일 보내기':'비밀번호 변경'}</button></form>}
{phase==='login'?<><div className="welcome-account-links"><div><button type="button" onClick={()=>move('find-id')}>아이디 찾기</button><span aria-hidden="true">|</span><button type="button" onClick={()=>move('recover')}>비밀번호 찾기</button></div><button type="button" onClick={()=>move('signup')}>회원가입</button></div><div className="welcome-or">간편 로그인</div><div className="welcome-social">{['Google','Kakao','Naver'].map(provider=><button type="button" key={provider} aria-label={`${provider} 로그인 (준비 중)`} aria-disabled="true" title="준비 중"><span className={`social-mark social-${provider.toLowerCase()}`} aria-hidden="true"/></button>)}</div></>:phase!=='find-id'&&<div className="welcome-switch"><button type="button" onClick={()=>move('login')}>로그인으로 돌아가기</button></div>}
{phase==='login'&&<button hidden={!onComplete && !canBrowse} type="button" className="welcome-home" onClick={()=>{setPassword('');onHome();}}>← 비회원 로그인</button>}</main>}</>;
}
