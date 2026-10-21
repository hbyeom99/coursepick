"""Small recommendation candidate queries preserve the existing soft ranking."""
import os
from itertools import combinations
from pathlib import Path
from dotenv import dotenv_values
from supabase import create_client
from supabase.client import ClientOptions
from read_cache import ReadCache

recommendation_cache = ReadCache(ttl=60, capacity=64)
region_place_cache = ReadCache(ttl=60, capacity=8)


def place_client():
    cfg = dotenv_values(Path(__file__).with_name('.env'), interpolate=False)
    url = os.environ.get('SUPABASE_URL') or cfg.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY') or cfg.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        raise ValueError('Missing server configuration')
    return create_client(url, key, options=ClientOptions(
        persist_session=False, auto_refresh_token=False, postgrest_client_timeout=10))


def recommendation_candidates(client, region='', category='', tag=''):
    conditions = [(key, value) for key, value in [('region', region), ('category', category), ('tags', tag)] if value]
    found = {}
    # A top-six result must occur in the rating top six of one matching subset.
    # Include the unfiltered fallback so absent preferences still return results.
    for size in range(len(conditions) + 1):
        for subset in combinations(conditions, size):
            query = client.table('places').select('*').not_.like('id', 'lodgingcsv_%')
            for key, value in subset:
                query = query.contains(key, [value]) if key == 'tags' else query.eq(key, value)
            rows = query.order('rating', desc=True, nullsfirst=False).order('id').limit(6).execute().data
            for row in rows:
                found[row['id']] = row
    return list(found.values())
