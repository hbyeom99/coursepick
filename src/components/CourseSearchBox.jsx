import { composeHangul } from '../lib/hangulKeyboard.js';
import PresentationKeyboard from './PresentationKeyboard.jsx';
import { normalizeKeyboardQuery } from '../lib/keyboardSearch.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { relatedSuggestions } from '../lib/searchIntent.js';
import CourseSearchOverlay from './CourseSearchOverlay.jsx';

function SearchIcon({size=20}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15L21 21"/></svg>; }
export default function CourseSearchBox({ query, onSearch, home = false, keywords = [], keyboardDictionary = new Set() }) {
 const [input,setInput]=useState(query),[overlay,setOverlay]=useState(null),[active,setActive]=useState(-1);
 const container=useRef(null),overlayInput=useRef(null),composition=useRef(null);
 const touchDevice=useMemo(()=>window.matchMedia('(pointer:coarse)').matches,[]);
 const [presentationMode,setPresentationMode]=useState(()=>!window.matchMedia('(pointer:coarse)').matches),[keyboardVisible,setKeyboardVisible]=useState(true);
 const suggestions=useMemo(()=>relatedSuggestions(normalizeKeyboardQuery(input,keyboardDictionary)||'맥주',keywords),[input,keywords,keyboardDictionary]);
 useEffect(()=>{setInput(query);setActive(-1);},[query]);
 const id=home?'home-query':'search-input';
 useEffect(()=>{if(overlay&&active>=0)document.getElementById(id+'-suggestion-'+active)?.scrollIntoView({block:'nearest'});},[active,overlay,id]);
 function openSearch(){
  if(overlay)return;
  const host=container.current.closest('.app-shell'),rect=container.current.querySelector('form').getBoundingClientRect(),bounds=host.getBoundingClientRect();
  const scale=bounds.width/host.offsetWidth||1;
  setKeyboardVisible(true);
  flushSync(()=>setOverlay({host,anchor:{top:(rect.top-bounds.top)/scale,left:(rect.left-bounds.left)/scale,width:rect.width/scale}}));
  // Focus during the original user gesture so mobile browsers can open the native keyboard.
  overlayInput.current?.focus({preventScroll:true});
 }
 function closeSearch(){overlayInput.current?.blur();setOverlay(null);setActive(-1);requestAnimationFrame(()=>container.current?.focus({preventScroll:true}));}
 function execute(value=input){overlayInput.current?.blur();setInput(value);setOverlay(null);setActive(-1);onSearch(value.trim());}
 function fillSuggestion(value){composition.current=null;setInput(value);setActive(-1);overlayInput.current?.focus({preventScroll:true});}
 function keys(event){
  if(event.key==='Enter'&&(event.nativeEvent.isComposing||event.keyCode===229)){event.preventDefault();return;}
  if(event.key==='ArrowDown'&&suggestions.length){event.preventDefault();setActive(v=>(v+1)%suggestions.length);}
  else if(event.key==='ArrowUp'&&suggestions.length){event.preventDefault();setActive(v=>v<0?suggestions.length-1:(v-1+suggestions.length)%suggestions.length);}
  else if(event.key==='Enter'&&active>=0){event.preventDefault();execute(suggestions[active]);}
 }
 function inputField(expanded){return <><label className="sr-only" htmlFor={expanded?`${id}-expanded`:id}>{expanded?'검색 키워드':home?'취향을 입력하세요':'검색 키워드'}</label><input ref={expanded?overlayInput:undefined} id={expanded?`${id}-expanded`:id} name={`${id}-taste`} autoComplete="off" autoCorrect="off" spellCheck={false} type="search" inputMode={presentationMode?'none':'search'} readOnly={presentationMode&&touchDevice} enterKeyHint="search" placeholder="취향을 입력하세요 (예시 : 맥주)" value={input} aria-autocomplete="list" aria-controls={expanded?`${id}-suggestions`:undefined} aria-expanded={Boolean(expanded)} aria-activedescendant={expanded&&active>=0?`${id}-suggestion-${active}`:undefined} onFocus={expanded?()=>{if(presentationMode)setKeyboardVisible(true);}:openSearch} onChange={e=>{composition.current=null;setInput(e.target.value);setActive(-1);}} onKeyDown={expanded?keys:undefined}/></>;}
 function clear(){composition.current=null;setInput('');setActive(-1);overlayInput.current?.focus({preventScroll:true});}
 function editFromKeyboard(text,remove=false,korean=false){
  const field=overlayInput.current,start=field?.selectionStart??input.length,end=field?.selectionEnd??start;
  const session=composition.current;
  const canContinue=session&&start===end&&start===session.end&&input.slice(session.start,session.end)===composeHangul(session.keys.join(''));
  if(korean||(remove&&canContinue&&session.keys.length)){
   const current=canContinue?session:{start, end, keys:[]};
   if(remove)current.keys.pop();else current.keys.push(text);
   const composed=composeHangul(current.keys.join(''));
   const next=input.slice(0,current.start)+composed+input.slice(current.end);
   current.end=current.start+composed.length;composition.current=current.keys.length?current:null;
   setInput(next);setActive(-1);
   requestAnimationFrame(()=>{field?.focus({preventScroll:true});field?.setSelectionRange(current.end,current.end);});return;
  }
  composition.current=null;
  let from=start;
  if(remove&&start===end&&start>0){
   const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(input.slice(0,start))]:Array.from(input.slice(0,start)).map(segment=>({segment}));
   from=start-(segments.at(-1)?.segment.length||0);
  }
  const inserted=remove?'':text,next=input.slice(0,from)+inserted+input.slice(end);
  setInput(next);setActive(-1);
  requestAnimationFrame(()=>{field?.focus({preventScroll:true});field?.setSelectionRange(from+inserted.length,from+inserted.length);});
 }
 function changeKeyboard(usePresentation){
  overlayInput.current?.blur();
  flushSync(()=>{setPresentationMode(usePresentation);setKeyboardVisible(true);});
  overlayInput.current?.focus({preventScroll:true});
 }
 function hideKeyboard(){composition.current=null;overlayInput.current?.blur();setKeyboardVisible(false);}
 function moveSuggestion(direction){setActive(v=>v<0?(direction>0?0:suggestions.length-1):(v+direction+suggestions.length)%suggestions.length);}

 return <div className="search-suggestion-shell" ref={container} tabIndex={-1}>
  <form className={`search-box ${home?'home-search':''}`} role="search" autoComplete="off" aria-label={home?'홈 여행 검색':'여행 코스 검색'} style={overlay?{visibility:'hidden'}:undefined} onClick={e=>{if(e.target===e.currentTarget)openSearch();}} onSubmit={e=>{e.preventDefault();execute();}}>
   <button type="submit" className="search-icon-submit" aria-label="검색 실행"><SearchIcon/></button>{inputField(false)}
   {input&&<button type="button" className="search-clear" aria-label="검색어 지우기" onClick={()=>setInput('')}>×</button>}
  </form>
  {overlay&&<CourseSearchOverlay host={overlay.host} anchor={overlay.anchor} onClose={closeSearch} onBlankClick={hideKeyboard}>
   <form className="search-box search-overlay-box" role="search" aria-label="전체 화면 여행 검색" autoComplete="off" onSubmit={e=>{e.preventDefault();execute();}}>
    <button type="button" className="search-back" aria-label="검색 닫기" onClick={closeSearch}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12H4M10 6L4 12L10 18"/></svg></button>
    {inputField(true)}
    <button type="button" className="search-clear" aria-label="검색어 지우기" disabled={!input} onPointerDown={e=>e.preventDefault()} onClick={clear}>×</button>
    <button type="submit" className="search-icon-submit" aria-label="검색 실행"><SearchIcon/></button>
   </form>
   <div className="search-overlay-results" onClick={e=>{if(!e.target.closest('button,[role="option"]'))hideKeyboard();}}><div id={`${id}-suggestions`} role="listbox" aria-label="연관검색어">{suggestions.map((word,index)=>{const term=normalizeKeyboardQuery(input,keyboardDictionary).trim(),pos=word.indexOf(term);return <div className={`search-related-row${active===index?' active':''}`} key={word}>
    <button type="button" role="option" id={`${id}-suggestion-${index}`} aria-selected={active===index} className="search-related-word" onPointerDown={e=>e.preventDefault()} onClick={()=>execute(word)}><SearchIcon size={13}/><span>{pos>=0&&term?<>{word.slice(0,pos)}<strong>{word.slice(pos,pos+term.length)}</strong>{word.slice(pos+term.length)}</>:word}</span></button>
    <button type="button" className="search-related-fill" aria-label={`${word} 입력`} onPointerDown={e=>e.preventDefault()} onClick={()=>fillSuggestion(word)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 17L7 7M7 15V7H15"/></svg></button>
   </div>;})}</div></div>
   {presentationMode&&keyboardVisible ? <PresentationKeyboard onInsert={(text,korean)=>editFromKeyboard(text,false,korean)} onDelete={()=>editFromKeyboard('',true)} onPrevious={()=>moveSuggestion(-1)} onNext={()=>moveSuggestion(1)} onDone={hideKeyboard} onSearch={()=>execute(active>=0?suggestions[active]:input)} onCommit={()=>{composition.current=null;}}/> : <div className="presentation-keyboard-toggle"><button type="button" aria-label="키보드 열기" onClick={()=>changeKeyboard(true)}><svg width="25" height="20" viewBox="0 0 28 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="24" height="16" rx="2"/><path d="M6 7H7M11 7H12M16 7H17M21 7H22M6 11H7M11 11H12M16 11H17M21 11H22M8 15H20"/></svg></button></div>}
  </CourseSearchOverlay>}
 </div>;
}
