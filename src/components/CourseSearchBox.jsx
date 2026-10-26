import {searchKey,homeSearchSuggestions,loadHomeSearchKeywords} from '../lib/homeSearchIntent.js';
import { normalizeKeyboardQuery } from '../lib/keyboardSearch.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { relatedSuggestions } from '../lib/searchIntent.js';
import { getPopularSearchKeywords, recordPopularSearchKeyword } from '../lib/searchKeywordStats.js';
import CourseSearchOverlay from './CourseSearchOverlay.jsx';
import { validateSearchQuery } from '../lib/searchQueryValidation.js';

function SearchIcon({size=20}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15L21 21"/></svg>; }
export default function CourseSearchBox({ busy=false,disabled=false,restricted=false,selectionMode=false,selectedKeywords=[],query, onSearch, home = false, keywords = [], keyboardDictionary = new Set(), inputId, alignTop = false, overlayTopOffset=0, trackSearches=false, iconOnly = false, placeholder = '취향을 입력하세요 (예시 : 맥주)' }) {
 const [input,setInput]=useState(query),[overlay,setOverlay]=useState(null),[active,setActive]=useState(-1);
 const [searchDataReady,setSearchDataReady]=useState(false);
 const [popular,setPopular]=useState([]),[recent,setRecent]=useState([]);
 const [expandedKeywords,setExpandedKeywords]=useState(false);
 const container=useRef(null),overlayInput=useRef(null);
 const fallbackSuggestions=useMemo(()=>restricted?homeSearchSuggestions(input):relatedSuggestions(normalizeKeyboardQuery(input,keyboardDictionary)||'맥주',keywords),[input,keywords,keyboardDictionary,restricted,searchDataReady]);
 const suggestions=useMemo(()=>{
  if(!trackSearches||selectionMode)return fallbackSuggestions;
  const base=restricted?homeSearchSuggestions(input):fallbackSuggestions;
  const ranked=[...popular.map(item=>item.keyword),...base];
  const queryKey=searchKey(input);
  return [...new Map(ranked.filter(word=>!queryKey||searchKey(word).includes(queryKey)).map(word=>[searchKey(word),word])).values()].slice(0,8);
 },[fallbackSuggestions,input,popular,restricted,selectionMode,trackSearches]);
 const recentSuggestions=useMemo(()=>recent.filter(word=>!input||searchKey(word).includes(searchKey(input))).slice(0,8),[input,recent]);
 useEffect(()=>{setInput(query);setActive(-1);},[query]);
 useEffect(()=>{if(!trackSearches)return;try{const stored=JSON.parse(localStorage.getItem('coursepick.recentSearches.v1')||'[]');if(Array.isArray(stored))setRecent(stored.filter(word=>typeof word==='string').slice(0,8));}catch{}},[trackSearches]);
 useEffect(()=>{if(!overlay)return;let active=true;loadHomeSearchKeywords().then(()=>{if(active)setSearchDataReady(true);}).catch(()=>{});return()=>{active=false;};},[overlay]);
 useEffect(()=>{if(!overlay||!trackSearches)return;const controller=new AbortController();getPopularSearchKeywords(controller.signal).then(setPopular).catch(()=>{});return()=>controller.abort();},[overlay,trackSearches]);
 const id=inputId||(home?'home-query':'search-input');
 useEffect(()=>{if(overlay&&active>=0)document.getElementById(id+'-suggestion-'+active)?.scrollIntoView({block:'nearest'});},[active,overlay,id]);
 function openSearch(){
  if(overlay)return;
  const host=container.current.closest('.app-shell'),rect=container.current.querySelector('form').getBoundingClientRect(),bounds=host.getBoundingClientRect();
  const scale=bounds.width/host.offsetWidth||1;
  const anchor=trackSearches&&!selectionMode
   ?{top:24,left:host.offsetWidth*0.041,width:host.offsetWidth*0.895}
   :iconOnly?{top:24,left:16,width:bounds.width/scale-32}:{top:(rect.top-bounds.top)/scale+overlayTopOffset,left:(rect.left-bounds.left)/scale,width:rect.width/scale};
  flushSync(()=>setOverlay({host,anchor}));
  // Focus during the original user gesture so mobile browsers can open the native keyboard.
  overlayInput.current?.focus({preventScroll:true});
  loadHomeSearchKeywords().then(()=>setSearchDataReady(true)).catch(()=>{});
 }
 function closeSearch(){overlayInput.current?.blur();setOverlay(null);setActive(-1);requestAnimationFrame(()=>container.current?.focus({preventScroll:true}));}
 const blocked=value=>disabled||(busy&&searchKey(value)===searchKey(query));
 async function execute(value=input){
  if(blocked(value))return;
  if(!validateSearchQuery(value).valid){if(!selectionMode)await onSearch(value.trim());return;}
  try{await loadHomeSearchKeywords();setSearchDataReady(true);}catch{}
  if(blocked(value)||selectionMode&&!homeSearchSuggestions(value).some(word=>searchKey(word)===searchKey(value))||selectionMode&&selectedKeywords.some(word=>searchKey(word)===searchKey(value)))return;
  // Dismiss the editing focus inside the submit gesture, before navigating.
  overlayInput.current?.blur();
  container.current?.querySelector('input')?.blur();
  flushSync(()=>{setInput(selectionMode?'':value);setOverlay(null);setActive(-1);});
  // Focus a non-editable target so closing the overlay cannot reopen the keyboard.
  container.current?.focus({preventScroll:true});
  const accepted=await onSearch(value.trim());
  if(accepted===false)return;
  if(trackSearches&&!selectionMode&&value.trim()){
   const next=[value.trim(),...recent.filter(word=>searchKey(word)!==searchKey(value))].slice(0,8);
   setRecent(next);try{localStorage.setItem('coursepick.recentSearches.v1',JSON.stringify(next));}catch{}
   void recordPopularSearchKeyword(value.trim()).then(()=>getPopularSearchKeywords()).then(setPopular).catch(()=>{});
  }
 }
 function fillSuggestion(value){setInput(value);setActive(-1);overlayInput.current?.focus({preventScroll:true});}
 function keys(event){
  if(event.key==='Enter'&&(event.nativeEvent.isComposing||event.keyCode===229)){event.preventDefault();return;}
  if(event.key==='ArrowDown'&&suggestions.length){event.preventDefault();setActive(v=>(v+1)%suggestions.length);}
  else if(event.key==='ArrowUp'&&suggestions.length){event.preventDefault();setActive(v=>v<0?suggestions.length-1:(v-1+suggestions.length)%suggestions.length);}
  else if(event.key==='Enter'&&active>=0){event.preventDefault();execute(suggestions[active]);}
 }
 function inputField(expanded){return <><label className="sr-only" htmlFor={expanded?`${id}-expanded`:id}>{expanded?'검색 키워드':home?'취향을 입력하세요':'검색 키워드'}</label><input ref={expanded?overlayInput:undefined} id={expanded?`${id}-expanded`:id} name={`${id}-taste`} autoComplete="off" autoCorrect="off" spellCheck={false} type="search" inputMode="search" enterKeyHint="search" maxLength={50} placeholder={placeholder} value={input} aria-autocomplete="list" aria-controls={expanded?`${id}-suggestions`:undefined} aria-expanded={Boolean(expanded)} aria-activedescendant={expanded&&active>=0?`${id}-suggestion-${active}`:undefined} onFocus={expanded?undefined:openSearch} onChange={e=>{setInput(e.target.value);setActive(-1);}} onKeyDown={expanded?keys:undefined}/></>;}
 function clear(){setInput('');setActive(-1);overlayInput.current?.focus({preventScroll:true});}
 function hideKeyboard(){overlayInput.current?.blur();}

 return <div className={`search-suggestion-shell${trackSearches&&!selectionMode?' has-search-history':''}`} ref={container} tabIndex={-1}>
  <form className={`search-box ${home?'home-search':''}`} role="search" autoComplete="off" aria-label={home?'홈 여행 검색':'여행 코스 검색'} style={overlay?{visibility:'hidden'}:undefined} onClick={e=>{if(e.target===e.currentTarget)openSearch();}} onSubmit={e=>{e.preventDefault();execute();}}>
   {iconOnly?<button type="button" className="search-icon-submit" aria-label="여행 검색 열기" onClick={openSearch}><SearchIcon/></button>:<><button type="submit" className="search-icon-submit" disabled={blocked(input)} aria-label={blocked(input)?"검색 중":"검색 실행"}><SearchIcon/></button>{inputField(false)}
   {input&&<button type="button" className="search-clear" aria-label="검색어 지우기" onClick={()=>setInput('')}>×</button>}</>}
  </form>
  {overlay&&<CourseSearchOverlay alignTop={alignTop||trackSearches&&!selectionMode} tagLayout={trackSearches&&!selectionMode} host={overlay.host} anchor={overlay.anchor} onClose={closeSearch} onBlankClick={hideKeyboard}>
   <div className="search-overlay-row">
   <button type="button" className="search-back search-overlay-back" aria-label="검색 닫기" onClick={closeSearch}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 5 7 12 14 19"/></svg></button>
   <form className="search-box search-overlay-box" role="search" aria-label="전체 화면 여행 검색" autoComplete="off" onSubmit={e=>{e.preventDefault();execute();}}>
    {inputField(true)}
    <button type="submit" className="search-icon-submit" disabled={blocked(input)} aria-label={blocked(input)?"검색 중":"검색 실행"}><SearchIcon/></button>
   </form>
   </div>
   <div className="search-overlay-results" onClick={e=>{if(!e.target.closest('button,[role="option"]'))hideKeyboard();}}>
    {trackSearches&&!selectionMode&&<div className="search-keyword-heading"><h2 className="search-suggestion-heading">추천 키워드</h2>{suggestions.some(word=>Array.from(word).length>6)&&<button type="button" className="search-keyword-expand" aria-expanded={expandedKeywords} onClick={()=>setExpandedKeywords(value=>!value)}>{expandedKeywords?'접기':'더보기'}</button>}</div>}
    <div id={`${id}-suggestions`} className={trackSearches&&!selectionMode?'search-keyword-grid':''} role="listbox" aria-label="추천 키워드">{suggestions.map((word,index)=>{const term=(restricted?input:normalizeKeyboardQuery(input,keyboardDictionary)).trim(),pos=word.indexOf(term),isLong=Array.from(word).length>6;if(trackSearches&&!selectionMode)return <button type="button" key={word} disabled={blocked(word)} role="option" id={`${id}-suggestion-${index}`} aria-selected={active===index} aria-label={`#${word} 검색`} title={`#${word}`} className={`search-keyword-tag${isLong&&!expandedKeywords?' is-truncated':''}${active===index?' active':''}`} onPointerDown={e=>e.preventDefault()} onClick={()=>execute(word)}><span>#{pos>=0&&term?<>{word.slice(0,pos)}<strong>{word.slice(pos,pos+term.length)}</strong>{word.slice(pos+term.length)}</>:word}</span></button>;return <div className={`search-related-row${active===index?' active':''}`} key={word}>
    <button type="button" disabled={blocked(word)} role="option" id={`${id}-suggestion-${index}`} aria-selected={active===index} className="search-related-word" onPointerDown={e=>e.preventDefault()} onClick={()=>selectionMode?fillSuggestion(word):execute(word)}><SearchIcon size={13}/><span>{pos>=0&&term?<>{word.slice(0,pos)}<strong>{word.slice(pos,pos+term.length)}</strong>{word.slice(pos+term.length)}</>:word}</span></button>
    <button type="button" className="search-related-fill" disabled={selectionMode&&(disabled||busy||selectedKeywords.some(value=>searchKey(value)===searchKey(word)))} aria-label={`${word} ${selectionMode?'추가':'입력'}`} onPointerDown={e=>e.preventDefault()} onClick={()=>selectionMode?execute(word):fillSuggestion(word)}>{selectionMode?(selectedKeywords.some(value=>searchKey(value)===searchKey(word))?<span className="keyword-added">추가됨</span>:<span className="keyword-add-plus">+</span>):<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 17L7 7M7 15V7H15"/></svg>}</button>
   </div>;})}</div>
    {trackSearches&&!selectionMode&&recentSuggestions.length>0&&<section className="search-recent-section" aria-label="최근 검색어"><h2 className="search-suggestion-heading">최근 검색어</h2>{recentSuggestions.map(word=><div className="search-related-row" key={`recent-${word}`}><button type="button" className="search-related-word" onPointerDown={e=>e.preventDefault()} onClick={()=>fillSuggestion(word)}><SearchIcon size={13}/><span>{word}</span></button><button type="button" className="search-related-fill" aria-label={`${word} 검색`} onPointerDown={e=>e.preventDefault()} onClick={()=>execute(word)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 17L7 7M7 15V7H15"/></svg></button></div>)}</section>}
   </div>
  </CourseSearchOverlay>}
 </div>;
}
