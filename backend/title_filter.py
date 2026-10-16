from fastapi import HTTPException
from korcen import korcen


def validate_course_title(title):
    if not isinstance(title, str) or not title.strip():
        raise HTTPException(
            status_code=422,
            detail="코스 제목을 입력해 주세요."
        )

    try:
        blocked = korcen.check(title.strip())
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="제목을 확인하지 못했습니다. 잠시 후 다시 시도해주세요."
        ) from None

    if blocked:
        raise HTTPException(
            status_code=422,
            detail="제목에 사용할 수 없는 표현이 포함되어 있어요."
        )