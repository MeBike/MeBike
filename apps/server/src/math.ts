export function add(a: number, b: number): number {
  return a + b;
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error("min cannot be greater than max");
  }
  return Math.min(Math.max(value, min), max);
}
