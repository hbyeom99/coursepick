import unittest,copy,math
from course_traits import *
PLACES=[{'id':'rest','category':'카페','tags':['휴식'],'traitFacts':{'activityIntensity':0,'participatory':False,'costPerPerson':10000,'reservationRequired':False}},{'id':'active','category':'체험','tags':['체험'],'traitFacts':{'activityIntensity':1,'participatory':True,'costPerPerson':20000,'reservationRequired':True}}]
def course():return {'id':'c','stopIds':['rest','active'],'transport':'도보','durationDays':1,'schedule':[{'placeId':'rest','minutes':120,'time':'10:00'},{'placeId':'active','minutes':120,'time':'13:00'}]}
class CourseTraitsTests(unittest.TestCase):
 def test_four_independent_axes_no_total(self):
  a=evaluate_course_traits(course(),PLACES);self.assertEqual(set(a['axes']),set(RULES['axes']));self.assertNotIn('total',a);self.assertEqual(a['axes']['experience']['score'],50)
 def test_time_changes_whole_course_experience(self):
  c=course();c['schedule'][1]['minutes']=360;self.assertEqual(evaluate_course_traits(c,PLACES)['axes']['experience']['score'],75)
 def test_planning_density_uses_number_of_days(self):
  c=course();a=evaluate_course_traits(c,PLACES);c['durationDays']=2;c['schedule'][1]['day']=2;b=evaluate_course_traits(c,PLACES);self.assertGreater(a['axes']['planning']['score'],b['axes']['planning']['score'])
 def test_cost_boundaries(self):
  for cost,score in [(0,10),(30000,10),(30001,30),(50000,30),(50001,50),(80000,50),(80001,70),(120000,70),(120001,90)]:
   with self.subTest(cost=cost):c=course();c['traitFacts']={'estimatedDailyCost':cost};self.assertEqual(evaluate_course_traits(c,PLACES)['axes']['spending']['score'],score)
 def test_missing_cost_not_free(self):
  p=[{**x,'traitFacts':{}} for x in PLACES];a=evaluate_course_traits(course(),p);self.assertIsNone(a['axes']['spending']['score']);self.assertEqual(a['axes']['spending']['status'],'insufficient')
 def test_car_needs_local_transport_cost(self):
  c=course();c['transport']='자동차';self.assertIsNone(evaluate_course_traits(c,PLACES)['dailyCost']);c['traitFacts']={'localTransportCostTotal':15000};self.assertEqual(evaluate_course_traits(c,PLACES)['dailyCost'],45000)
 def test_exploration_is_personal(self):
  a=evaluate_course_traits(course(),PLACES,{'knownPlaceIds':['rest','active']});b=evaluate_course_traits(course(),PLACES,{'knownCategories':['박물관'],'knownTags':['관람']});self.assertEqual(a['axes']['exploration']['score'],0);self.assertEqual(b['axes']['exploration']['score'],100)
 def test_generic_interest_tags_are_not_visit_history(self):self.assertIsNone(evaluate_course_traits(course(),PLACES,{'knownTags':['커피','산책']})['axes']['exploration']['score'])
 def test_lodging_cost_excluded(self):
  c=course();c['stopIds'].append('hotel');p=PLACES+[{'id':'hotel','category':'숙소','tags':[],'traitFacts':{'costPerPerson':200000}}];self.assertEqual(evaluate_course_traits(c,p)['dailyCost'],30000)
 def test_no_history_no_fabricated_exploration(self):self.assertIsNone(evaluate_course_traits(course(),PLACES)['axes']['exploration']['score'])
 def test_place_five_axis_scores_ignored(self):
  a=evaluate_course_traits(course(),PLACES);p=[{**x,'activity':100,'space':0,'environment':100,'content':100,'pace':100} for x in PLACES];self.assertEqual(a,evaluate_course_traits(course(),p))
 def test_changed_course_invalidates_manual_estimate(self):
  c=course();c['traitFacts']={'estimatedDailyCost':70000,'basis':course_trait_basis(c)};self.assertEqual(evaluate_course_traits(c,PLACES)['dailyCost'],70000);c['stopIds']=['rest'];c['schedule']=[];self.assertTrue(evaluate_course_traits(c,PLACES)['factsStale']);self.assertNotEqual(evaluate_course_traits(c,PLACES)['dailyCost'],70000)
 def test_title_does_not_invalidate_estimate(self):
  c=course();c['traitFacts']={'estimatedDailyCost':70000,'basis':course_trait_basis(c)};c['name']='새 제목';self.assertFalse(evaluate_course_traits(c,PLACES)['factsStale'])
 def test_missing_data_provisional(self):self.assertEqual(evaluate_course_traits({'stopIds':['missing']},[])['axes']['planning']['status'],'provisional')
 def test_new_candidate_does_not_inherit_next_stop_duration(self):
  c=course();c['stopIds']=['rest','new','active'];p=PLACES+[{'id':'new','category':'카페','tags':[]}];self.assertEqual(evaluate_course_traits(c,p)['stopCount'],3)
 def test_fact_validation(self):
  for v in ({'estimatedDailyCost':-1},{'fixedOrderRatio':2},{'reservationRequiredCount':True},{'availableMinutesPerDay':float('nan')}):
   with self.assertRaises(ValueError):validate_trait_facts(v)
 def test_identical_tags_indoor_does_not_force_rest(self):
  p=[{'id':'a','tags':['실내','클라이밍'],'category':'관광지'}];a=evaluate_course_traits({'stopIds':['a'],'transport':'도보'},p);self.assertGreater(a['axes']['experience']['score'],80)
class GeneratedCourseTransitionTests(unittest.TestCase):
 def test_old_five_axis_parameters_no_longer_change_generation(self):
  from unittest.mock import patch
  import main
  places=[{'id':'s1','name':'휴식 명소','category':'관광지','region':'서울','tags':['휴식'],'latitude':37.5,'longitude':127.0},{'id':'s2','name':'체험 명소','category':'관광지','region':'서울','tags':['체험'],'latitude':37.51,'longitude':127.01},{'id':'f1','name':'점심 식당','category':'음식점','region':'서울','tags':['한식'],'latitude':37.503,'longitude':127.003},{'id':'f2','name':'저녁 식당','category':'음식점','region':'서울','tags':['한식'],'latitude':37.507,'longitude':127.007}]
  def call(value):return main.generate_course('서울',tags='',saved_ids='',include_cafe=False,activity=value,space=value,environment=value,content=value,pace=value,planning=None,experience=None,exploration=None,spending=None,known_tags='',known_categories='')
  with patch.object(main.region_place_cache,'read',return_value=places):
   a=call(0);b=call(100)
  self.assertEqual(a['course']['stopIds'],b['course']['stopIds']);self.assertEqual(a['course']['schedule'],b['course']['schedule']);self.assertEqual(a['course']['traitAssessment']['version'],RULES['version'])
if __name__=='__main__':unittest.main()
