const profanityTokens = [
  '씨발', '씨빨', '시발', '좆', '좃', '씹', '병신', '븅신', '개새끼', '개새',
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'fuck', 'shit', 'bitch', 'asshole', 'bastard',
];

function profanityKey(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

export function validateSearchQuery(value) {
  const query = String(value || '').trim();
  if (!query) return { valid: false, reason: 'empty', message: '검색어를 입력해 주세요.' };
  if ([...query].length > 50) return { valid: false, reason: 'too-long', message: '검색어는 50자 이내로 입력해 주세요.' };

  // Require at least one Korean syllable or Latin letter. This blocks digit-only,
  // punctuation-only, and symbol-only submissions while allowing mixed queries.
  if (!/[가-힣A-Za-z]/.test(query)) {
    return { valid: false, reason: 'no-word', message: '숫자나 기호만으로는 검색할 수 없습니다. 장소나 여행 키워드를 입력해 주세요.' };
  }

  const compact = profanityKey(query);
  const hasProfanity = profanityTokens.some(token => {
    const normalized = profanityKey(token);
    if (normalized === '시발') return /시발(?!점)/.test(compact);
    return compact.includes(normalized);
  });
  if (hasProfanity) return { valid: false, reason: 'profanity', message: '비속어가 포함된 검색어는 사용할 수 없습니다.' };

  return { valid: true, reason: null, message: '' };
}
