"""Validate user search input locally, before any provider or statistics request."""
import re,unicodedata
from fastapi import HTTPException
TOKENS=('씨발','씨빨','시발','좆','좃','씹','병신','븅신','개새끼','개새','ㅅㅂ','ㅆㅂ','ㅂㅅ','fuck','shit','bitch','asshole','bastard')
def validate_search_query(value,max_length=50):
 text=unicodedata.normalize('NFKC',str(value or '')).strip()
 if not text or len(text)>max_length:raise HTTPException(422,f'검색어는 1~{max_length}자로 입력해 주세요.')
 if not re.search('[가-힣A-Za-z]',text):raise HTTPException(422,'숫자나 기호만으로는 검색할 수 없습니다. 장소나 여행 키워드를 입력해 주세요.')
 compact=''.join(c for c in text.lower() if not c.isspace() and unicodedata.category(c)[0] not in ('P','S'))
 for token in TOKENS:
  normalized=unicodedata.normalize('NFKC',token)
  if re.search('시발(?!점)',compact) if normalized=='시발' else normalized in compact:
   raise HTTPException(422,'비속어가 포함된 검색어는 사용할 수 없습니다.')
 return text
