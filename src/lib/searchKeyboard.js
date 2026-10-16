const keyLetters = 'rsefaqtdwczxvgkoijuphynbml';
const jamoLetters = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅐㅑㅓㅕㅔㅗㅛㅜㅠㅡㅣ';
const shifted = { R: 'ㄲ', E: 'ㄸ', Q: 'ㅃ', T: 'ㅆ', W: 'ㅉ', O: 'ㅒ', P: 'ㅖ' };
const initials = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const vowels = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const finals = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const vowelPairs = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
const finalPairs = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };

// Generate an alternate candidate; never rewrite the user's input.
export function keyboardToHangul(input) {
  const letters = [...input].map(key => {
    const index = keyLetters.indexOf(key.toLowerCase());
    return shifted[key] ?? (index < 0 ? key : jamoLetters[index]);
  });
  let output = '';
  for (let i = 0; i < letters.length;) {
    const initial = initials.indexOf(letters[i]);
    if (initial < 0 || !vowels.includes(letters[i + 1])) { output += letters[i++]; continue; }
    i++;
    let vowel = letters[i++];
    const compoundVowel = vowelPairs[vowel + letters[i]];
    if (compoundVowel) { vowel = compoundVowel; i++; }
    let final = '';
    if (finals.includes(letters[i]) && !vowels.includes(letters[i + 1])) {
      final = letters[i++];
      const compoundFinal = finalPairs[final + letters[i]];
      if (compoundFinal && !vowels.includes(letters[i + 1])) { final = compoundFinal; i++; }
    }
    output += String.fromCharCode(0xac00 + (initial * 21 + vowels.indexOf(vowel)) * 28 + finals.indexOf(final));
  }
  return output;
}

export function searchCandidates(input) {
  const original = input.trim().replace(/^#+/, '').trim();
  return [...new Set([original.toLowerCase(), keyboardToHangul(original).toLowerCase()])];
}
