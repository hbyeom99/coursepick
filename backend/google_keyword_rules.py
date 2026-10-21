"""Transient Google type evidence mapped to Coursepick's existing vocabulary."""
from place_keyword_rules import clean_tags, independent_tags
TYPE_KEYWORDS = {
 'cafe': ['커피'], 'coffee_shop': ['커피'], 'bakery': ['빵'],
 'restaurant': ['미식'], 'korean_restaurant': ['미식', '한식'],
 'japanese_restaurant': ['미식', '일식'], 'chinese_restaurant': ['미식', '중식'],
 'seafood_restaurant': ['미식', '해산물'], 'pizza_restaurant': ['미식', '피자'],
 'sushi_restaurant': ['미식', '초밥'], 'tea_house': ['차'],
 'park': ['공원'], 'beach': ['바다', '해변'], 'museum': ['박물관', '전시'],
 'art_gallery': ['미술관', '전시'], 'botanical_garden': ['식물원', '자연'],
 'national_park': ['자연', '국립공원'], 'hiking_area': ['산책', '자연'],
 'campground': ['캠핑'], 'amusement_park': ['놀이공원'],
 'aquarium': ['아쿠아리움'], 'zoo': ['동물원'], 'shopping_mall': ['쇼핑'],
 'book_store': ['서점'], 'library': ['도서관'], 'lodging': ['숙소'],
}
# Names support only specific facility identities, never subjective atmosphere.
NAME_KEYWORDS = {'박물관':['박물관','전시'], '미술관':['미술관','전시'],
 '해변':['바다','해변'], '해수욕장':['바다','해수욕장'],
 '수목원':['수목원','자연'], '식물원':['식물원','자연'],
 '캠핑장':['캠핑'], '독립서점':['서점'], '전망대':['전망대']}
def google_keywords(row):
    proposed=[]; evidence=[]
    for kind in row.get('types') or []:
        for tag in TYPE_KEYWORDS.get(kind, []):
            proposed.append(tag); evidence.append({'tag':tag,'basis':'type','value':kind})
    name=(row.get('displayName') or {}).get('text','')
    for term, reason in independent_tags({'name':name},set(NAME_KEYWORDS)):
        for tag in NAME_KEYWORDS[term]:
            proposed.append(tag); evidence.append({'tag':tag,'basis':'name','value':term})
    tags=clean_tags(proposed)
    return tags, [next(item for item in evidence if item['tag']==tag) for tag in tags]
