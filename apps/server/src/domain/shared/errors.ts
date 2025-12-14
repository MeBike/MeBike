export type WithGenericError<T = object> = T & {
  readonly operation: string;
  readonly message?: string;
  readonly cause?: unknown;
};
