import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iartigo.vercel.app"

  const robots = `User-agent: *
Allow: /
Allow: /landing
Allow: /demo
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth/

Sitemap: ${baseUrl}/sitemap.xml`

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  })
}
