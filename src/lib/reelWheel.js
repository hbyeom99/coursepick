// A small wheel gesture advances one card; deliberate large gestures advance more.
export function reelWheelSteps(delta){
 if(!Number.isFinite(delta)||Math.abs(delta)<4)return 0;
 return Math.sign(delta)*Math.min(4,Math.max(1,Math.floor(Math.abs(delta)/300)));
}
