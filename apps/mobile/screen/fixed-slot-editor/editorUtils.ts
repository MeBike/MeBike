export function formatTime(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKey(value: Date) {
  return formatDate(value);
}

export function getTomorrowDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

export function filterFutureDates(dates: string[]) {
  const tomorrowKey = getDateKey(getTomorrowDate());
  return dates.filter(date => date >= tomorrowKey);
}

export function timeStringToDate(value: string) {
  const date = new Date();
  const [hoursString, minutesString] = value.split(":");
  const hours = Number.parseInt(hoursString ?? "0", 10);
  const minutes = Number.parseInt(minutesString ?? "0", 10);
  date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}
