import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export default async function middleware(req: NextRequest) {
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
    if (!isOnDashboard) return NextResponse.next()

    const secret = process.env.AUTH_SECRET
    if (!secret) {
        throw new Error("AUTH_SECRET is not set")
    }

    const token = await getToken({ req, secret })
    if (!token) {
        return NextResponse.redirect(new URL("/", req.nextUrl))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
