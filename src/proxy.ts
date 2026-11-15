import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

// HTTP Basic Auth in front of every route, including _next assets and any
// data route. Credentials come from DASHBOARD_USER / DASHBOARD_PASS.
// If either is missing the site fails closed (nothing is served).
//
// Next.js 16 renamed middleware.ts to proxy.ts. Same feature, new name.
// It runs on the Node.js runtime by default, so node:crypto is available.

const ROBOTS = "noindex, nofollow";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still do a comparison so timing doesn't reveal the length match.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function isAuthorised(header: string | null, user: string, pass: string) {
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const i = decoded.indexOf(":");
  if (i < 0) return false;
  // Evaluate both so timing doesn't reveal which part was wrong.
  const userOk = safeEqual(decoded.slice(0, i), user);
  const passOk = safeEqual(decoded.slice(i + 1), pass);
  return userOk && passOk;
}

export function proxy(request: NextRequest) {
  // robots.txt stays readable so crawlers see "Disallow: /". It holds no data.
  if (request.nextUrl.pathname === "/robots.txt") {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", ROBOTS);
    return res;
  }

  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASS;

  if (!user || !pass) {
    // Names only, never values. Shows up in the Vercel project's logs.
    const missing = [!user && "DASHBOARD_USER", !pass && "DASHBOARD_PASS"].filter(Boolean).join(", ");
    console.error(`Basic Auth disabled: missing ${missing} (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`);
    return new NextResponse("Dashboard credentials are not configured.", {
      status: 503,
      headers: { "X-Robots-Tag": ROBOTS, "Cache-Control": "no-store" },
    });
  }

  if (!isAuthorised(request.headers.get("authorization"), user, pass)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Lighting Hub report", charset="UTF-8"',
        "X-Robots-Tag": ROBOTS,
        "Cache-Control": "no-store",
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", ROBOTS);
  return res;
}

// No matcher: the proxy runs on every request, static assets included.
