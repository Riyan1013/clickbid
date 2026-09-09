import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { submitBid } from '@/lib/listings'

export async function GET() {
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')

  if (categoriesError) {
    return NextResponse.json(
      {
        success: false,
        error: categoriesError.message,
      },
      { status: 500 },
    )
  }

  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('*')

  if (listingsError) {
    return NextResponse.json(
      {
        success: false,
        error: listingsError.message,
      },
      { status: 500 },
    )
  }

  // Temporary write test — remove before deploying.
  try {
    const submittedListing = await submitBid({
      domain: 'clickbid-test.example',
      name: 'ClickBid Test',
      url: 'https://clickbid-test.example',
      categoryId: 'other',
      amount: 1,
    })

    return NextResponse.json({
      success: true,
      categories,
      listings,
      submittedListing,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
