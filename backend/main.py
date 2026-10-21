from course_traits import evaluate_course_traits,course_trait_affinity
import os
import json
import math
import re
from pathlib import Path

from dotenv import dotenv_values
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from supabase.client import ClientOptions
from place_queries import place_client, recommendation_candidates, recommendation_cache, region_place_cache

app = FastAPI(title="coursepick Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/places")
def get_places(ids: str | None = None, offset: int = 0, limit: int | None = None, region: str | None = None, category: str | None = None):
    if offset < 0 or (limit is not None and not 1 <= limit <= 500):
        raise HTTPException(status_code=422, detail="잘못된 장소 페이지 범위입니다.")
    # Deployment environment variables take precedence over the local backend/.env.
    config = dotenv_values(Path(__file__).with_name(".env"), interpolate=False)
    url = (os.environ.get("SUPABASE_URL", config.get("SUPABASE_URL")) or "").strip()
    key = (os.environ.get("SUPABASE_SERVICE_KEY", config.get("SUPABASE_SERVICE_KEY")) or "").strip()
    if not url or not key:
        raise HTTPException(status_code=503, detail="서버 환경변수 또는 backend/.env에 Supabase 설정이 필요합니다.")

    try:
        options = ClientOptions(
            persist_session=False,
            auto_refresh_token=False,
            postgrest_client_timeout=10,
        )
        client = create_client(url, key, options=options)
        places = []
        page_size = limit or 1000
        # Supabase limits each response; fetch all pages in a stable order.
        while True:
            request = client.table("places").select("*")
            if ids:
                selected_ids = list(dict.fromkeys(ids.split(",")))
                if len(selected_ids) > 200:
                    raise ValueError("Too many requested place IDs")
                request = request.in_("id", selected_ids)
            else:
                request = request.not_.like("id", "lodgingcsv_%")
            if region:
                request = request.eq('region', region)
            if category:
                request = request.eq('category', category)
            response = request.order("id").range(offset, offset + page_size - 1).execute()
            rows = response.data
            places.extend(rows)
            if limit is not None or len(rows) < page_size:
                break
            offset += len(rows)
        return places
    except Exception:
        # Never send database exception text or server credentials to the browser.
        raise HTTPException(status_code=502, detail="장소 목록을 조회하지 못했습니다.") from None


@app.get("/api/places/{id}")
def get_place(id: str):
    config = dotenv_values(Path(__file__).with_name(".env"), interpolate=False)
    url = (os.environ.get("SUPABASE_URL", config.get("SUPABASE_URL")) or "").strip()
    key = (os.environ.get("SUPABASE_SERVICE_KEY", config.get("SUPABASE_SERVICE_KEY")) or "").strip()
    if not url or not key:
        raise HTTPException(status_code=503, detail="서버 환경변수 또는 backend/.env에 Supabase 설정이 필요합니다.")

    try:
        options = ClientOptions(
            persist_session=False,
            auto_refresh_token=False,
            postgrest_client_timeout=10,
        )
        client = create_client(url, key, options=options)
        response = client.table("places").select("*").eq("id", id).limit(1).execute()
    except Exception:
        raise HTTPException(status_code=502, detail="장소 정보를 조회하지 못했습니다.") from None

    if not response.data:
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
    return response.data[0]


@app.get("/api/recommendations")
def get_recommendations(
    region: str | None = None,
    category: str | None = None,
    tag: str | None = None,
):
    region = (region or "").strip()
    category = (category or "").strip()
    tag = (tag or "").strip()
    try:
        places = recommendation_cache.read((region, category, tag),
            lambda: recommendation_candidates(place_client(), region, category, tag))
    except Exception:
        raise HTTPException(502, '추천 장소를 조회하지 못했습니다.') from None

    def ranking(place):
        raw_rating = place.get("rating")
        rating = float(raw_rating) if isinstance(raw_rating, (int, float)) else 0.0
        score = rating
        if region and place.get("region") == region:
            score += 3
        if category and place.get("category") == category:
            score += 3
        if tag and tag in (place.get("tags") or []):
            score += 2
        # Resolve equal scores by rating, then id for predictable ordering.
        return (-score, -rating, str(place.get("id", "")))

    return sorted(places, key=ranking)[:6]


@app.get("/api/driving-route")
def driving_route(ids: str):
    import json
    import math
    from urllib.parse import urlencode
    from urllib.request import Request, urlopen

    stop_ids = ids.split(",")
    round_trip = len(stop_ids) >= 4 and stop_ids[0] == stop_ids[-1] and len(set(stop_ids[:-1])) == len(stop_ids) - 1
    if not 2 <= len(stop_ids) <= (9 if round_trip else 7) or any(not id.strip() for id in stop_ids) or (len(set(stop_ids)) != len(stop_ids) and not round_trip):
        raise HTTPException(status_code=400, detail="장소 2~9개가 필요하며, 숙소 출발·복귀 외 중복은 허용하지 않습니다.")
    config = dotenv_values(Path(__file__).with_name(".env"), interpolate=False)
    key = (os.environ.get("KAKAO_MOBILITY_REST_API_KEY", config.get("KAKAO_MOBILITY_REST_API_KEY")) or "").strip()
    if not key:
        raise HTTPException(status_code=503, detail="Backend 길찾기 REST API 키 설정이 필요합니다.")
    catalog = {place["id"]: place for place in get_places(",".join(dict.fromkeys(stop_ids)))}
    if any(id not in catalog for id in stop_ids):
        raise HTTPException(status_code=404, detail="길찾기 장소를 찾을 수 없습니다.")
    stops = [catalog[id] for id in stop_ids]
    if round_trip and stops[0].get("category") != "숙소":
        raise HTTPException(status_code=400, detail="출발·복귀 지점은 같은 숙소여야 합니다.")
    for place in stops:
        lat, lon = place.get("latitude"), place.get("longitude")
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)) or not math.isfinite(lat) or not math.isfinite(lon) or not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise HTTPException(status_code=400, detail="장소 좌표를 확인해 주세요.")
    coordinate = lambda place: f'{place["longitude"]},{place["latitude"]}'
    try:
        # At most five waypoints per request; overlap a boundary, not a visit.
        chunks = [stops] if len(stops) <= 7 else [stops[:7], stops[6:]]
        sections = []
        for chunk in chunks:
            query = urlencode({"origin": coordinate(chunk[0]), "destination": coordinate(chunk[-1]), "waypoints": "|".join(map(coordinate, chunk[1:-1])), "summary": "false", "priority": "RECOMMEND"})
            request = Request("https://apis-navi.kakaomobility.com/v1/directions?" + query, headers={"Authorization": "KakaoAK " + key})
            with urlopen(request, timeout=15) as response:
                route = json.load(response)["routes"][0]
            if route["result_code"] != 0:
                raise ValueError("route unavailable")
            sections.extend(route["sections"])
        if len(sections) != len(stops) - 1:
            raise ValueError("incomplete sections")
        segments = []
        paths = []
        for index, section in enumerate(sections):
            points = []
            for road in section.get("roads", []):
                vertices = road.get("vertexes", [])
                if len(vertices) % 2: raise ValueError("invalid vertices")
                points.extend({"longitude": vertices[i], "latitude": vertices[i+1]} for i in range(0, len(vertices), 2))
            if len(points) < 2: raise ValueError("missing road path")
            paths.append(points)
            segments.append({"fromId": stop_ids[index], "toId": stop_ids[index+1], "durationSeconds": section["duration"], "distanceMeters": section["distance"]})
        return {"stopIds": stop_ids, "durationSeconds": sum(s["durationSeconds"] for s in segments), "distanceMeters": sum(s["distanceMeters"] for s in segments), "segments": segments, "paths": paths}
    except Exception:
        raise HTTPException(status_code=502, detail="자동차 경로를 조회하지 못했습니다. 키와 이용 설정을 확인해 주세요.") from None


@app.get("/api/generated-course")
def generate_course(region: str, tags: str = "", accommodation_id: str | None = None,
                    activity: int = Query(50, ge=0, le=100), space: int = Query(50, ge=0, le=100),
                    environment: int = Query(50, ge=0, le=100), content: int = Query(50, ge=0, le=100),
                    pace: int = Query(50, ge=0, le=100), saved_ids: str = Query("", max_length=10000),
                    include_cafe: bool = False, planning: int | None = Query(None,ge=0,le=100),
                    experience: int | None = Query(None,ge=0,le=100), exploration: int | None = Query(None,ge=0,le=100),
                    spending: int | None = Query(None,ge=0,le=100), known_tags: str = Query("",max_length=2000), known_categories: str = Query("",max_length=500)):
    import math
    import uuid
    region = region.strip()
    interests = set(tag.strip() for tag in tags.split(",") if tag.strip())
    if not region or len(region) > 30 or len(tags) > 300:
        raise HTTPException(status_code=400, detail="지역과 관심 키워드를 확인해 주세요.")
    places = [p for p in region_place_cache.read(region, lambda: get_places(region=region)) if p.get("region") == region and isinstance(p.get("latitude"), (int, float)) and isinstance(p.get("longitude"), (int, float)) and math.isfinite(p["latitude"]) and math.isfinite(p["longitude"])]
    # Count synonymous themes once, consistent with frontend preference scoring.
    groups = {"미식": "음식탐방", "맛집": "음식탐방", "먹방": "음식탐방",
              "등산": "활동", "레저": "활동", "액티비티": "활동", "엑티비티": "활동",
              "체험": "참여체험", "공방": "참여체험", "양조체험": "참여체험",
              "사진": "사진촬영", "포토": "사진촬영",
              "캠핑": "캠핑", "야영": "캠핑", "글램핑": "캠핑"}
    interest_groups = {groups.get(tag, tag) for tag in interests}
    saved = set(saved_ids.split(","))
    # Legacy five-axis query parameters remain accepted for old clients, but no longer affect scoring.
    targets=dict(planning=planning,experience=experience,exploration=exploration,spending=spending)
    context={'knownPlaceIds':list(saved),'knownTags':[v for v in known_tags.split(',') if v],'knownCategories':[v for v in known_categories.split(',') if v]}
    place_index={p['id']:p for p in places}
    def affinity(p):
        matched=interest_groups.intersection(groups.get(tag,tag) for tag in (p.get('tags') or []))
        return min(4,len(matched))+(2 if p['id'] in saved else 0)
    def candidate_schedule(stops):
        roles=[('오전 일정','10:00',90),('점심 식사','12:00',60),('오후 일정','14:00',120)]+([('카페·디저트','16:30',60)] if include_cafe else [])+[('저녁 식사','18:00',60)]
        return [{'placeId':p['id'],'label':label,'time':time,'minutes':minutes,'duration':str(minutes)+'분 예상','durationEstimated':True,'timeFlexible':True} for p,(label,time,minutes) in zip(stops,roles)]
    def distance(a, b):
        la, lb = map(math.radians, [a["latitude"], b["latitude"]])
        value = math.sin((lb-la)/2)**2 + math.cos(la)*math.cos(lb)*math.sin(math.radians(a["longitude"]-b["longitude"])/2)**2
        return 12742 * math.asin(math.sqrt(min(1, max(0, value))))
    accommodation = None
    if accommodation_id and accommodation_id.startswith("lodgingcsv_"):
        linked = get_place(accommodation_id)
        if linked.get("category") == "숙소" and (linked.get("region") == region or region + "시" in linked.get("location", "")):
            places.append(linked)
    if accommodation_id:
        accommodation = next((p for p in places if p["id"] == accommodation_id and p.get("category") == "숙소"), None)
        if accommodation is None:
            raise HTTPException(status_code=404, detail="선택한 지역의 숙소를 찾을 수 없습니다.")
        places = [p for p in places if distance(accommodation, p) <= 10]
    sights = sorted([p for p in places if p.get("category") == "관광지"], key=lambda p: (-affinity(p), p["id"]))[:30]
    foods = [p for p in places if p.get("category") == "음식점" and set(p.get("tags") or []).intersection({"한식", "일식", "양식", "중식", "기타음식"}) and "분류미확인" not in (p.get("tags") or [])]
    cafes = [p for p in places if p.get("category") == "카페"]
    best = None
    for i, a in enumerate(sights):
        for b in sights[i+1:]:
            if not 0.15 < distance(a, b) <= 5: continue
            nearby = [p for p in foods if distance(a, p) <= 4 and distance(b, p) <= 4]
            if len(nearby) < 2: continue
            nearby.sort(key=lambda p: (distance(a, p)+distance(b, p)-affinity(p)*0.4, p["id"]))
            lunch, dinner = nearby[:2]
            stops = [a, lunch, b, dinner]
            if include_cafe:
                candidates = [p for p in cafes if distance(b, p) <= 3 and distance(dinner, p) <= 3]
                if not candidates:
                    continue
                cafe = min(candidates, key=lambda p: distance(b, p) + distance(p, dinner) - affinity(p)*0.4)
                stops.insert(3, cafe)
            length = sum(distance(x, y) for x, y in zip(stops, stops[1:]))
            anchor_km = distance(accommodation, a) + distance(dinner, accommodation) if accommodation else 0
            trial={'stopIds':[p['id'] for p in stops],'schedule':candidate_schedule(stops),'transport':'자동차','durationDays':1}
            assessment=evaluate_course_traits(trial,place_index,context)
            score = sum(affinity(p) for p in stops)*2-length-anchor_km+course_trait_affinity(assessment,targets)*3
            if best is None or score > best[0]: best = (score, stops, length)
    if best is None:
        raise HTTPException(status_code=404, detail="선택한 조건에서 가까운 관광지·식당 조합을 찾지 못했습니다. 카페 포함을 해제하거나 다른 지역을 선택해 주세요.")
    _, stops, length = best
    schedule = candidate_schedule(stops)
    course = {"id": "generated-"+str(uuid.uuid4()), "name": region+" · 나의 맞춤 하루", "region": region, "stopIds": [p["id"] for p in stops], "imagePlaceId": stops[0]["id"], "tags": list(dict.fromkeys(tag for p in stops for tag in (p.get("tags") or []))), "hours": 9, "transport": "자동차", "maxPeople": 6, "author": "coursepick", "theme": "취향과 동선으로 만든 코스", "isSample": True, "source": "tourapi", "straightLineKm": round(length, 2), "schedule": schedule, "description": "관심 키워드·여행 성향·저장한 장소와 가까운 동선을 반영한 당일치기 계획 예시입니다. 영업시간과 휴무일은 확인이 필요합니다."}
    course['traitAssessment']=evaluate_course_traits(course,place_index,context)
    if accommodation:
        course["accommodationId"] = accommodation["id"]
        course["description"] += " 숙소 출발·저녁 이후 복귀를 연결한 하루 일정입니다. 첫날 체크인은 숙소 안내를 확인하세요."
    return {"course": course, "places": stops}


def validate_demo_course(course, place_ids, author_ids):
    # Shared registration validation for the reviewed seed and database reads.
    if not isinstance(course, dict) or course.get("is_demo") is not True:
        raise ValueError("Only demo courses are supported before authentication")
    for field in ["id", "title", "author_id", "region", "description", "transport", "cover_place_id"]:
        if not isinstance(course.get(field), str) or not course[field].strip():
            raise ValueError("Invalid course text field")
    ids = course.get("place_ids")
    if not isinstance(ids, list) or not 2 <= len(ids) <= 7 or not all(isinstance(id, str) for id in ids):
        raise ValueError("Invalid place IDs")
    if len(set(ids)) != len(ids) or not set(ids).issubset(place_ids):
        raise ValueError("Duplicate or unknown place")
    if course["author_id"] not in author_ids or course["cover_place_id"] not in ids:
        raise ValueError("Unknown author or cover place")
    if course["transport"] not in ["도보", "대중교통", "자동차"]:
        raise ValueError("Unknown transport")
    hours = course.get("hours")
    if isinstance(hours, bool) or not isinstance(hours, (int, float)) or not math.isfinite(hours) or not 0 < hours <= 24:
        raise ValueError("Invalid hours")
    tags = course.get("tags")
    if not isinstance(tags, list) or not all(isinstance(tag, str) and tag.strip() for tag in tags) or len(tags) != len(set(tags)):
        raise ValueError("Invalid tags")
    schedule = course.get("schedule")
    if not isinstance(schedule, list) or len(schedule) != len(ids):
        raise ValueError("Invalid schedule length")
    last_end = 0
    last_day = 1
    for id, item in zip(ids, schedule):
        if not isinstance(item, dict) or item.get("place_id") != id or not isinstance(item.get("label"), str) or not item["label"].strip():
            raise ValueError("Invalid schedule order")
        time = item.get("start_time")
        minutes = item.get("duration_minutes")
        if not isinstance(time, str) or not re.fullmatch(r"([01][0-9]|2[0-3]):[0-5][0-9]", time):
            raise ValueError("Invalid visit time")
        if isinstance(minutes, bool) or not isinstance(minutes, int) or not 1 <= minutes <= 1440:
            raise ValueError("Invalid duration")
        day = item.get("day", 1)
        if isinstance(day, bool) or not isinstance(day, int) or not 1 <= day <= 3 or day < last_day or day > last_day + 1:
            raise ValueError("Invalid visit day")
        if day != last_day:
            last_end = 0
            last_day = day
        start = int(time[:2])*60 + int(time[3:])
        if start < last_end or start + minutes > 1440:
            raise ValueError("Overlapping schedule")
        last_end = start + minutes


@app.get("/api/courses")
def get_demo_courses():
    config = dotenv_values(Path(__file__).with_name(".env"), interpolate=False)
    url = (os.environ.get("SUPABASE_URL", config.get("SUPABASE_URL")) or "").strip()
    key = (os.environ.get("SUPABASE_SERVICE_KEY", config.get("SUPABASE_SERVICE_KEY")) or "").strip()
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase 서버 설정이 필요합니다.")
    source = "database"
    try:
        client = create_client(url, key, options=ClientOptions(persist_session=False, auto_refresh_token=False, postgrest_client_timeout=10))
        profiles = client.table("profiles").select("id,nickname,bio,interests,taste,is_demo").eq("is_demo", True).order("id").execute().data
        courses = []
        while True:
            batch = client.table("courses").select("*").eq("is_demo", True).order("id").range(len(courses), len(courses)+999).execute().data
            courses.extend(batch)
            if len(batch) < 1000:
                break
    except Exception as error:
        if getattr(error, "code", None) != "PGRST205":
            raise HTTPException(status_code=502, detail="다른 여행자의 코스를 불러오지 못했습니다.") from None
        # Explicit preview until the SQL migration has been executed.
        seed = json.loads(Path(__file__).with_name("community_courses.json").read_text(encoding="utf-8"))
        profiles, courses, source = seed["profiles"], seed["courses"], "demo-seed"
    try:
        # Validate the exact referenced IDs, including lodgingcsv places excluded from the default catalog.
        referenced_ids = sorted({pid for course in courses for pid in course.get("place_ids", [])})
        place_ids = set()
        for offset in range(0, len(referenced_ids), 200):
            rows = client.table("places").select("id").in_("id", referenced_ids[offset:offset+200]).execute().data
            place_ids.update(row["id"] for row in rows)
        author_ids = {profile["id"] for profile in profiles}
        for course in courses:
            validate_demo_course(course, place_ids, author_ids)
    except ValueError:
        raise HTTPException(status_code=502, detail="코스의 장소·작성자·일정을 확인해 주세요.") from None
    return {"source": source, "profiles": profiles, "courses": courses}


@app.get("/api/courses/{course_id}")
def get_demo_course(course_id: str):
    result = get_demo_courses()
    course = next((course for course in result["courses"] if course["id"] == course_id), None)
    if course is None:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")
    return {"source": result["source"], "course": course,
            "profile": next(profile for profile in result["profiles"] if profile["id"] == course["author_id"])}


@app.get("/api/transit-route")
def transit_route(ids: str):
    from tago_routes import Settings, TagoClient, TransitUnavailable, segment
    stop_ids = ids.split(",")
    if not 2 <= len(stop_ids) <= 9 or any(not i.strip() for i in stop_ids) or any(a == b for a,b in zip(stop_ids,stop_ids[1:])):
        raise HTTPException(status_code=400, detail="이동할 장소 2~9개를 선택해 주세요.")
    config = dotenv_values(Path(__file__).with_name(".env"), interpolate=False)
    key = (os.environ.get("TAGO_API_SERVICE_KEY") or config.get("TAGO_API_SERVICE_KEY") or "").strip()
    if not key:
        raise HTTPException(status_code=503, detail="대중교통 정보를 준비 중입니다. TAGO 서비스 설정이 필요합니다.")
    catalog = {p["id"]:p for p in get_places(",".join(dict.fromkeys(stop_ids)))}
    if any(i not in catalog for i in stop_ids):
        raise HTTPException(status_code=404, detail="이동할 장소를 찾을 수 없습니다.")
    for p in catalog.values():
        if any(not isinstance(p.get(k), (int,float)) or not math.isfinite(p[k]) for k in ("latitude","longitude")):
            raise HTTPException(status_code=400, detail="장소 좌표를 확인해 주세요.")
    try:
        settings = Settings.load(config)
    except (OSError, ValueError, TypeError):
        raise HTTPException(status_code=503, detail="대중교통 조회 설정을 확인해 주세요.") from None
    client = TagoClient(key, settings)
    try:
        segments=[segment(client,catalog[a],catalog[b]) for a,b in zip(stop_ids,stop_ids[1:])]
    except TransitUnavailable as error:
        raise HTTPException(status_code=502, detail=str(error)) from None
    return {"stopIds":stop_ids,"segments":segments,"durationSeconds":sum(s["durationSeconds"] for s in segments),"source":"TAGO","waitingIncluded":False}

from member_accounts import router as member_router
app.include_router(member_router)

# Live place search: separate from the persisted place catalogue.
from kakao_place_search import router as kakao_place_search_router
app.include_router(kakao_place_search_router)

from zip_rooms import router as zip_router
app.include_router(zip_router)
