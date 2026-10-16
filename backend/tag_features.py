"""Conservative feature matching; instructions are not travel features."""
import re
NATURE = ('자연경관','자연 경관','자연생태','자연 생태','자연휴양림','자연 휴양림','자연 속','자연을 즐','자연을 감상','숲','계곡','수목원','산림','호수')
def feature_evidence(text, tag, words):
    if tag == '양말':
        return None
    sentences = re.split(r'[.!?\n]+', text or '')
    words = NATURE if tag == '자연' else words
    for sentence in sentences:
        if re.search(r'착용|신어야|준비물|지참|금지|주의사항|반드시|필수', sentence):
            continue
        for word in words:
            if word in sentence:
                return word
    return None
