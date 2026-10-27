// Both ranges start at neutral (50%). The shorter range must be drawn on top.
export function tasteGaugeStyles(groupPosition,myPosition){
 const group=Number.isFinite(groupPosition)?Math.max(0,Math.min(100,groupPosition)):null;
 const mine=Number.isFinite(myPosition)?Math.max(0,Math.min(100,myPosition)):null;
 const range=position=>({left:`${Math.min(position,50)}%`,width:`${Math.abs(position-50)}%`});
 const sameSide=group!==null&&mine!==null&&(group-50)*(mine-50)>0;
 const groupNear=sameSide&&Math.abs(group-50)<=Math.abs(mine-50);
 const equal=group!==null&&mine!==null&&Math.abs(group-mine)<0.01&&group!==50;
 return {
  group:group===null?null:{...range(group),zIndex:groupNear?2:1,...(equal?{top:'0px',height:'2.5px'}:{})},
  mine:mine===null?null:{...range(mine),zIndex:sameSide&&!groupNear?2:1,...(equal?{top:'2.5px',height:'2.5px'}:{})},
 };
}
