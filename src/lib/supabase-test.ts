import { supabase } from './supabase'

async function testSupabaseConnection() {
  const { data, error } = await supabase.from('categories').select('*')

  if (error) {
    console.error('Supabase connection failed:')
    console.error(error)
    return
  }

  console.log('Supabase connection successful!')
  console.log('Categories:', data)
}

testSupabaseConnection()
