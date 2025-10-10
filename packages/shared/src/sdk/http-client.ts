type HeaderValue = string | string[] | undefined;
type HeadersRecord = Record<string, HeaderValue>;
type HeadersInput = Headers | Array<[string, string]> | HeadersRecord | undefined;

const DEFAULT_BASE_URL = "http://localhost:3000";

function getEnv(name: string): string | undefined {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return undefined;
  }

  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function normalizeUrl(baseUrl: string, url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const trimmedBase = baseUrl.replace(/\/$/, "");
  const trimmedPath = url.replace(/^\//, "");

  return `${trimmedBase}/${trimmedPath}`;
}

function resolveBaseUrl() {
  const fromEnv
    = getEnv("IOT_SERVICE_BASE_URL")
      || getEnv("IOT_SERVICE_URL")
      || getEnv("IOT_BASE_URL");

  return fromEnv ?? DEFAULT_BASE_URL;
}

type FetchResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  text: () => Promise<string>;
};

type FetchFn = (input: string, init?: RequestInit) => Promise<FetchResponse>;

export type HttpClientInit = Omit<RequestInit, "headers"> & {
  headers?: HeadersInput;
  baseUrl?: string;
};

function getFetchFn(): FetchFn {
  const globalFetch = (globalThis as Record<string, unknown>).fetch as FetchFn | undefined;

  if (!globalFetch) {
    throw new Error("Fetch API is not available in the current runtime.");
  }

  return globalFetch;
}

function parseJsonSafely(value: string) {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  }
  catch {
    return value;
  }
}

export function normalizeHeaders(headers: HeadersInput) {
  if (!headers) {
    return {} as Record<string, string>;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((accumulator, [key, value]) => {
      accumulator[key] = value;
      return accumulator;
    }, {});
  }

  const maybeHeaders = headers as {
    forEach?: (callback: (value: string, key: string) => void) => void;
  };

  if (typeof maybeHeaders.forEach === "function") {
    const result: Record<string, string> = {};
    maybeHeaders.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  return Object.entries(headers as HeadersRecord).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (value === undefined) {
      return accumulator;
    }

    accumulator[key] = Array.isArray(value) ? value.join(", ") : value;
    return accumulator;
  }, {});
}

export function mergeHeaders(...inputs: HeadersInput[]): Record<string, string> {
  return inputs.reduce<Record<string, string>>((accumulator, current) => {
    if (!current) {
      return accumulator;
    }
    const normalized = normalizeHeaders(current);
    for (const [key, value] of Object.entries(normalized)) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

export async function httpClient<TData>(url: string, init: HttpClientInit = {}): Promise<TData> {
  const fetchFn = getFetchFn();
  const { headers: initHeaders, baseUrl, ...rest } = init;
  const finalUrl = normalizeUrl(baseUrl ?? resolveBaseUrl(), url);
  const headers = {
    accept: "application/json",
    ...normalizeHeaders(initHeaders),
  };

  const response = await fetchFn(finalUrl, {
    ...rest,
    headers,
  });

  const rawBody = await response.text();
  const parsedBody = parseJsonSafely(rawBody);

  const result = {
    data: parsedBody,
    status: response.status,
    headers: response.headers,
  };

  return result as TData;
}
