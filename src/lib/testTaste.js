export const testTasteAxes = ['activity','space','environment','content','pace'];
export function testTasteFromAnswers(answers) {
 if(!Array.isArray(answers) || answers.length!==5 || !answers.every(value=>value===0||value===1)) return null;
 return Object.fromEntries(testTasteAxes.map((axis,index)=>[axis,answers[index]===0?40:60]));
}
export function validTestTaste(value) {
 return value===null || (value && testTasteAxes.every(axis=>value[axis]===40||value[axis]===60));
}
export function combineTestTaste(analysis,baseline) {
 if(!baseline || !validTestTaste(baseline))return analysis;
 return {...analysis,taste:Object.fromEntries(testTasteAxes.map(axis=>{
  const {sum=0,count=0}=analysis.evidence[axis] || {};
  // Replace the three neutral prior observations with a mild questionnaire prior.
  const prior=3*(baseline[axis]-50)/50;
  return [axis,Math.max(0,Math.min(100,Math.round(50+50*(sum+prior)/(count+3))))];
 }))};
}
