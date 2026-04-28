import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, mcp-session-id',
  'Access-Control-Max-Age': '86400',
}

export function withCors(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
  return response
}

export function corsOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// Helper: add CORS to a plain JSON response
export function corsJson(body: unknown, init?: ResponseInit): NextResponse {
  return withCors(NextResponse.json(body, init))
}
