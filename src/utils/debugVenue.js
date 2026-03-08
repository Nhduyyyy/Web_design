import { supabase } from '../lib/supabase'

export const debugVenueStructure = async (venueId) => {
  try {
    // Get venue with all relationships
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single()

    if (venueError) throw venueError

    console.log('=== VENUE DATA ===')
    console.log(venue)

    // Try to get theater
    if (venue.theater_id) {
      const { data: theater, error: theaterError } = await supabase
        .from('theaters')
        .select('*')
        .eq('id', venue.theater_id)
        .single()

      console.log('=== THEATER DATA ===')
      if (theaterError) {
        console.log('Theater Error:', theaterError)
      } else {
        console.log(theater)
      }

      // Try to get organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', venue.theater_id)
        .single()

      console.log('=== ORGANIZATION DATA ===')
      if (orgError) {
        console.log('Organization Error:', orgError)
      } else {
        console.log(org)
      }
    }

    return venue
  } catch (error) {
    console.error('Debug error:', error)
    throw error
  }
}
