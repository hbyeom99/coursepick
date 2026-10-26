import TravelKeywordSearch from '../TravelKeywordSearch.jsx';
import {allowedHomeQuery,searchKey} from '../../lib/homeSearchIntent.js';
import {keyboardDictionary} from '../../lib/keyboardSearch.js';
import {relatedGroups} from '../../lib/searchIntent.js';
import React,{useMemo,useRef,useState} from 'react';
import {roomCommonKeywords,roomTasteTotals,zipAxes} from '../../lib/zipRooms.js';
import {MemberAvatar,ZipIcon,ZipModal} from './ZipPrimitives.jsx';

const memberLabel=member=>Array.from(String(member.name||'여행자').trim()).slice(0,3).join('')||'여행자';
const axisGaugeRange=position=>({left:`${Math.min(position,50)}%`,width:`${Math.max(Math.abs(position-50),1)}%`});

export default function ZipRoomMembers({room,memberId,onUpdateMember,keywords,onKeywordSearch,onInvite,onCopyInvite,onShare,onOpenWeb}) {
 const [dialog,setDialog]=useState(false),[more,setMore]=useState(false);
 const me=room.members.find(m=>m.id===memberId),stats=roomTasteTotals(room.members),common=roomCommonKeywords(room.members);
 const [tasteDraft,setTasteDraft]=useState(()=>Object.fromEntries(zipAxes.map(axis=>[axis.id,me?.taste?.[axis.id]??50])));
 const selected=me?.keywords||[];
 const searching=useRef(false);
 async function searchKeyword(word){if(searching.current||!allowedHomeQuery(word)||selected.some(v=>searchKey(v)===searchKey(word)))return;searching.current=true;try{await onUpdateMember({...me,keywords:[...selected,word]});}finally{searching.current=false;}}
 const searchKeywords=useMemo(()=>[...new Set([...keywords,...relatedGroups.flat()])],[keywords]);
 const dictionary=useMemo(()=>keyboardDictionary(searchKeywords),[searchKeywords]);
 const toggle=word=>{if(!selected.includes(word)&&!allowedHomeQuery(word))return;return onUpdateMember({...me,keywords:selected.includes(word)?selected.filter(v=>v!==word):[...selected,word]});};
 return <div className="zip-members-page">
  <section className="zip-panel"><h2>멤버</h2><div className="zip-member-list">{room.members.slice(0,4).map(member=><div className="zip-member-item" key={member.id}><MemberAvatar member={member} host={member.id===room.ownerId}/><span>{memberLabel(member)}</span></div>)}{room.members.length>4&&<div className="zip-member-item"><button type="button" className="zip-member-extra" aria-label="나머지 멤버 보기" onClick={()=>setMore(true)}>+{room.members.length-4}</button><span>더보기</span></div>}</div></section>
  <section className="zip-panel zip-taste-panel"><div className="zip-section-heading"><h2>우리들의 성향</h2><strong className="zip-taste-code">{stats.code}</strong></div><div className="zip-taste-status"><div className="zip-taste-legend"><span><i aria-hidden="true"/>우리</span><span><i aria-hidden="true"/>나</span></div><span className="zip-taste-count">{stats.submitted}명 입력 · {stats.pending}명 미입력</span></div>{zipAxes.map(axis=>{
   const groupFraction=stats.maximum?stats.totals[axis.id]/stats.maximum:null;
   const myScore=Number.isFinite(me?.taste?.[axis.id])?me.taste[axis.id]:null;
   const groupPosition=groupFraction===null?null:(axis.reverse?1-groupFraction:groupFraction)*100;
   const myPosition=myScore===null?null:(axis.reverse?100-myScore:myScore);
   const sameSide=groupPosition!==null&&myPosition!==null&&((groupPosition<50&&myPosition<50)||(groupPosition>50&&myPosition>50));
   const groupIsNear=sameSide&&Math.abs(groupPosition-50)<=Math.abs(myPosition-50);
   const groupStyle=groupPosition===null?null:{...axisGaugeRange(groupPosition),zIndex:sameSide&&!groupIsNear?2:1};
   const myStyle=myPosition===null?null:{...axisGaugeRange(myPosition),zIndex:sameSide&&groupIsNear?2:1};
   return <div className="zip-taste-axis" key={axis.id}><strong>{axis.leftCode}</strong><div><div className="zip-axis-label"><span>{axis.left}</span><b>{axis.name}</b><span>{axis.right}</span></div><div className="zip-axis-track">{groupStyle&&<span className="zip-axis-group-gauge" style={groupStyle} aria-label={`우리 ${Math.round(groupFraction*100)}점`}/>}{myStyle&&<span className="zip-axis-my-gauge" style={myStyle} aria-label={`나 ${myScore}점`}/>}</div></div><strong>{axis.rightCode}</strong></div>;
  })}<button type="button" className="zip-text-button" onClick={()=>setDialog(true)}>내 성향 입력하기</button></section>
  <section className="zip-panel zip-keywords-panel"><h2>공동취향 키워드 <span>※</span></h2><TravelKeywordSearch selectionMode selectedKeywords={selected} alignTop inputId="zip-keyword-search" query="" keywords={searchKeywords} keyboardDictionary={dictionary} placeholder="키워드를 검색하여 추가해보세요." onSearch={searchKeyword}/><div className="zip-keyword-chips">{[...new Set([...selected,...common.filter(allowedHomeQuery)])].map(word=><button type="button" key={word} className={selected.includes(word)?'active':''} aria-pressed={selected.includes(word)} onClick={()=>toggle(word)}>#{word}{selected.includes(word)&&<span>×</span>}</button>)}</div>{!selected.length&&<p className="zip-small-note">여행에서 함께 즐기고 싶은 키워드를 골라주세요.</p>}{selected.length>0&&room.members.length>1&&<p className="zip-small-note">모두가 선택한 키워드 {common.length}개</p>}</section>
  <section className="zip-invite-panel" aria-label="친구 초대"><h2>초대하기</h2><p className="zip-invite-code-label">친구 초대 링크</p><div className="zip-invite-code"><strong aria-label="초대 링크 주소 가림">••••••••••••</strong><button type="button" aria-label="실제 초대 링크 복사" onClick={onCopyInvite}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="11" height="13" rx="1.5"/><path d="M5 16H4V4h10v2"/></svg></button></div><div className="zip-invite-actions"><button type="button" className="zip-invite-action" onClick={onShare}><span><ZipIcon name="share" size={20}/></span><small>공유</small></button><button type="button" className="zip-invite-action" onClick={onInvite}><span><ZipIcon name="link" size={20}/></span><small>링크</small></button><button type="button" className="zip-invite-action" onClick={onOpenWeb}><span><ZipIcon name="globe" size={20}/></span><small>브라우저</small></button></div></section>
  {more&&<ZipModal title="참여 멤버" onClose={()=>setMore(false)}>{room.members.map(m=><p className="zip-member-modal-row" key={m.id}><MemberAvatar member={m} host={m.id===room.ownerId}/><span>{memberLabel(m)}</span></p>)}</ZipModal>}
  {dialog&&<ZipModal title="내 여행 성향" onClose={()=>setDialog(false)}><p className="zip-small-note">각 축을 0~100점으로 입력해 주세요. 방에서는 멤버별 점수를 축마다 합산합니다.</p>{zipAxes.map(axis=><label className="zip-personal-axis" key={axis.id}><span>{axis.name}<b>{tasteDraft[axis.id]}점</b></span><input type="range" min="0" max="100" value={tasteDraft[axis.id]} onChange={e=>setTasteDraft(v=>({...v,[axis.id]:Number(e.target.value)}))}/><small>{axis.id==='planning'?'즉흥적 → 계획적':`${axis.left} → ${axis.right}`}</small></label>)}<button type="button" className="zip-primary" onClick={()=>{onUpdateMember({...me,taste:tasteDraft});setDialog(false);}}>내 성향 적용</button></ZipModal>}
 </div>;
}
