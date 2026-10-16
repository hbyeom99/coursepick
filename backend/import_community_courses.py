"""Register reviewed demo profiles/courses after community_courses.sql is run."""
import json
import argparse
from pathlib import Path
from dotenv import dotenv_values
from supabase import create_client
from main import validate_demo_course

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--update-demo', action='store_true', help='Update only existing demo seed IDs')
    args = parser.parse_args()
    folder = Path(__file__).parent
    data = json.loads((folder / 'community_courses.json').read_text(encoding='utf-8'))
    config = dotenv_values(folder / '.env', interpolate=False)
    client = create_client(config['SUPABASE_URL'], config['SUPABASE_SERVICE_KEY'])
    places = []
    while True:
        page = client.table('places').select('id').order('id').range(len(places), len(places)+999).execute().data
        places.extend(page)
        if len(page) < 1000: break
    authors = {profile['id'] for profile in data['profiles']}
    if len(authors) != len(data['profiles']) or any(profile.get('is_demo') is not True for profile in data['profiles']):
        raise ValueError('Only unique demo authors may be registered')
    if len({course['id'] for course in data['courses']}) != len(data['courses']):
        raise ValueError('Duplicate course IDs')
    for course in data['courses']:
        validate_demo_course(course, {place['id'] for place in places}, authors)
    if args.update_demo:
        for table, rows in [('profiles', data['profiles']), ('courses', data['courses'])]:
            existing = []
            for offset in range(0, len(rows), 100):
                existing.extend(client.table(table).select('*').in_('id', [row['id'] for row in rows[offset:offset+100]]).execute().data)
            expected = {row['id']: row for row in rows}
            if any(row.get('is_demo') is not True or (table == 'courses' and row['author_id'] != expected[row['id']]['author_id']) for row in existing):
                raise ValueError('Refusing to replace a non-demo or differently owned record')
    # Default stays insert-only; explicit update targets reviewed demo IDs only.
    for table, rows in [('profiles', data['profiles']), ('courses', data['courses'])]:
        for offset in range(0, len(rows), 100):
            client.table(table).upsert(rows[offset:offset+100], on_conflict='id', ignore_duplicates=not args.update_demo).execute()
    saved = []
    for offset in range(0, len(data['courses']), 100):
        saved.extend(client.table('courses').select('id,author_id').in_('id', [course['id'] for course in data['courses'][offset:offset+100]]).execute().data)
    if len(saved) != len(data['courses']):
        raise RuntimeError('Registration is incomplete; rerun safely')
    print(f"Registered {len(data['profiles'])} demo authors and {len(data['courses'])} courses; server keys were not displayed.")

if __name__ == '__main__':
    try:
        main()
    except Exception:
        raise SystemExit('Registration failed. Check tables, validated data, and backend/.env. No credentials displayed.')
