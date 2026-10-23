import React,{useId,useState} from 'react';
import ScheduleTiming from './ScheduleTiming.jsx';
export default function StopVisitDetails({name,entry,details={},onChange,distance,extra}){
 const [editing,setEditing]=useState(false),id=useId();
 const timing={...entry,...details};
 return <div className="stop-visit-details">
  {onChange?<button type="button" className="stop-time-button" aria-label={`${name} 방문 시간 수정`} aria-expanded={editing} onClick={()=>setEditing(v=>!v)}>{timing.time?<ScheduleTiming entry={timing}/>: '시간 설정'}</button>:timing.time&&<small><ScheduleTiming entry={timing}/></small>}
  {editing&&onChange&&<div className="stop-time-fields"><label>방문 시간<input type="time" aria-label={`${name} 방문 시간`} value={timing.time||''} onInput={e=>onChange({time:e.target.value})}/></label><label>머무는 시간(분)<input type="number" min="1" max="1440" aria-label={`${name} 체류 시간`} value={timing.minutes||''} onChange={e=>{const minutes=Number(e.target.value);if(Number.isInteger(minutes)&&minutes>=1&&minutes<=1440)onChange({minutes});}}/></label><button type="button" onClick={()=>setEditing(false)}>완료</button></div>}
  {distance&&<small className="editor-travel-time">{distance}</small>}
  {extra}
  {(onChange||details.note)&&<details className="stop-memo"><summary>메모</summary><label className="sr-only" htmlFor={id}>{name} 일정 메모</label>{onChange?<textarea id={id} rows={3} maxLength={1000} value={details.note||''} placeholder="간단한 일정이나 기억할 내용을 적어보세요." onChange={e=>onChange({note:e.target.value})}/>:<p>{details.note}</p>}</details>}
 </div>;
}
