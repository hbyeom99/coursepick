# 배포 흐름 (2026-10-21)

- 저장소: https://github.com/hbyeom99/coursepick.git, 운영 브랜치: main
- 웹: coursepick-web / Vite / 저장소 루트 / 기본 빌드 설정 유지
- API: coursepick-api / FastAPI / backend / 기본 빌드 설정 유지
- 관련 수정은 모아서 한 번 커밋·푸시한다. 자동 푸시는 하지 않는다.
- npm package-lock.json과 기존 설치·빌드 설정을 유지한다. pnpm 전환을 하지 않는다.
- 캐시 삭제 또는 강제 무캐시 배포를 하지 않는다.
- API의 Ignored Build Step은 backend 폴더에서 아래 명령을 실행한다.

```sh
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then exit 1; fi; git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- .
```

이전 성공 배포와 API 폴더가 같으면 빌드를 생략한다. 이전 커밋이 없거나 비교가 실패하면 생략하지 않고 빌드한다. 공용 코드를 backend 밖으로 옮기면 의존 경로도 이 조건에 추가해야 한다. 기존 Root Directory의 변경 없는 프로젝트 생략 옵션은 유지한다.

배포 전에는 변경 범위에 필요한 테스트와 빌드를 한 번 수행하고, 배포 후에는 두 프로젝트의 커밋·Ready 상태와 웹/API 기본 응답을 확인한다. DB 스키마·회원 정보·환경변수 값은 이 배포 과정에서 변경하지 않는다.
