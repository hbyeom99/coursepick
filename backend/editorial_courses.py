from pathlib import Path
from dotenv import dotenv_values
import os
from fastapi import APIRouter,HTTPException,Response
from place_queries import place_client
router=APIRouter()
@router.get('/api/editorial-courses')
def editorial_courses(response:Response):
 response.headers['Cache-Control']='private, no-store'
 preview=os.environ.get('EDITORIAL_PREVIEW',dotenv_values(Path(__file__).with_name('.env'),interpolate=False).get('EDITORIAL_PREVIEW',''))=='1'
 try:
  db=place_client();query=db.table('editorial_courses').select('*').order('priority').order('id').limit(50)
  query=query.neq('publication_status','archived') if preview else query.eq('publication_status','published')
  rows=query.execute().data
  ids=list({v['place_id'] for c in rows for v in c['days'] if v.get('place_id')})
  places=db.table('places').select('id,name,location,region,image_url,category').in_('id',ids).execute().data if ids else []
  return {'preview':preview,'courses':rows,'places':places}
 except Exception:raise HTTPException(503,'기획 코스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.') from None
