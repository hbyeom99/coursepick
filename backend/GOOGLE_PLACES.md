# Google Places 보조 조회 — 로컬 구현

기존 장소 DB·자체 태그·코스 4축 계산은 유지한다. 장소 상세의 링크로 별도 문서를 열며 이 문서는 MemberGate/App/카카오 지도를 로딩하지 않는다. 사용자 버튼으로만 Google을 조회하고, 후보 장소를 직접 확인한 뒤 상세를 요청한다.

## 필요한 설정

1. Google Cloud 프로젝트에서 결제 연결 및 Places API (New) 활성화.
2. 서버 전용 키를 생성하고 API 제한을 Places API (New)로 지정. 로컬 서버의 고정 외부 IP를 사용할 수 있다면 해당 IP로 제한. 브라우저용 HTTP referrer 키를 서버 요청에 사용하지 않는다.
3. Coursepick/backend/.env 에 GOOGLE_PLACES_API_KEY=실제값 추가. 채팅·VITE_ 변수·Git에 키를 넣지 않는다.
4. Google Cloud의 해당 SKU 사용량/쿼터를 확인한다. 예산 알림은 지출 자동 중단 장치가 아니다. 프로세스별 30회/분 제한은 다중 인스턴스 전체 비용 상한을 보장하지 않는다.
5. 설정 후 명시적으로 조회하여 후보 매칭·전화·운영시간·출처를 실응답으로 확인한다. 현재 실제 호출은 키 미설정으로 보류.

## 데이터 및 호출 범위

- 검색: 기존 places 행의 이름·주소·지역으로 Text Search (New), 최대 후보 3개. Google 응답의 ID·이름·주소·제공자 출처만 화면으로 반환.
- 상세: 검색에서 발급한 10분 HMAC 티켓으로만 요청. 임의 Google ID 상세 조회를 막는다.
- 상세 필드: 이름·주소·전화·정규 운영시간·Google Maps 링크·제공자 출처. 필드 마스크를 고정한다. 요금은 호출 API/요청 필드/SKU에 따라 다르며 무료로 가정하지 않는다.
- 자동 매칭·대량 수집·사진·리뷰·평점·LLM 요약·RAG 저장 없음.
- Google 콘텐츠를 DB/파일/브라우저 저장소에 기록하지 않는다. 후보·상세는 현재 탭의 메모리에만 둔다. Cache-Control: no-store. upstream 오류 본문/키는 사용자 응답이나 로그에 복사하지 않는다.
- 이번 단계는 Google ID의 영구 매핑 테이블도 만들지 않는다. 독립 DB 장소 ID에서 사용자 요청마다 보조 조회한다. 이후 관리자가 확인한 ID만 영구 연결하려면 ID 전용 매핑과 갱신 흐름을 별도 추가한다.

## 검증 및 미완료

프런트 빌드 통과(기존 대형 번들 경고 유지). 백엔드 96개 중 95 통과·기존 제외 1. 새 테스트 6개는 키 없음/티켓 변조·만료/미등록 장소/반환 필드/쓰기 없음/서명 검사를 모의 검증한다. 브라우저에서 기존 장소 링크, 지도 없는 문서, 키 미설정 안내 확인. 실제 Google 결과·매칭 품질·과금·출처 데이터는 키 설정 후 검증이 필요하다.

공개 운영 전에는 앱의 공개 이용약관·개인정보처리방침에 Google 사용과 데이터 전달 범위를 반영하고 공식 출처 표시 기준을 재확인한다. Google 약관 링크만 두는 것이 코스픽 자체 정책 문서를 대체하지 않는다. 로컬만 수정했으며 배포·Git push·DB 변경 없음.

공식 문서:
- https://developers.google.com/maps/documentation/places/web-service/text-search
- https://developers.google.com/maps/documentation/places/web-service/place-details
- https://developers.google.com/maps/documentation/places/web-service/policies
- https://cloud.google.com/maps-platform/terms/maps-service-terms

## 키 설정 후 확인 (2026-10-21)
서버 키 설정 여부만 확인했고 값은 출력하지 않았다. 기존 DB 장소 1곳으로 Text Search 성공 및 후보 1개 반환을 확인했다. 브라우저에서 후보 선택 후 상세 이름·주소·운영시간·Google Maps 링크·Google Maps 출처 표시를 확인했다. 전화번호 미제공 시 해당 항목은 표시하지 않는다. 콘솔 오류 없음. Google 콘텐츠는 검증 문서나 파일에 복사하지 않았으며 DB 쓰기·배포 없음. 다른 장소의 매칭 품질과 과금 한도는 별도 확인 대상이다.
