export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0)
    return "";
  if (meters < 1000)
    return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const formatted = km < 10 ? km.toFixed(1) : km.toFixed(0);
  return `${formatted} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0)
    return "";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60)
    return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0)
    return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}

export function formatAvailableBikeLabel(availableBikes: number): string {
  if (!Number.isFinite(availableBikes) || availableBikes <= 0) {
    return "Hết xe";
  }

  return `${availableBikes} xe`;
}
