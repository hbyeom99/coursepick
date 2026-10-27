"""Stable six-character room invitations backed by the existing invitation table."""
import hashlib,hmac,string
from datetime import datetime,timedelta,timezone
ALPHABET=string.ascii_uppercase+string.digits

def candidate_code(room_id,secret,attempt=0):
 digest=hmac.new(secret.encode(),f'zip-code:{room_id}:{attempt}'.encode(),hashlib.sha256).digest()
 # Guarantee both letters and digits; the remaining positions use the full alphabet.
 return chr(65+digest[0]%26)+str(digest[1]%10)+''.join(ALPHABET[b%36] for b in digest[2:6])

def room_invite_code(client,execute,room_id,user_id,secret):
 for attempt in range(32):
  code=candidate_code(room_id,secret,attempt);hashed=hashlib.sha256(code.encode()).hexdigest()
  rows=execute(client.table('zip_room_invites').select('*').eq('token_hash',hashed).limit(1))
  if rows:
   row=rows[0]
   if row['room_id']!=room_id or row.get('recipient_id'):continue
   if datetime.fromisoformat(row['expires_at'].replace('Z','+00:00'))<=datetime.now(timezone.utc):
    row=execute(client.table('zip_room_invites').update({'expires_at':(datetime.now(timezone.utc)+timedelta(days=7)).isoformat()}).eq('id',row['id']))[0]
   return {'inviteId':row['id'],'token':code,'code':code,'expiresAt':row['expires_at']}
  try:
   row=execute(client.table('zip_room_invites').insert({'room_id':room_id,'created_by':user_id,'token_hash':hashed}))[0]
  except Exception:
   # A concurrent member may have created this exact code first.
   rows=execute(client.table('zip_room_invites').select('*').eq('token_hash',hashed).limit(1))
   if not rows:raise
   row=rows[0]
   if row['room_id']!=room_id or row.get('recipient_id'):continue
  return {'inviteId':row['id'],'token':code,'code':code,'expiresAt':row['expires_at']}
 raise ValueError('초대 코드를 생성하지 못했습니다. 다시 시도해 주세요.')
