import React, { useState } from 'react';
import useKeyboardSpeech from '../lib/useKeyboardSpeech.js';

const layouts={
 letters:['qwertyuiop'.split(''),'asdfghjkl'.split(''),'zxcvbnm'.split('')],
 korean:[[...'ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ'],[...'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ'],[...'ㅋㅌㅊㅍㅠㅜㅡ']],
 numbers:['1234567890'.split(''),['-','/',':',';','(',')','₩','&','@','"'],['.',',','?','!',"'"]],
 symbols:[['[',']','{','}','#','%','^','*','+','='],['_','\\','|','~','<','>','€','£','¥','•'],['.',',','?','!',"'"]],
 emoji:[['😀','🙂','😊','😂','😍','🥰','😎','🤔','👍','👏'],['❤️','✨','🎉','🌿','🌊','☕','🍺','🍽️','🎲','✈️'],['🌸','🌳','🌙','📷','🚶','🚗','🚌']],
};
function Chevron({down=false}){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={down?'M5 9L12 16L19 9':'M5 15L12 8L19 15'}/></svg>;}
function Backspace(){return <svg width="23" height="20" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4H25V20H10L2 12Z M13 8L20 16M20 8L13 16"/></svg>;}
export default function PresentationKeyboard({onInsert,onDelete,onPrevious,onNext,onDone,onSearch,onCommit}){
 const [mode,setMode]=useState('letters'),[shift,setShift]=useState(false),[language,setLanguage]=useState('en');
 const speech=useKeyboardSpeech(text=>{onCommit?.();onInsert(text,false);});
 const rows=layouts[mode==='letters'&&language==='ko'?'korean':mode];
 const shifted={'ㅂ':'ㅃ','ㅈ':'ㅉ','ㄷ':'ㄸ','ㄱ':'ㄲ','ㅅ':'ㅆ','ㅐ':'ㅒ','ㅔ':'ㅖ'};
 const displayed=value=>mode==='letters'&&shift?(language==='ko'?(shifted[value]||value):value.toUpperCase()):value;
 function key(value){onInsert(displayed(value),mode==='letters'&&language==='ko');if(mode==='letters')setShift(false);}
 function switchLanguage(){speech.stop();onCommit?.();setLanguage(v=>v==='en'?'ko':'en');setMode('letters');setShift(false);}
 function button(value,index){const letter=displayed(value);return <button type="button" className="presentation-key" key={`${value}-${index}`} aria-label={`${letter} 입력`} onClick={()=>key(value)}>{letter}</button>;}
 return <div className="presentation-keyboard" role="group" aria-label="발표용 키보드" onPointerDown={event=>event.preventDefault()}>
  <div className="presentation-keyboard-toolbar"><button type="button" aria-label="이전 관련 검색어" onClick={onPrevious}><Chevron/></button><button type="button" aria-label="다음 관련 검색어" onClick={onNext}><Chevron down/></button><button type="button" className="keyboard-done" aria-label="키보드 접기" onClick={onDone}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 14L10 20L21 2"/></svg></button></div>
  <div className="presentation-keyboard-body">
   <div className="presentation-keyboard-row">{rows[0].map(button)}</div>
   <div className="presentation-keyboard-row keyboard-middle-row">{rows[1].map(button)}</div>
   <div className="presentation-keyboard-row keyboard-third-row"><button type="button" className="presentation-key keyboard-function" aria-label={mode==='letters'?(language==='ko'?'쌍자음 전환':'대문자 전환'):'기호 전환'} aria-pressed={mode==='letters'?shift:undefined} onClick={()=>mode==='letters'?setShift(v=>!v):setMode(mode==='symbols'?'numbers':'symbols')}>{mode==='letters'?<svg className="keyboard-shift-icon" width="24" height="24" viewBox="0 0 24 24" fill={shift?'currentColor':'none'} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true"><path d="M4 12L12 4L20 12H16V21H8V12Z"/></svg>:mode==='symbols'?'123':'#+='}</button><div className="keyboard-third-letters">{rows[2].map(button)}</div><button type="button" className="presentation-key keyboard-function" aria-label="한 글자 지우기" onClick={onDelete}><Backspace/></button></div>
   <div className="presentation-keyboard-row keyboard-bottom-row"><button type="button" className="presentation-key keyboard-function keyboard-mode" aria-label={mode==='letters'?'숫자 키보드':language==='ko'?'한글 키보드':'영문 키보드'} onClick={()=>{setMode(mode==='letters'?'numbers':'letters');setShift(false);}}>{mode==='letters'?'123':language==='ko'?'가나다':'ABC'}</button><button type="button" className="presentation-key keyboard-function keyboard-emoji" aria-label="이모지 전환" onClick={()=>setMode(mode==='emoji'?'letters':'emoji')}>☺</button><button type="button" className="presentation-key keyboard-space" aria-label="공백 입력" onClick={()=>onInsert(' ')}><span aria-hidden="true"> </span></button><button type="button" className="presentation-key keyboard-period" aria-label="마침표 입력" onClick={()=>onInsert('.')}>.</button><button type="button" className="presentation-key keyboard-search" aria-label="키보드 검색" onClick={onSearch}><svg width="26" height="24" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12H24M16 4L24 12L16 20"/></svg></button></div>
  </div>
  <div className="presentation-keyboard-footer"><button type="button" aria-label={language==='en'?'한글로 전환':'영문으로 전환'} onClick={switchLanguage}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12H21M5 7H19M5 17H19"/></svg></button><button type="button" className={`keyboard-microphone${speech.listening?' is-listening':''}`} aria-label={speech.listening?'음성 입력 중지':'음성 입력 시작'} aria-pressed={speech.listening} onClick={speech.toggle}><svg width="24" height="26" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 11V13A7 7 0 0 0 19 13V11M12 20V24M8 24H16"/></svg></button></div>
  {speech.notice&&<p className="keyboard-voice-status" role="status">{speech.notice}</p>}
 </div>;
}
