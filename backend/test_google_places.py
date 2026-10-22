import unittest
from unittest.mock import patch,MagicMock
from fastapi import HTTPException,Response
import google_places as g
class GoogleTests(unittest.TestCase):
 def test_missing_key_has_no_store(self):
  with patch.dict(g.os.environ,{'GOOGLE_PLACES_API_KEY':''}),patch.object(g,'dotenv_values',return_value={}):
   with self.assertRaises(HTTPException) as e:g.api_key()
   self.assertEqual(e.exception.status_code,503);self.assertIn('no-store',e.exception.headers['Cache-Control'])
 def test_ticket_tamper_expiry(self):
  token=g.ticket('ChIJ_Test','secret');self.assertEqual(g.verify_ticket(token,'secret'),'ChIJ_Test')
  for value in [token+'x',g.ticket('ChIJ_Test','secret',int(g.time.time())-1),'https://evil.example']:
   with self.assertRaises(HTTPException):g.verify_ticket(value,'secret')
 def test_unknown_internal_place_never_calls_google(self):
  client=MagicMock();client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data=[]
  with patch.object(g,'api_key',return_value='secret'),patch.object(g,'place_client',return_value=client),patch.object(g,'google_request') as upstream:
   with self.assertRaises(HTTPException):g.search('missing',Response())
   upstream.assert_not_called()
 def test_only_whitelisted_content_returned(self):
  value=g.display({'id':'x','displayName':{'text':'name'},'formattedAddress':'address','reviews':['private'],'photos':['private'],'location':{'latitude':1},'attributions':[{'provider':'Example','providerUri':'javascript:bad'}]})
  self.assertNotIn('reviews',value);self.assertNotIn('photos',value);self.assertNotIn('location',value);self.assertEqual(value['attributions'][0]['url'],'')
 def test_search_signed_candidates_no_write(self):
  client=MagicMock();client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data=[{'name':'독립 장소','location':'서울','region':'서울'}]
  response=Response()
  with patch.object(g,'api_key',return_value='secret'),patch.object(g,'place_client',return_value=client),patch.object(g,'google_request',return_value={'places':[{'id':'ChIJ_Test','displayName':{'text':'테스트'}}]}) as upstream:
   value=g.search('cp_1',response);self.assertEqual(len(value['places']),1);self.assertEqual(g.verify_ticket(value['places'][0]['ticket'],'secret'),'ChIJ_Test');self.assertIn('no-store',response.headers['Cache-Control']);client.table.return_value.insert.assert_not_called();self.assertIn('독립 장소',upstream.call_args.args[3]['textQuery'])
 def test_invalid_details_ticket_never_calls_google(self):
  with patch.object(g,'api_key',return_value='secret'),patch.object(g,'google_request') as upstream:
   with self.assertRaises(HTTPException):g.details(g.DetailsInput(ticket='invalid'),Response())
   upstream.assert_not_called()
if __name__=='__main__':unittest.main()
