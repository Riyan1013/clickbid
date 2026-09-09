import { NextRequest, NextResponse } from 'next/server'

// Meta tags live in <head> — cap how much HTML we parse.
const MAX_HTML_LENGTH = 300_000
const FETCH_TIMEOUT_MS = 5_000

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ClickBidBot/1.0)',
  Accept: 'text/html,application/xhtml+xml',
}

/**
 * Minimal SSRF guard for an endpoint that fetches user-supplied
 * URLs: blocks obvious internal targets, both before the request
 * and after redirects. Not exhaustive (no DNS resolution/rebinding
 * checks) — harden further before opening this endpoint publicly.
 */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^\[/, // IPv6 literals, e.g. [::1]
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
]

export async function GET(request: NextRequest) {
  const rawDomain = request.nextUrl.searchParams.get('domain')

  if (!rawDomain) {
    return NextResponse.json(
      { error: 'Missing domain parameter' },
      { status: 400 },
    )
  }

  // Re-normalize server-side — never trust the client's cleanup.
  const domain = normalizeDomain(rawDomain)

  if (!domain) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }

  if (isBlockedHost(domain)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  const url = `https://${domain}`

  let html: string

  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    // Re-check after redirects — a public host can redirect inward.
    const finalHostname = hostnameOf(response.url)

    if (!finalHostname || isBlockedHost(finalHostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }

    const contentType = response.headers.get('content-type') ?? ''

    if (!response.ok || (contentType && !contentType.includes('html'))) {
      return NextResponse.json(
        { error: `Could not fetch ${url} (status ${response.status})` },
        { status: 502 },
      )
    }

    html = (await response.text()).slice(0, MAX_HTML_LENGTH)
  } catch {
    return NextResponse.json(
      { error: `Could not reach ${url}` },
      { status: 502 },
    )
  }

  const name = extractTitle(html)
  const description =
    extractMetaContent(html, 'property', 'og:description') ??
    extractMetaContent(html, 'name', 'description') ??
    ''
  const imageSrc =
    extractMetaContent(html, 'property', 'og:image') ??
    extractFaviconHref(html) ??
    '/favicon.ico'

  return NextResponse.json({
    name,
    description,
    logoUrl: resolveUrl(imageSrc, url) ?? '',
    domain,
    url,
  })
}

function isBlockedHost(hostname: string) {
  return BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))
}

/**
 * Server-side normalization: accepts a bare domain or a full URL and
 * returns just the lowercase hostname (" https://Example.com/path "
 * → "example.com").
 */
function normalizeDomain(input: string): string | null {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  return hostnameOf(withProtocol)
}

function hostnameOf(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    return hostname ? hostname.toLowerCase() : null
  } catch {
    return null
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

  if (!match) {
    return ''
  }

  return decodeHtmlEntities(match[1] ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Finds <meta attribute="key" content="..."> with attributes in
 * either order; og:image/og:description use property=, the
 * description fallback uses name=.
 */
function extractMetaContent(
  html: string,
  attribute: 'name' | 'property',
  key: string,
): string | null {
  const metaTags = html.match(/<meta\s[^>]*>/gi) ?? []

  for (const tag of metaTags) {
    const isMatch = new RegExp(`${attribute}\\s*=\\s*["']${key}["']`, 'i').test(
      tag,
    )

    if (!isMatch) {
      continue
    }

    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i)

    if (contentMatch) {
      const value = decodeHtmlEntities(contentMatch[1] ?? '').trim()
      return value || null
    }
  }

  return null
}

/**
 * Finds rel="icon" / rel="shortcut icon" (rel is a token list, so
 * this matches any link whose rel tokens include "icon").
 */
function extractFaviconHref(html: string): string | null {
  const linkTags = html.match(/<link\s[^>]*>/gi) ?? []

  for (const tag of linkTags) {
    const relMatch = tag.match(/rel\s*=\s*["']([^"']*)["']/i)

    if (!relMatch) {
      continue
    }

    const relTokens = (relMatch[1] ?? '').toLowerCase().trim().split(/\s+/)

    if (!relTokens.includes('icon')) {
      continue
    }

    const hrefMatch = tag.match(/href\s*=\s*["']([^"']*)["']/i)
    const href = hrefMatch ? decodeHtmlEntities(hrefMatch[1] ?? '').trim() : ''

    if (href) {
      return href
    }
  }

  return null
}

/**
 * Resolves a possibly-relative og:image/favicon against the fetched
 * URL ("/logo.png", "//cdn.site.com/a.png", or absolute).
 */
function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).toString()
  } catch {
    return null
  }
}

/**
 * Decodes the handful of entities that commonly appear in titles,
 * descriptions, and og:image URLs (URLs legitimately contain &amp;)
 * — not a full HTML entity decoder.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_code: string, digits: string) =>
      String.fromCharCode(Number(digits)),
    )
}
