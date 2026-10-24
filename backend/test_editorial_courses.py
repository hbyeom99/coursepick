import unittest
from unittest.mock import MagicMock,patch
from fastapi import Response
import editorial_courses as e
class EditorialTests(unittest.TestCase):
 def db(self):
  db=MagicMock();query=db.table.return_value.select.return_value.order.return_value.order.return_value.limit.return_value
  query.eq.return_value.execute.return_value.data=[];query.neq.return_value.execute.return_value.data=[]
  return db,query
 def test_default_published_only(self):
  db,q=self.db();response=Response()
  with patch.object(e,'place_client',return_value=db),patch.dict(e.os.environ,{'EDITORIAL_PREVIEW':''}):value=e.editorial_courses(response)
  q.eq.assert_called_once_with('publication_status','published');self.assertFalse(value['preview']);self.assertIn('no-store',response.headers['Cache-Control'])
 def test_preview_explicit_only(self):
  db,q=self.db()
  with patch.object(e,'place_client',return_value=db),patch.dict(e.os.environ,{'EDITORIAL_PREVIEW':'1'}):value=e.editorial_courses(Response())
  q.neq.assert_called_once_with('publication_status','archived');self.assertTrue(value['preview'])
 def test_repeat_visits_and_days_preserved(self):
  db,q=self.db();visits=[{'visit_id':'one','place_id':None,'day':1},{'visit_id':'two','place_id':None,'day':2}];q.eq.return_value.execute.return_value.data=[{'days':visits}]
  with patch.object(e,'place_client',return_value=db),patch.dict(e.os.environ,{'EDITORIAL_PREVIEW':''}):value=e.editorial_courses(Response())
  self.assertEqual(value['courses'][0]['days'],visits)
 def test_linked_place_coordinates_are_included_for_map(self):
  db,q=self.db();q.eq.return_value.execute.return_value.data=[{'days':[{'place_id':'place-1','day':1}]}]
  place_query=db.table.return_value.select.return_value.in_.return_value
  place_query.execute.return_value.data=[{'id':'place-1','latitude':37.5,'longitude':127.0}]
  with patch.object(e,'place_client',return_value=db),patch.dict(e.os.environ,{'EDITORIAL_PREVIEW':''}):value=e.editorial_courses(Response())
  self.assertEqual(value['places'][0]['latitude'],37.5)
  self.assertEqual(value['places'][0]['longitude'],127.0)
  self.assertIn('latitude,longitude',db.table.return_value.select.call_args_list[1].args[0])
