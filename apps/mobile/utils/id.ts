export function shortenId(value?: string | null, options?: { head?: number; tail?: number }): string {
  if (!value) {
    return "--";
  }

  const head = options?.head ?? 4;
  const tail = options?.tail ?? 4;

  if (value.length <= head + tail + 1) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function formatSupportCode(value?: string | null): string {
  if (!value) {
    return "--";
  }

  return `#${shortenId(value, { head: 6, tail: 4 }).toUpperCase()}`;
}
