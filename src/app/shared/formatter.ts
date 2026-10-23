/** "30 min", "1 u", "1 u 30". */
export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} u${rest ? ` ${rest}` : ''}`;
}
