import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")

const protectedPaths = ["/dashboard"]
const publicAuthPaths = ["/login"]

async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("session")?.value

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = publicAuthPaths.some((path) => pathname.startsWith(path))

  if (isAuthPath) {
    if (token) {
      const session = await verifyToken(token)
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
    return NextResponse.next()
  }

  if (isProtectedPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const session = await verifyToken(token)
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

// Only run middleware on actual requests, not during build time
export const config = {
  matcher: [
    // Dashboard and login routes
    "/(dashboard|login)/:path*",
    // Exclude Next.js built-in routes and static files
    "/((?!_next|favicon|icon|manifest|offline|public|api/(?!auth)|static).*)",
  ],
}
