import type { Place } from '../types/place.ts';

// 가상의 장소 데이터입니다. 위도·경도는 지역 주변의 예시 좌표이며 실제 장소 위치가 아닙니다.
// 영업시간은 미확인, rating 0은 아직 평점이 없음을 뜻합니다.
export const places: Place[] = [
  {
    "id": "p1",
    "name": "숲길 커피",
    "category": "카페",
    "region": "서울",
    "location": "서울 성동구 · 성수 카페 골목",
    "description": "초록빛 창가에서 즐기는 여유로운 커피 한 잔.",
    "tags": [
      "커피",
      "여유"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=900&q=85",
    "latitude": 37.5445,
    "longitude": 127.0557,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p2",
    "name": "온기 식탁",
    "category": "음식점",
    "region": "서울",
    "location": "서울 종로구 · 종로 식당 골목",
    "description": "제철 재료로 채운 따뜻하고 든든한 한 끼.",
    "tags": [
      "미식",
      "골목"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1697685153869-9f6b363e8902?auto=format&fit=crop&w=900&q=85",
    "latitude": 37.572,
    "longitude": 126.985,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p3",
    "name": "바람 정원",
    "category": "관광지",
    "region": "제주",
    "location": "제주 제주시 · 초록 산책 구역",
    "description": "나무 사이를 걸으며 잠시 쉬어가는 산책.",
    "tags": [
      "산책",
      "자연"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1567790484933-44b83527e991?auto=format&fit=crop&w=900&q=85",
    "latitude": 33.499,
    "longitude": 126.53,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p4",
    "name": "파도 전망대",
    "category": "관광지",
    "region": "부산",
    "location": "부산 영도구 · 해안 전망 구역",
    "description": "푸른 바다와 탁 트인 수평선을 만나는 곳.",
    "tags": [
      "산책",
      "바다"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1762420783040-967f24e7a5ee?auto=format&fit=crop&w=900&q=85",
    "latitude": 35.089,
    "longitude": 129.064,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p5",
    "name": "오후의 빵집",
    "category": "카페",
    "region": "강릉",
    "location": "강릉 교동 · 베이커리 골목",
    "description": "갓 구운 빵 향기와 함께 보내는 느긋한 오후.",
    "tags": [
      "커피",
      "여유"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&w=900&q=85",
    "latitude": 37.765,
    "longitude": 128.899,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p6",
    "name": "골목 국수",
    "category": "음식점",
    "region": "전주",
    "location": "전주 완산구 · 음식 골목",
    "description": "골목에서 발견한 소박하고 깊은 맛의 국수.",
    "tags": [
      "미식",
      "골목"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1674916287402-33dec2d60cf6?auto=format&fit=crop&w=900&q=85",
    "latitude": 35.811,
    "longitude": 127.123,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p7",
    "name": "초록 산책길",
    "category": "관광지",
    "region": "서울",
    "location": "서울 성동구 · 도심 공원 구역",
    "description": "커피를 마신 뒤 나무 그늘 아래를 천천히 걸어요.",
    "tags": [
      "산책",
      "자연"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1567790484933-44b83527e991?auto=format&fit=crop&w=900&q=85",
    "latitude": 37.541,
    "longitude": 127.044,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p8",
    "name": "골목 티룸",
    "category": "카페",
    "region": "서울",
    "location": "서울 종로구 · 작은 찻집 골목",
    "description": "든든한 식사 후 차 한 잔으로 하루를 정리해요.",
    "tags": [
      "커피",
      "골목"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=900&q=85",
    "latitude": 37.574,
    "longitude": 126.987,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p9",
    "name": "정원 옆 찻집",
    "category": "카페",
    "region": "제주",
    "location": "제주 제주시 · 정원 앞 카페 구역",
    "description": "산책 후 쉬어가기 좋은 조용한 카페.",
    "tags": [
      "커피",
      "자연"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=900&q=85",
    "latitude": 33.501,
    "longitude": 126.534,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p10",
    "name": "바다 앞 커피",
    "category": "카페",
    "region": "부산",
    "location": "부산 영도구 · 해안 카페 구역",
    "description": "바다를 바라본 뒤 향긋한 커피로 채우는 오후.",
    "tags": [
      "커피",
      "바다"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=900&q=85",
    "latitude": 35.092,
    "longitude": 129.07,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p11",
    "name": "솔바람 산책길",
    "category": "관광지",
    "region": "강릉",
    "location": "강릉 교동 · 녹지 산책 구역",
    "description": "빵집에서 시작해 나무 사이의 길로 이어지는 산책.",
    "tags": [
      "산책",
      "자연"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1567790484933-44b83527e991?auto=format&fit=crop&w=900&q=85",
    "latitude": 37.769,
    "longitude": 128.895,
    "openingHours": "운영시간 미확인",
    "rating": 0
  },
  {
    "id": "p12",
    "name": "오래된 골목 찻집",
    "category": "카페",
    "region": "전주",
    "location": "전주 완산구 · 찻집 골목",
    "description": "골목 구경과 식사를 마친 뒤 머무는 작은 찻집.",
    "tags": [
      "커피",
      "골목"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=900&q=85",
    "latitude": 35.814,
    "longitude": 127.125,
    "openingHours": "운영시간 미확인",
    "rating": 0
  }
];

// 사진 설명과 출처는 장소의 공통 데이터 모델과 분리해 보존합니다.
interface PlaceImageMetadata { alt: string; source: string; }
export const placeImageMetadata: Record<string, PlaceImageMetadata> = {
  "p1": {
    "alt": "카페 분위기 참고 사진: 조명과 테이블이 있는 아늑한 카페 내부",
    "source": "https://unsplash.com/photos/VobvKmG-StA"
  },
  "p2": {
    "alt": "식사 분위기 참고 사진: 밥과 신선한 채소를 곁들인 한 끼",
    "source": "https://unsplash.com/photos/I7VmLWXoMJA"
  },
  "p3": {
    "alt": "산책 분위기 참고 사진: 초록 나무 사이로 이어지는 숲길",
    "source": "https://unsplash.com/photos/WGu05iTF3Ng"
  },
  "p4": {
    "alt": "전망대 분위기 참고 사진: 푸른 바다와 수평선 위의 범선",
    "source": "https://unsplash.com/photos/VoZNf0W3eB0"
  },
  "p5": {
    "alt": "빵집 분위기 참고 사진: 노릇하게 구운 크루아상",
    "source": "https://unsplash.com/photos/sqkXyyj4WdE"
  },
  "p6": {
    "alt": "국수집 분위기 참고 사진: 젓가락을 곁들인 국수 한 그릇",
    "source": "https://unsplash.com/photos/dhRvFNesx3M"
  },
  "p7": {
    "alt": "산책 분위기 참고 사진: 초록 나무 사이로 이어지는 숲길",
    "source": "https://unsplash.com/photos/WGu05iTF3Ng"
  },
  "p8": {
    "alt": "카페 분위기 참고 사진: 조명과 테이블이 있는 아늑한 카페 내부",
    "source": "https://unsplash.com/photos/VobvKmG-StA"
  },
  "p9": {
    "alt": "카페 분위기 참고 사진: 조명과 테이블이 있는 아늑한 카페 내부",
    "source": "https://unsplash.com/photos/VobvKmG-StA"
  },
  "p10": {
    "alt": "카페 분위기 참고 사진: 조명과 테이블이 있는 아늑한 카페 내부",
    "source": "https://unsplash.com/photos/VobvKmG-StA"
  },
  "p11": {
    "alt": "산책 분위기 참고 사진: 초록 나무 사이로 이어지는 숲길",
    "source": "https://unsplash.com/photos/WGu05iTF3Ng"
  },
  "p12": {
    "alt": "카페 분위기 참고 사진: 조명과 테이블이 있는 아늑한 카페 내부",
    "source": "https://unsplash.com/photos/VobvKmG-StA"
  }
};
