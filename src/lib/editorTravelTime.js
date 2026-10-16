export function editorTravelTime(ids, index, route, status, transport) {
  if (transport !== '자동차' || index === 0) return '';
  if (status === 'error') return '이동시간 확인 불가';
  const target = route?.stopIds?.indexOf(ids[index]);
  if (status !== 'success' || target == null || target < 1 || route.stopIds[target - 1] !== ids[index - 1]) return '이동시간 계산 중';
  const seconds = route.segments?.[target - 1]?.durationSeconds;
  return Number.isFinite(seconds) && seconds >= 0 ? `이전 장소에서 자동차 약 ${Math.ceil(seconds / 60)}분` : '이동시간 확인 불가';
}
