"""User-entered visit notes and timing, keyed by stable itinerary identity."""
import re

def validate_stop_details(value, allowed):
    if not isinstance(value, dict) or len(value) > 300:
        raise ValueError('장소 메모 형식')
    result = {}
    for key, item in value.items():
        if not isinstance(key, str) or not isinstance(item, dict) or set(item) - {'note', 'time', 'minutes'}:
            raise ValueError('장소 메모 필드')
        if 'note' in item and (not isinstance(item['note'], str) or len(item['note']) > 1000):
            raise ValueError('메모는 1000자 이내로 입력해 주세요.')
        if 'time' in item and (not isinstance(item['time'], str) or (item['time'] and not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', item['time']))):
            raise ValueError('방문 시간')
        if 'minutes' in item and (type(item['minutes']) is not int or not 1 <= item['minutes'] <= 1440):
            raise ValueError('체류 시간')
        if key in allowed:
            result[key] = dict(item)
    return result
