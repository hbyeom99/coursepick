"""User-entered Zip timing/notes survive native-to-Kakao reference migration."""
from copy import deepcopy
from stop_details import validate_stop_details

def validate_zip_stop_details(value, allowed):
    # Zip's existing timing model uses 0 for an unset duration.
    if not isinstance(value, dict):
        raise ValueError('장소 메모 형식')
    clean = deepcopy(value)
    zero_keys = set()
    for key, item in clean.items():
        if isinstance(item, dict) and type(item.get('minutes')) is int and item['minutes'] == 0:
            zero_keys.add(key)
            item.pop('minutes')
    result = validate_stop_details(clean, allowed)
    for key in zero_keys & result.keys():
        result[key]['minutes'] = 0
    return result
