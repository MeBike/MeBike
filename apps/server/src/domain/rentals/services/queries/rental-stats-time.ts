export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0,
  ));
}

export function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23,
    59,
    59,
    999,
  ));
}

export function addUtcDays(date: Date, delta: number): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + delta,
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  ));
}

export function currentUtcMonthRange(now: Date): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)),
    to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
  };
}

export function previousUtcMonthRange(now: Date): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0)),
    to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999)),
  };
}

export function currentUtcDayRange(now: Date): { from: Date; to: Date } {
  return {
    from: startOfUtcDay(now),
    to: endOfUtcDay(now),
  };
}

export function previousUtcDayRange(now: Date): { from: Date; to: Date } {
  const yesterday = addUtcDays(now, -1);
  return {
    from: startOfUtcDay(yesterday),
    to: endOfUtcDay(yesterday),
  };
}

export function previousUtcMonthFullRange(now: Date): { from: Date; to: Date } {
  return previousUtcMonthRange(now);
}
