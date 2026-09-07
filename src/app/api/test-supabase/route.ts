import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

  return NextResponse.json({
    success: true,
    categories,
    listings,
  })
}
