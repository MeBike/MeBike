export function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day)
    return value;

  return `${day}-${month}-${year}`;
}
