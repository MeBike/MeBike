import { getAccessToken } from "@lib/auth-tokens";
import { refreshAccessToken } from "@lib/ky-client";
import { log } from "@lib/log";
import { fetch as expoFetch } from "expo/fetch";
import { StatusCodes } from "http-status-codes";

type FetchInput = Parameters<typeof globalThis.fetch>[0];
type FetchInit = Parameters<typeof globalThis.fetch>[1];

function toExpoFetchInit(init: FetchInit | undefined) {
  return init
    ? {
        body: init.body ?? undefined,
        credentials: init.credentials,
        headers: init.headers,
        integrity: init.integrity,
        keepalive: init.keepalive,
        method: init.method,
        mode: init.mode,
        redirect: init.redirect,
        referrer: init.referrer,
        signal: init.signal ?? undefined,
        window: init.window ?? undefined,
      }
    : undefined;
}

function normalizeExpoFetchArgs(input: FetchInput, init: FetchInit | undefined) {
  if (typeof input === "string") {
    return { url: input, init: toExpoFetchInit(init) };
  }

  if (input instanceof URL) {
    return { url: input.toString(), init: toExpoFetchInit(init) };
  }

  return {
    url: input.url,
    init: toExpoFetchInit({
      body: init?.body ?? input.body,
      credentials: init?.credentials ?? input.credentials,
      headers: init?.headers ?? input.headers,
      integrity: init?.integrity,
      keepalive: init?.keepalive,
      method: init?.method ?? input.method,
      mode: init?.mode,
      redirect: init?.redirect,
      referrer: init?.referrer,
      signal: init?.signal ?? input.signal,
      window: init?.window,
    }),
  };
}

function withAuthorizationHeader(headers: HeadersInit | undefined, token: string | null) {
  const nextHeaders = new Headers(headers);

  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
}

function buildAuthorizedRequest(
  input: FetchInput,
  init: FetchInit | undefined,
  token: string | null,
) {
  const headers = withAuthorizationHeader(init?.headers, token);

  if (input instanceof Request) {
    return {
      input: new Request(input, {
        ...init,
        headers,
      }),
      init: undefined,
    } as const;
  }

  return {
    input,
    init: {
      ...init,
      headers,
    },
  } as const;
}

async function executeFetch(
  input: FetchInput,
  init: FetchInit | undefined,
  token: string | null,
) {
  const request = buildAuthorizedRequest(input, init, token);
  const nextRequest = normalizeExpoFetchArgs(request.input, request.init);
  return expoFetch(nextRequest.url, nextRequest.init);
}

export const aiChatFetch: typeof globalThis.fetch = async (input, init) => {
  const token = await getAccessToken();
  const response = await executeFetch(input, init, token);

  if (response.status !== StatusCodes.UNAUTHORIZED) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();

  if (!refreshedToken) {
    log.warn("AI chat request unauthorized and token refresh failed");
    return response;
  }

  log.info("AI chat request retrying after token refresh");
  return executeFetch(input, init, refreshedToken);
};
