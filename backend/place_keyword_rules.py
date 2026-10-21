"""Conservative independent-source tagging. No network or database writes here."""
import re
import unicodedata

NAME_RULES=['자연휴양림','수목원','식물원','박물관','미술관','해수욕장','전통시장','캠핑장','글램핑','레일바이크','짚라인','케이블카','도서관','방탈출','보드게임','아쿠아리움','동물원','워터파크','놀이공원','테마파크','스카이워크','출렁다리','한옥마을','독립서점','전망대','해변']
def clean_tags(tags):
    result=[];seen=set()
    for tag in tags or []:
        if not isinstance(tag,str):continue
        tag=re.sub(r'\s+',' ',unicodedata.normalize('NFKC',tag).strip().lstrip('#')).strip()
        key=tag.replace(' ','').lower()
        if tag and key not in seen:seen.add(key);result.append(tag)
    return result

def independent_tags(source,allowed):
    # Only the independently collected record's own name/category, never its
    # description (which can describe neighbouring facilities or negations).
    name=re.sub(r'\s+','',source.get('name',''))
    proposed=[]
    for term in NAME_RULES:
        if term in allowed and term in name:proposed.append((term,f'독립 원문 장소명: {source["name"]}'))
    category=source.get('category')
    if category=='카페' and '카페' in allowed:proposed.append(('카페','독립 원문 업종: 카페'))
    return proposed
