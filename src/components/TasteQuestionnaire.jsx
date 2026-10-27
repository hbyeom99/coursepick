import React,{useState} from 'react';
import {travelTasteQuestions as questions} from '../lib/travelTasteTest.js';

export default function TasteQuestionnaire({onComplete}){
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState(Array(questions.length).fill(null));
 const [notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
 const [direction,setDirection]=useState('forward');
 async function next(){
  if(saving||answers[step]===null)return;
  setNotice('');
  if(step<questions.length-1){setDirection('forward');setStep(v=>v+1);return;}
  setSaving(true);
  try{if(await onComplete(answers)===false)setNotice('성향을 저장하지 못했습니다. 다시 시도해 주세요.');}
  catch{setNotice('성향을 저장하지 못했습니다. 연결 상태를 확인해 주세요.');}
  finally{setSaving(false);}
 }
 return <main className="taste-test-page taste-test-eleven" data-direction={direction} data-question={step+1}>
  <div className="taste-test-canvas">
   <div className="taste-test-progress" role="progressbar" aria-label="취향 테스트 진행" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={step+1}><span style={{width:`${(step+1)/questions.length*100}%`}}/></div>
   <div className="taste-test-step">
    {step>0&&<button type="button" aria-label="이전 질문" disabled={saving} onClick={()=>{setNotice('');setDirection('backward');setStep(v=>v-1);}}><svg viewBox="0 0 12 20" aria-hidden="true"><path d="m9 4-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
    <span>{step+1} / {questions.length}</span>
   </div>
   <h1>나의 여행 취향 테스트</h1>
   <div className="taste-sticker-band taste-stickers-before" aria-hidden="true"/>
   <h2 key={step} aria-live="polite">{questions[step].question}</h2>
   <div key={`options-${step}`} className="taste-test-options" role="group" aria-label="답변 선택">
    {questions[step].options.map((option,index)=><button type="button" key={option.text} disabled={saving} aria-pressed={answers[step]===index} className={answers[step]===index?'selected':''} onClick={()=>setAnswers(values=>values.map((v,i)=>i===step?index:v))}>
     <svg className="taste-option-check" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="9" fill="currentColor"/><path d="m5 9 2.6 3L13 5.5" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
     <span className="taste-answer-text">{option.text}</span>
     <span className="taste-answer-art" aria-hidden="true">{option.illustrations.map(src=><img key={src} src={src} alt="" draggable="false"/>)}</span>
    </button>)}
   </div>
   <div className="taste-sticker-band taste-stickers-after" aria-hidden="true"/>
   {notice&&<p className="welcome-notice" role="alert">{notice}</p>}
   <div className="taste-test-bottom">
    <button type="button" className="welcome-primary taste-test-next" disabled={answers[step]===null||saving} onClick={next}>{saving?'저장 중…':'다음'}</button>
    <small>누적 그림: <a href="https://github.com/hfg-gmuend/openmoji" target="_blank" rel="noopener noreferrer">OpenMoji</a> · <a href="/images/taste-stickers/LICENSE.txt" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></small>
   </div>
  </div>
 </main>;
}
