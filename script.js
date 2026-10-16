// 장소 데이터는 Place 타입을 사용하는 별도 파일에서 가져옵니다.
import { places } from './src/data/places.ts';

const courses = [
  { id: 'c1', name: '성수의 느린 오전', region: '서울', theme: '커피와 산책', duration: '약 2시간', description: '향긋한 커피 한 잔에서 시작해 초록빛 산책으로 이어지는 시간.', stopIds: ['p1', 'p7'], imagePlaceId: 'p1' },
  { id: 'c2', name: '종로 골목, 한 끼의 여유', region: '서울', theme: '골목과 미식', duration: '약 2시간', description: '따뜻한 식사와 조용한 찻집을 연결하는 골목 여행.', stopIds: ['p2', 'p8'], imagePlaceId: 'p2' },
  { id: 'c3', name: '제주, 초록 사이를 걷다', region: '제주', theme: '자연과 쉼', duration: '약 3시간', description: '숲길을 걷고 정원 옆 카페에서 쉬어가는 느긋한 하루.', stopIds: ['p3', 'p9'], imagePlaceId: 'p3' },
  { id: 'c4', name: '영도에서 만나는 수평선', region: '부산', theme: '바다와 커피', duration: '약 2시간', description: '탁 트인 바다 전망에서 해안 카페로 이어지는 오후.', stopIds: ['p4', 'p10'], imagePlaceId: 'p4' },
  { id: 'c5', name: '강릉, 빵 향기를 따라', region: '강릉', theme: '빵과 산책', duration: '약 2시간', description: '갓 구운 빵과 나무 그늘 아래 산책으로 채우는 작은 여행.', stopIds: ['p5', 'p11'], imagePlaceId: 'p5' },
  { id: 'c6', name: '전주 골목의 맛과 쉼', region: '전주', theme: '미식과 골목', duration: '약 2시간', description: '국수 한 그릇을 즐기고 골목 찻집에서 잠시 머물러요.', stopIds: ['p6', 'p12'], imagePlaceId: 'p6' }
];
const quickCategories = [
  { name: '전체', description: '모든 취향' }, { name: '카페', description: '커피와 여유' },
  { name: '음식점', description: '여행의 맛' }, { name: '관광지', description: '새로운 풍경' }
];
const themes = [
  { name: '커피', title: '커피 한 잔의 여유', description: '머무르고 싶은 공간', imagePlaceId: 'p1' },
  { name: '산책', title: '천천히 걷는 하루', description: '초록과 바다 사이', imagePlaceId: 'p3' },
  { name: '미식', title: '맛으로 기억하는 여행', description: '골목에서 찾은 한 끼', imagePlaceId: 'p2' }
];
const regions = [
  { name: '광주광역시', subtitle: '문화와 미식', imagePlaceId: 'p2' },
  { name: '용인', subtitle: '자연과 체험', imagePlaceId: 'p3' },
  { name: '천안', subtitle: '역사와 미식', imagePlaceId: 'p2' },
  { name: '경기', subtitle: '자연과 체험의 하루', imagePlaceId: 'p3' },
  { name: '인천', subtitle: '개항장의 역사와 바다', imagePlaceId: 'p4' },
  { name: '서울', subtitle: '골목마다 새로운 발견', imagePlaceId: 'p1' },
  { name: '제주', subtitle: '자연과 함께 쉬어가기', imagePlaceId: 'p3' },
  { name: '부산', subtitle: '바다를 품은 오후', imagePlaceId: 'p4' },
  { name: '강릉', subtitle: '커피와 산책의 시간', imagePlaceId: 'p5' },
  { name: '전주', subtitle: '골목의 맛과 여유', imagePlaceId: 'p6' }
];

const transportOptions = ['도보', '대중교통', '도보', '자동차', '도보', '도보'];
const travelCourses = courses.map((course, index) => ({
  ...course, hours: index === 2 ? 3 : 2, transport: transportOptions[index], maxPeople: index === 2 ? 6 : 4,
  tags: [...new Set(course.stopIds.flatMap(id => places.find(place => place.id === id).tags))], author: 'coursepick', isSample: true
}));
export { places, travelCourses, themes, regions, quickCategories };
// TourAPI 장소 ID를 참조하는 검토용 코스. 시간은 계획 예시이며 동선은 직선 연결입니다.
export const tourApiCourses = [
  {
    "id": "tour-course-01",
    "name": "충무공 이순신 동상에서 세종대왕 동상까지",
    "region": "서울",
    "theme": "가까운 명소와 미식",
    "stopIds": [
      "tourapi_1364975",
      "tourapi_2789182",
      "tourapi_1364932",
      "tourapi_134752"
    ],
    "imagePlaceId": "tourapi_1364975",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "역사문화",
      "관람",
      "도심",
      "미식",
      "일식",
      "한식"
    ],
    "description": "충무공 이순신 동상 → 동경우동(점심) → 세종대왕 동상 → 미진(저녁). 메뉴를 근거로 식사 후보를 선정했습니다. 운영시간과 휴무일은 방문 전에 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 0.67,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-course-02",
    "name": "개항장 옛 은행에서 홍예문까지",
    "region": "인천",
    "theme": "가까운 명소와 미식",
    "stopIds": [
      "tourapi_945221",
      "tourapi_2845309",
      "tourapi_944855",
      "tourapi_2845021"
    ],
    "imagePlaceId": "tourapi_945221",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "역사문화",
      "건축",
      "관람",
      "미식",
      "일식",
      "도심",
      "한식"
    ],
    "description": "(구)인천일본제58은행지점 → 신신분식(점심) → 홍예문 → 경인면옥(저녁). 메뉴를 근거로 식사 후보를 선정했습니다. 운영시간과 휴무일은 방문 전에 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 1.08,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-course-03",
    "name": "인천중구청(구 인천부 청사)에서 구 인천우체국까지",
    "region": "인천",
    "theme": "가까운 명소와 미식",
    "stopIds": [
      "tourapi_945513",
      "tourapi_2765489",
      "tourapi_1619608",
      "tourapi_2845021"
    ],
    "imagePlaceId": "tourapi_945513",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "역사문화",
      "관람",
      "도심",
      "미식",
      "중식",
      "건축",
      "한식"
    ],
    "description": "인천중구청(구 인천부 청사) → 공화춘(점심) → 구 인천우체국 → 경인면옥(저녁). 메뉴를 근거로 식사 후보를 선정했습니다. 운영시간과 휴무일은 방문 전에 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 1.46,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-course-04",
    "name": "상수동 카페거리에서 망원정 터까지",
    "region": "서울",
    "theme": "가까운 명소와 미식",
    "stopIds": [
      "tourapi_2500207",
      "tourapi_2871395",
      "tourapi_127307",
      "tourapi_2853824"
    ],
    "imagePlaceId": "tourapi_2500207",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "커피",
      "산책",
      "야경",
      "미식",
      "한식",
      "역사문화",
      "전망",
      "기타음식"
    ],
    "description": "상수동 카페거리 → 합정옥(점심) → 망원정 터 → 크레이지카츠(저녁). 메뉴를 근거로 식사 후보를 선정했습니다. 운영시간과 휴무일은 방문 전에 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 1.92,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-course-05",
    "name": "북악산에서 사직공원(서울)까지",
    "region": "서울",
    "theme": "가까운 명소와 미식",
    "stopIds": [
      "tourapi_809190",
      "tourapi_2608933",
      "tourapi_127942",
      "tourapi_2789182"
    ],
    "imagePlaceId": "tourapi_809190",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "자연",
      "등산",
      "전망",
      "역사문화",
      "미식",
      "기타음식",
      "산책",
      "도심",
      "일식"
    ],
    "description": "북악산 → [백년가게]신안촌(점심) → 사직공원(서울) → 동경우동(저녁). 메뉴를 근거로 식사 후보를 선정했습니다. 운영시간과 휴무일은 방문 전에 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 2.94,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-5-all-1",
    "name": "광주광역시 · 정엄정려비에서 충장로까지",
    "region": "광주광역시",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_127065",
      "tourapi_2665091",
      "tourapi_1330521",
      "tourapi_2665107"
    ],
    "imagePlaceId": "tourapi_127065",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "역사문화",
      "미식",
      "한식",
      "자연",
      "체험",
      "기타음식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 0.98,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-5-all-2",
    "name": "광주광역시 · 선교기념비에서 광주 경찰충혼탑까지",
    "region": "광주광역시",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_127062",
      "tourapi_2664683",
      "tourapi_128158",
      "tourapi_2837756"
    ],
    "imagePlaceId": "tourapi_127062",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "관광",
      "미식",
      "양식",
      "산책",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 1.12,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-5-all-3",
    "name": "광주광역시 · 관덕정의 각궁에서 원각사(광주)까지",
    "region": "광주광역시",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_127069",
      "tourapi_2837756",
      "tourapi_346906",
      "tourapi_2665107"
    ],
    "imagePlaceId": "tourapi_127069",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "산책",
      "미식",
      "한식",
      "관광",
      "기타음식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 1.4,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-5-all-4",
    "name": "광주광역시 · 충민사에서 동리단길 카페거리까지",
    "region": "광주광역시",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_126385",
      "tourapi_2891314",
      "tourapi_2565865",
      "tourapi_2664916"
    ],
    "imagePlaceId": "tourapi_126385",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "관람",
      "미식",
      "한식",
      "산책",
      "역사문화"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 3.97,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-5-all-5",
    "name": "광주광역시 · 월계동장고분에서 무양서원까지",
    "region": "광주광역시",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_129200",
      "tourapi_2855279",
      "tourapi_129201",
      "tourapi_2855179"
    ],
    "imagePlaceId": "tourapi_129200",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "관람",
      "미식",
      "기타음식",
      "관광"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 4.69,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-31-23-1",
    "name": "용인 · 양지근린공원에서 양지향교까지",
    "region": "용인",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2735015",
      "tourapi_2844854",
      "tourapi_1954243",
      "tourapi_2757208"
    ],
    "imagePlaceId": "tourapi_2735015",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "자연",
      "산책",
      "미식",
      "기타음식",
      "역사문화",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 1.23,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-31-23-2",
    "name": "용인 · 동백호수공원에서 용인 구갈레스피아까지",
    "region": "용인",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2734944",
      "tourapi_2859543",
      "tourapi_2666534",
      "tourapi_2844825"
    ],
    "imagePlaceId": "tourapi_2734944",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "자연",
      "산책",
      "미식",
      "기타음식",
      "역사문화",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 3.18,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-31-23-3",
    "name": "용인 · 정암수목공원에서 심곡서원까지",
    "region": "용인",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2732194",
      "tourapi_2843669",
      "tourapi_231916",
      "tourapi_2845572"
    ],
    "imagePlaceId": "tourapi_2732194",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "자연",
      "산책",
      "체험",
      "미식",
      "한식",
      "역사문화",
      "기타음식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 3.64,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-31-23-4",
    "name": "용인 · 미륵사(용인)에서 광교산 형제봉까지",
    "region": "용인",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2757161",
      "tourapi_2751597",
      "tourapi_3033248",
      "tourapi_2844808"
    ],
    "imagePlaceId": "tourapi_2757161",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "역사문화",
      "미식",
      "기타음식",
      "자연",
      "산책",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 4.62,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-31-23-5",
    "name": "용인 · 장욱진 고택에서 죽전중앙공원까지",
    "region": "용인",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2612877",
      "tourapi_2844564",
      "tourapi_2733838",
      "tourapi_2841295"
    ],
    "imagePlaceId": "tourapi_2612877",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "역사문화",
      "관람",
      "미식",
      "한식",
      "산책",
      "중식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 5.19,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-34-12-1",
    "name": "천안 · 누리마루숲에서 천안향교까지",
    "region": "천안",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2820068",
      "tourapi_2868892",
      "tourapi_1626896",
      "tourapi_2857349"
    ],
    "imagePlaceId": "tourapi_2820068",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "자연",
      "미식",
      "중식",
      "역사문화",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 2.08,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-34-12-2",
    "name": "천안 · 조병옥박사 생가지에서 천안 병천순대거리까지",
    "region": "천안",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_1626846",
      "tourapi_2850416",
      "tourapi_699587",
      "tourapi_699586"
    ],
    "imagePlaceId": "tourapi_1626846",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "관광",
      "미식",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 2.57,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-34-12-3",
    "name": "천안 · 불당동 유적공원 (선사유적지 공원)에서 에코힐링 황톳길까지",
    "region": "천안",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2758500",
      "tourapi_2734949",
      "tourapi_2606914",
      "tourapi_2767574"
    ],
    "imagePlaceId": "tourapi_2758500",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "산책",
      "미식",
      "한식",
      "양식",
      "자연",
      "관람"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 3.81,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-34-12-4",
    "name": "천안 · 충청남도 안전체험관에서 태조산 공원까지",
    "region": "천안",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_2393927",
      "tourapi_2868892",
      "tourapi_3067406",
      "tourapi_2857349"
    ],
    "imagePlaceId": "tourapi_2393927",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "체험",
      "미식",
      "중식",
      "산책",
      "관람",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 5.82,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "tour-34-12-5",
    "name": "천안 · 박문수묘에서 고령박씨종중재실까지",
    "region": "천안",
    "theme": "명소와 미식",
    "stopIds": [
      "tourapi_127626",
      "tourapi_2857580",
      "tourapi_250303",
      "tourapi_699586"
    ],
    "imagePlaceId": "tourapi_127626",
    "hours": 9,
    "transport": "자동차",
    "maxPeople": 6,
    "tags": [
      "역사문화",
      "미식",
      "한식"
    ],
    "description": "오전 일정 → 점심 → 오후 일정 → 저녁. 메뉴와 가까운 좌표를 기준으로 구성한 계획 예시입니다. 영업시간·휴무일을 확인하세요.",
    "author": "coursepick",
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 6.04,
    "schedule": [
      {
        "label": "오전 일정",
        "time": "10:00",
        "duration": "90분"
      },
      {
        "label": "점심식사",
        "time": "12:00",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "120분"
      },
      {
        "label": "저녁식사",
        "time": "18:00",
        "duration": "60분"
      }
    ]
  },

  {
    "id": "jucance-seoul-gallery",
    "name": "인사동 전통주와 광화문 산책",
    "region": "서울",
    "theme": "주캉스 · 전통주와 미식",
    "description": "전통주갤러리 → 꽃,밥에피다 → 세종대왕 동상 → 옛날집낙원아구찜. 전통주 문화 탐방과 가까운 식사·산책을 연결한 계획 예시입니다. 예약·시음 가능 여부와 영업시간은 방문 전 확인하세요.",
    "stopIds": [
      "tourapi_2390748",
      "tourapi_2708791",
      "tourapi_1364932",
      "tourapi_697191"
    ],
    "imagePlaceId": "tourapi_2390748",
    "tags": [
      "주캉스",
      "전통주",
      "체험",
      "시음",
      "미식",
      "골목"
    ],
    "author": "coursepick",
    "hours": 7,
    "transport": "대중교통",
    "maxPeople": 6,
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 2.04,
    "schedule": [
      {
        "label": "전통주 문화 탐방",
        "time": "11:00",
        "duration": "60분"
      },
      {
        "label": "점심식사",
        "time": "12:30",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "90분"
      },
      {
        "label": "저녁식사",
        "time": "17:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "jucance-incheon-brewery",
    "name": "인천 양조장에서 개항장까지",
    "region": "인천",
    "theme": "주캉스 · 전통주와 미식",
    "description": "술작가 양조장 → 문화반점 → 홍예문 → 잉글랜드왕돈까스. 전통주 문화 탐방과 가까운 식사·산책을 연결한 계획 예시입니다. 예약·시음 가능 여부와 영업시간은 방문 전 확인하세요.",
    "stopIds": [
      "tourapi_3354017",
      "tourapi_2835427",
      "tourapi_944855",
      "tourapi_2769476"
    ],
    "imagePlaceId": "tourapi_3354017",
    "tags": [
      "주캉스",
      "전통주",
      "양조장",
      "미식",
      "골목"
    ],
    "author": "coursepick",
    "hours": 7,
    "transport": "대중교통",
    "maxPeople": 6,
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 1.77,
    "schedule": [
      {
        "label": "전통주 문화 탐방",
        "time": "11:00",
        "duration": "60분"
      },
      {
        "label": "점심식사",
        "time": "12:30",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "90분"
      },
      {
        "label": "저녁식사",
        "time": "17:00",
        "duration": "60분"
      }
    ]
  },
  {
    "id": "jucance-seoul-chunpung",
    "name": "춘풍양조장과 서울 골목 미식",
    "region": "서울",
    "theme": "주캉스 · 전통주와 미식",
    "description": "춘풍양조장 → 백제삼계탕 → 신당동 떡볶이타운 → 개화. 전통주 문화 탐방과 가까운 식사·산책을 연결한 계획 예시입니다. 예약·시음 가능 여부와 영업시간은 방문 전 확인하세요.",
    "stopIds": [
      "tourapi_3463600",
      "tourapi_133858",
      "tourapi_699249",
      "tourapi_134746"
    ],
    "imagePlaceId": "tourapi_3463600",
    "tags": [
      "주캉스",
      "전통주",
      "양조장",
      "막걸리",
      "체험",
      "시음",
      "미식",
      "골목"
    ],
    "author": "coursepick",
    "hours": 7,
    "transport": "대중교통",
    "maxPeople": 6,
    "isSample": true,
    "source": "tourapi",
    "straightLineKm": 8.06,
    "schedule": [
      {
        "label": "전통주 문화 탐방",
        "time": "11:00",
        "duration": "60분"
      },
      {
        "label": "점심식사",
        "time": "12:30",
        "duration": "60분"
      },
      {
        "label": "오후 일정",
        "time": "14:00",
        "duration": "90분"
      },
      {
        "label": "저녁식사",
        "time": "17:00",
        "duration": "60분"
      }
    ]
  }

];
