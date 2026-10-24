import json
import os
import unicodedata
from pathlib import Path

from dotenv import dotenv_values
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client
from supabase.client import ClientOptions

router = APIRouter(prefix="/api/search-keywords")
DATA = json.loads(Path(__file__).with_name("home_search_keywords.json").read_text(encoding="utf-8"))


def _key(value: str) -> str:
    return "".join(unicodedata.normalize("NFKC", value).casefold().split())


_ALLOWED = {_key(term): term for terms in DATA.values() for term in terms}


def _client():
    config = dotenv_values(Path(__file__).with_name(".env"), interpolate=False)
    url = (os.environ.get("SUPABASE_URL") or config.get("SUPABASE_URL") or "").strip()
    key = (os.environ.get("SUPABASE_SERVICE_KEY") or config.get("SUPABASE_SERVICE_KEY") or "").strip()
    if not url or not key:
        raise HTTPException(status_code=503, detail="검색어 집계 서버 설정이 필요합니다.")
    try:
        return create_client(url, key, options=ClientOptions(persist_session=False, auto_refresh_token=False, postgrest_client_timeout=8))
    except Exception:
        raise HTTPException(status_code=503, detail="검색어 집계 서버에 연결할 수 없습니다.") from None


class SearchKeyword(BaseModel):
    keyword: str = Field(min_length=1, max_length=80)


@router.get("/popular")
def popular_search_keywords():
    try:
        rows = _client().table("search_keyword_stats").select("keyword,search_count").order("search_count", desc=True).order("keyword").limit(8).execute().data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="검색어 순위를 준비하고 있습니다.") from None
    return {"keywords": [{"keyword": row["keyword"], "count": row["search_count"]} for row in rows]}


@router.post("/record")
def record_search_keyword(body: SearchKeyword):
    keyword = _ALLOWED.get(_key(body.keyword.strip()))
    if not keyword:
        raise HTTPException(status_code=422, detail="허용된 검색 키워드만 집계할 수 있습니다.")
    try:
        _client().rpc("record_search_keyword", {"keyword_value": keyword}).execute()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="검색어 순위를 갱신하지 못했습니다.") from None
    return {"recorded": True}
