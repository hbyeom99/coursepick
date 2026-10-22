# 간략 배포 흐름 (2026-10-22)

저장소: https://github.com/hbyeom99/coursepick.git / 운영 브랜치 main.
웹은 coursepick-web(Vite, 저장소 루트), API는 coursepick-api(FastAPI, backend)다.

## 다음 배포의 기본 순서

1. 변경 범위와 Git 상태를 한 번 확인한다. 관련 파일만 선정하고 무관한 변경은 보존한다.
2. 웹 소스가 바뀌면 기존 npm run build를 한 번 실행한다. API가 바뀌면 관련 모의 DB 테스트를 한 번 실행한다. 문서만 바뀌면 앱 빌드·브라우저 검증은 반복하지 않는다. 사용자의 검증 생략 지시를 따른다.
3. 사용자가 푸시를 요청했을 때만 관련 파일을 명시적으로 스테이징하고 한 번 커밋·푸시한다. git add . / 강제 푸시는 사용하지 않는다.
4. 아래 통합 조회로 필요한 프로젝트의 배포 상태와 두 운영 주소 응답을 함께 확인한다. pending인 경우에만 15~30초 간격으로 다시 조회한다. 실패·미확인일 때 대시보드로 이동한다.

기존 설치·프레임워크·Root Directory·환경변수·npm package-lock.json·빌드 캐시를 유지한다. 재설치나 캐시 삭제를 기본 절차에 넣지 않는다. DB 변경, 회원 저장 테스트, 앱 번들 구조 변경은 이 배포 설정 작업에 포함하지 않는다.

## Vercel에 저장한 빌드 생략 조건

웹 / 저장소 루트에서 실행:

```sh
test -n "$VERCEL_GIT_PREVIOUS_SHA" && git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . ":!backend" ":!docs" ":!AGENTS.md" ":!README.md" ":!DEPLOYMENT.*" ":!tools/deployment_status.py"
```

API / backend에서 실행:

```sh
test -n "$VERCEL_GIT_PREVIOUS_SHA" && git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . ":!*.md" ":!docs"
```

명령 종료 코드 0은 생략, 1 이상은 빌드다. 이전 성공 커밋이 없거나 비교에 실패하면 빌드한다. 앱 소스·이미지·패키지·설정 변경은 웹 빌드 대상이며, API·문서만 변경된 경우 웹 빌드를 생략한다. API 내부 Markdown·docs 변경도 빌드를 생략한다. 공용 코드가 새 경로로 이동하거나 제외한 파일을 앱에서 읽게 되면 조건을 먼저 수정한다. 환경변수·빌드 설정 변경 시에는 소스 비교만 믿지 말고 해당 프로젝트의 명시적 재배포가 필요하다.

## 배포 상태 통합 조회

Python 표준 라이브러리만 사용하며 신규 패키지·토큰이 필요 없다. 저장소의 공개 GitHub 상태 API와 공개 웹/API health만 조회한다. DB 조회·쓰기·커밋·푸시는 하지 않는다.

```powershell
python tools/deployment_status.py
python tools/deployment_status.py --commit HEAD --expect coursepick-web
python tools/deployment_status.py --commit HEAD --expect coursepick-api
python tools/deployment_status.py --commit HEAD --expect none
```

기본값은 웹과 API 모두 배포를 기대한다. 웹만 수정하면 web, API만 수정하면 api, 문서만 수정하면 none을 사용한다. 실제 명령의 프로젝트 이름은 위 예시처럼 coursepick-web / coursepick-api다.

종료 코드: 0=기대한 프로젝트 GitHub 상태 성공 및 공개 응답 정상, 1=실패, 2=진행 중·취소·건너뛰기·미확인. none은 공개 응답만 판정하며 새 배포가 생겼다고 주장하지 않는다. 건너뛴 프로젝트가 이전 커밋에 남는 것은 정상이다.

GitHub 상태는 해당 커밋의 이력이며 현재 운영 도메인의 커밋을 보증하지 않는다. 두 주소 HTTP 200도 기능 전체 정상의 증거는 아니다. 운영 커밋을 정확히 확인해야 하거나 취소/건너뛰기 상태가 모호하면 Vercel 대시보드로 확인한다. 공개 상태 API의 제한·권한 변경·통신 오류는 미확인으로 보고하며 성공으로 처리하지 않는다.
