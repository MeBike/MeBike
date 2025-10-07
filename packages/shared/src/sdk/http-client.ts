type HeaderValue = string | string[] | undefined;
type HeadersRecord = Record<string, HeaderValue>;
type HeadersInput = Headers | Array<[string, string]> | HeadersRecord | undefined;

const DEFAULT_BASE_URL = "http://localhost:3000";

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
    = process.env.IOT_SERVICE_BASE_URL
      || process.env.IOT_SERVICE_URL
      || process.env.IOT_BASE_URL;

  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BASE_URL;
}

type FetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

type FetchFn = (input: string, init?: Record<string, unknown>) => Promise<FetchResponse>;

export type HttpClientInit = {
  headers?: HeadersInput;
} & Record<string, unknown>;

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
  catch (_error) {
    return value;
  }
}

function normalizeHeaders(headers: HeadersInput) {
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

export async function httpClient<TData>(url: string, init: HttpClientInit = {}): Promise<TData> {
  const fetchFn = getFetchFn();
  const finalUrl = normalizeUrl(resolveBaseUrl(), url);
  const { headers: initHeaders, ...rest } = init;
  const headers = {
    accept: "application/json",
    ...normalizeHeaders(initHeaders),
  };

  const response = await fetchFn(finalUrl, {
    ...rest,
    headers,
  });

  const rawBody = await response.text();
  const parsedBody = parseJsonSafely(rawBody) as TData;

  if (!response.ok) {
    const error = new Error(
      `Request to ${finalUrl} failed with status ${response.status}`,
    ) as Error & { status?: number; body?: unknown };

    error.status = response.status;
    error.body = parsedBody;

    throw error;
  }

  return parsedBody;
}
