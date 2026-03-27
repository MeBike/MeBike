type PickDefinedResult<T extends Record<string, unknown>> = Partial<{
  [K in keyof T]: Exclude<T[K], undefined>;
}>;

type PickDefinedOptions = {
  readonly returnUndefinedIfEmpty?: boolean;
};

export function pickDefined<T extends Record<string, unknown>>(
  input: T,
): PickDefinedResult<T>;
export function pickDefined<T extends Record<string, unknown>>(
  input: T,
  options: { readonly returnUndefinedIfEmpty: true },
): PickDefinedResult<T> | undefined;
export function pickDefined<T extends Record<string, unknown>>(
  input: T,
  options?: PickDefinedOptions,
): PickDefinedResult<T> | undefined {
  const output = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as PickDefinedResult<T>;

  if (options?.returnUndefinedIfEmpty && Object.keys(output).length === 0) {
    return undefined;
  }

  return output;
}
