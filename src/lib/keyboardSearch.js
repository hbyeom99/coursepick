// Compose standard two-set Korean keyboard input without a network request.
const keys = 'rRseEfaqQtTdwWczxvg';
const consonants = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const vowels = {k:'ㅏ',o:'ㅐ',i:'ㅑ',O:'ㅒ',j:'ㅓ',p:'ㅔ',u:'ㅕ',P:'ㅖ',h:'ㅗ',y:'ㅛ',n:'ㅜ',b:'ㅠ',m:'ㅡ',l:'ㅣ'};
const initials = [...consonants];
const medials = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const finals = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const vowelPairs = {'ㅗㅏ':'ㅘ','ㅗㅐ':'ㅙ','ㅗㅣ':'ㅚ','ㅜㅓ':'ㅝ','ㅜㅔ':'ㅞ','ㅜㅣ':'ㅟ','ㅡㅣ':'ㅢ'};
const finalPairs = {'ㄱㅅ':'ㄳ','ㄴㅈ':'ㄵ','ㄴㅎ':'ㄶ','ㄹㄱ':'ㄺ','ㄹㅁ':'ㄻ','ㄹㅂ':'ㄼ','ㄹㅅ':'ㄽ','ㄹㅌ':'ㄾ','ㄹㅍ':'ㄿ','ㄹㅎ':'ㅀ','ㅂㅅ':'ㅄ'};
const splitFinal = Object.fromEntries(Object.entries(finalPairs).map(([a,b])=>[b,[...a]]));
export function koreanKeyboard(text) {
 let output='',l='',v='',t='';
 const flush=()=>{output+=l&&v?String.fromCharCode(0xac00+initials.indexOf(l)*588+medials.indexOf(v)*28+finals.indexOf(t)):l||v;l='';v='';t='';};
 for(const key of text){
  const c=consonants[keys.indexOf(key)]||consonants[keys.indexOf(key.toLowerCase())];
  const nextV=vowels[key]||vowels[key.toLowerCase()];
  if(nextV){
   if(t){const parts=splitFinal[t]||['',t];t=parts[0];flush();l=parts[1];v=nextV;}
   else if(v){if(vowelPairs[v+nextV])v=vowelPairs[v+nextV];else{flush();v=nextV;}}
   else v=nextV;
  }else if(c){
   if(l&&v){if(!t&&finals.includes(c))t=c;else if(t&&finalPairs[t+c])t=finalPairs[t+c];else{flush();l=c;}}
   else{flush();l=c;}
  }else{flush();output+=key;}
 }
 flush();return output;
}
const clean=v=>String(v||'').trim().toLowerCase().replace(/^#+/,'');
export function keyboardDictionary(words){return new Set(words.map(clean).filter(Boolean));}
export function normalizeKeyboardQuery(query,dictionary){
 if(dictionary.has(clean(query)))return query.trim();
 return query.trim().replace(/[a-zA-Z]+/g,word=>{
  if(dictionary.has(clean(word)))return word;
  const converted=koreanKeyboard(word);
  return dictionary.has(clean(converted))?converted:word;
 });
}
