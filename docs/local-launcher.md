# 로컬 원터치 실행

프로젝트 폴더의 `coursepick 실행.cmd`를 더블클릭합니다.

1. 기존 Node/Python 및 설치된 패키지를 확인합니다. 패키지를 자동 설치하지 않습니다.
2. 백엔드(127.0.0.1:8000)와 Vite(127.0.0.1:5173)를 실행합니다.
3. 두 서버의 정상 응답을 확인한 후 http://localhost:5173/ 을 기본 브라우저로 엽니다.

이미 정상 실행 중인 서버는 재사용합니다. 다른 프로그램이 같은 포트를 쓰면 종료시키지 않고 오류를 안내합니다. 서버는 숨김 창에서 실행되므로 실행 파일 창을 닫아도 계속 동작합니다. 부팅 시 자동 실행 설정은 추가하지 않습니다.

오류 로그는 `outputs/local-servers/api.stderr.log`, `web.stderr.log`에 있습니다. 로그나 환경변수 파일은 외부에 공유하지 마세요. `.env.local`과 `backend/.env`는 기존 설정을 사용하며 실행 파일에 키를 넣지 않습니다.

Python은 프로젝트의 `.venv`, `backend/.venv`, `work/backend-venv`, 이 PC의 기존 backend-venv, 번들 Python 순으로 확인합니다. 다른 PC에서는 기존 패키지가 설치된 가상환경을 프로젝트 `.venv`에 준비해야 합니다.

개발 점검: `powershell -NoProfile -File tools/start-local.ps1 -CheckOnly`는 서버나 브라우저를 열지 않고 실행 환경만 확인합니다. `-NoBrowser`는 서버만 시작합니다.
