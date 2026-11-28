const backendApiUrl = () =>
  (process.env.BACKEND_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxy(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const target = `${backendApiUrl()}/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);

  // The browser only ever talks to this proxy on our own domain, so a
  // same-origin request is a server-to-server call from the backend's point of
  // view: drop its Origin so backend CORS doesn't have to list this domain.
  // Foreign origins are still forwarded and rejected by the backend.
  const origin = headers.get("origin");
  const ownHost = headers.get("x-forwarded-host") ?? headers.get("host");
  if (origin && ownHost) {
    try {
      if (new URL(origin).host === ownHost) headers.delete("origin");
    } catch {
      // Malformed Origin: leave it for the backend to reject.
    }
  }

  headers.delete("host");
  headers.delete("content-length");

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "content-encoding" && lower !== "transfer-encoding" && lower !== "content-length" && lower !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const PUT = proxy;
export const OPTIONS = proxy;
