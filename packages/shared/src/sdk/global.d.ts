export {};

declare global {
  interface Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callback: (value: string, key: string) => void, thisArg?: unknown): void;
  }

  interface RequestInit extends Record<string, unknown> {
    headers?: Headers | Record<string, string | string[] | undefined>;
    method?: string;
    body?: unknown;
    signal?: unknown;
  }
}
