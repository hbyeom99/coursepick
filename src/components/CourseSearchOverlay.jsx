import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DeviceStatusBar from './DeviceStatusBar.jsx';

export default function CourseSearchOverlay({ host, anchor, onClose, onBlankClick, children, alignTop = false, tagLayout = false }) {
 const dialog=useRef(null),[viewport,setViewport]=useState({top:0,height:host.clientHeight});
 useLayoutEffect(()=>{
  const bodyOverflow=document.body.style.overflow;
  const previousScroll=window.scrollY;
  const siblings=[...host.children].filter(node=>node!==dialog.current).map(node=>[node,node.inert]);
  siblings.forEach(([node])=>{node.inert=true;});
  document.body.style.overflow='hidden';
  host.classList.add('search-mode-active');
  const measure=()=>{
   const rect=host.getBoundingClientRect(),scale=rect.width/host.offsetWidth||1;
   const visual=window.visualViewport,top=visual?.offsetTop||0,bottom=top+(visual?.height||window.innerHeight);
   const start=Math.max(rect.top,top),end=Math.min(rect.bottom,bottom);
   setViewport({top:Math.max(0,(start-rect.top)/scale),height:Math.max(0,(end-start)/scale)});
  };
  measure();window.addEventListener('resize',measure);
  window.visualViewport?.addEventListener('resize',measure);
  window.visualViewport?.addEventListener('scroll',measure);
  return()=>{
   siblings.forEach(([node,inert])=>{node.inert=inert;});
   document.body.style.overflow=bodyOverflow;host.classList.remove('search-mode-active');
   window.removeEventListener('resize',measure);
   window.visualViewport?.removeEventListener('resize',measure);
   window.visualViewport?.removeEventListener('scroll',measure);
   window.scrollTo(0,previousScroll);
  };
 },[host]);
 function keyboard(event){
  if(event.key==='Escape'){event.preventDefault();onClose();return;}
  if(event.key!=='Tab')return;
  const controls=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
 return createPortal(<section ref={dialog} className={`course-search-overlay${tagLayout?' search-tag-layout':''}`} role="dialog" aria-modal="true" aria-label="여행 검색" onKeyDown={keyboard} onClick={event=>{if(event.target===event.currentTarget)onBlankClick?.();}} style={{'--search-overlay-top':`${viewport.top}px`,'--search-overlay-height':`${viewport.height}px`,'--search-anchor-top':alignTop?'max(24px, env(safe-area-inset-top, 0px))':`${Math.max(0,anchor.top-viewport.top)}px`,'--search-anchor-left':`${anchor.left}px`,'--search-anchor-width':`${anchor.width}px`}}><DeviceStatusBar/>{children}</section>,host);
}
