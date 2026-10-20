const initials=[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const vowels=[...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const finals=['',...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const vowelPairs={'ㅗㅏ':'ㅘ','ㅗㅐ':'ㅙ','ㅗㅣ':'ㅚ','ㅜㅓ':'ㅝ','ㅜㅔ':'ㅞ','ㅜㅣ':'ㅟ','ㅡㅣ':'ㅢ','ㅘㅣ':'ㅙ','ㅝㅣ':'ㅞ'};
const finalPairs={'ㄱㅅ':'ㄳ','ㄴㅈ':'ㄵ','ㄴㅎ':'ㄶ','ㄹㄱ':'ㄺ','ㄹㅁ':'ㄻ','ㄹㅂ':'ㄼ','ㄹㅅ':'ㄽ','ㄹㅌ':'ㄾ','ㄹㅍ':'ㄿ','ㄹㅎ':'ㅀ','ㅂㅅ':'ㅄ'};
const finalSplits=Object.fromEntries(Object.entries(finalPairs).map(([pair,result])=>[result,[...pair]]));
const syllable=(l,v,t=0)=>String.fromCodePoint(0xAC00+(l*21+v)*28+t);
function append(text,key){
 const previous=[...text].at(-1)||'',prefix=text.slice(0,text.length-previous.length);
 const vowel=vowels.indexOf(key),initial=initials.indexOf(key),code=previous.codePointAt(0);
 if(code>=0xAC00&&code<=0xD7A3){
  const n=code-0xAC00,l=Math.floor(n/588),v=Math.floor(n%588/28),t=n%28;
  if(vowel>=0){
   if(t){const split=finalSplits[finals[t]],left=split?finals.indexOf(split[0]):0,right=initials.indexOf(split?split[1]:finals[t]);return prefix+syllable(l,v,left)+syllable(right,vowel);}
   const combined=vowelPairs[vowels[v]+key];
   return combined?prefix+syllable(l,vowels.indexOf(combined)):text+key;
  }
  if(initial>=0){
   const tail=finals.indexOf(key);
   if(!t&&tail>0)return prefix+syllable(l,v,tail);
   const combined=finalPairs[finals[t]+key];
   if(t&&combined)return prefix+syllable(l,v,finals.indexOf(combined));
  }
 }else if(initials.includes(previous)&&vowel>=0){return prefix+syllable(initials.indexOf(previous),vowel);}
 else if(vowelPairs[previous+key])return prefix+vowelPairs[previous+key];
 return text+key;
}
export function composeHangul(keys){return [...keys].reduce(append,'');}
