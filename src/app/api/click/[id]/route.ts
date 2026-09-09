import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 })
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, url')
    .eq('id', id)
    .maybeSingle()

  if (listingError) {
    console.error('[click] failed to fetch listing', id, listingError)
    return NextResponse.json(
      { error: 'Failed to look up listing' },
      { status: 500 },
    )
  }

  if (!listing || !listing.url) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  let destination: URL
  try {
    destination = new URL(listing.url)
  } catch {
    console.error('[click] listing has an invalid stored url', id, listing.url)
    return NextResponse.json(
      { error: 'Listing has an invalid destination URL' },
      { status: 500 },
    )
  }

  if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
    console.error(
      '[click] listing has a disallowed url protocol',
      id,
      listing.url,
    )
    return NextResponse.json(
      { error: 'Listing has an invalid destination URL' },
      { status: 500 },
    )
  }

  const { error: clickError } = await supabase
    .from('clicks')
    .insert({ listing_id: id })

  if (clickError) {
    console.error('[click] failed to record click for', id, clickError)
  }

  return NextResponse.redirect(destination, { status: 302 })
}
