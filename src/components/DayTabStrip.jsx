import React,{useLayoutEffect,useRef} from 'react';

export default function DayTabStrip({children,label='코스 일차',className='',activeDay,dayCount,onAdd,onRemove,addDisabled=false,removeDisabled=false}){
 const track=useRef(null),drag=useRef(null),suppressClick=useRef(false);
 function pointerDown(event){if(event.pointerType!=='mouse'||event.button!==0)return;suppressClick.current=false;drag.current={id:event.pointerId,x:event.clientX,left:track.current.scrollLeft,moved:false};}
 function pointerMove(event){const state=drag.current;if(!state||event.pointerId!==state.id)return;const delta=event.clientX-state.x;if(Math.abs(delta)>5&&!state.moved){state.moved=true;track.current.setPointerCapture(event.pointerId);}if(state.moved){event.preventDefault();track.current.scrollLeft=state.left-delta;}}
 function pointerEnd(event){const state=drag.current;if(!state||state.id!==event.pointerId)return;suppressClick.current=state.moved;drag.current=null;if(track.current.hasPointerCapture(event.pointerId))track.current.releasePointerCapture(event.pointerId);}

 useLayoutEffect(()=>{
  const element=track.current,selected=element?.querySelector('[aria-selected="true"]');if(!selected)return;
  const bounds=element.getBoundingClientRect(),item=selected.getBoundingClientRect();
  if(item.left<bounds.left)element.scrollLeft-=bounds.left-item.left;
  else if(item.right>bounds.right)element.scrollLeft+=item.right-bounds.right;
 },[activeDay,dayCount]);
 return <div className={`course-day-strip ${className}`}>
  <div ref={track} className="zip-day-tabs course-day-scroll" role="tablist" aria-label={label} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onClickCapture={event=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false;}}}>{children}</div>
  {(onAdd||onRemove)&&<div className="course-day-actions" role="group" aria-label="일차 추가 및 삭제">
   {onAdd&&<button type="button" className="course-day-action" aria-label="일차 추가" disabled={addDisabled} onClick={onAdd}>+</button>}
   {onRemove&&<button type="button" className="course-day-action" aria-label="선택한 일차 전체 삭제" disabled={removeDisabled} onClick={onRemove}>×</button>}
  </div>}
 </div>;
}
