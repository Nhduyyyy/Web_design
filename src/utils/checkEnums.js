import { supabase } from '../lib/supabase'

export const checkDatabaseEnums = async () => {
  try {
    // Query to get enum values from PostgreSQL
    const { data, error } = await supabase.rpc('get_enum_values', {
      enum_name: 'floor_type'
    })

    if (error) {
      console.log('Cannot query enum directly, trying alternative method...')
      
      // Alternative: Try to insert with invalid value to see error message
      const { error: testError } = await supabase
        .from('floors')
        .insert({
          theater_id: '00000000-0000-0000-0000-000000000000',
          floor_number: 999,
          name: 'TEST',
          floor_type: 'INVALID_VALUE_TO_GET_ENUM_LIST'
        })
      
      console.log('Test error:', testError)
    } else {
      console.log('Enum values:', data)
    }

    // Check other enums
    console.log('=== Checking Database Enums ===')
    
    // Try different floor_type values
    const testValues = ['main', 'balcony', 'basement', 'technical', 'vip', 'underground']
    
    for (const value of testValues) {
      const { error } = await supabase
        .from('floors')
        .select('id')
        .eq('floor_type', value)
        .limit(1)
      
      if (!error) {
        console.log(`✓ floor_type="${value}" is valid`)
      } else if (error.code === '22P02') {
        console.log(`✗ floor_type="${value}" is INVALID`)
      }
    }

  } catch (error) {
    console.error('Error checking enums:', error)
  }
}

// Run this in browser console: 
// import { checkDatabaseEnums } from './utils/checkEnums'
// checkDatabaseEnums()
