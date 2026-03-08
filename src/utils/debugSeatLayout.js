import { supabase } from '../lib/supabase';

/**
 * Debug utility to check seat layout table status
 */
export const debugSeatLayoutTables = async () => {
  console.log('🔍 ===== SEAT LAYOUT DEBUG START =====');
  
  // Check authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  console.log('🔐 Auth Status:', {
    authenticated: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    error: authError
  });
  
  // Try to query seat_layout_configs
  console.log('\n📊 Testing seat_layout_configs table...');
  const { data: configs, error: configError } = await supabase
    .from('seat_layout_configs')
    .select('*')
    .limit(1);
  
  console.log('seat_layout_configs result:', {
    data: configs,
    error: configError ? {
      code: configError.code,
      message: configError.message,
      details: configError.details,
      hint: configError.hint,
      status: configError.status
    } : null
  });
  
  // Try to query halls to verify relationship
  console.log('\n🏛️ Testing halls table...');
  const { data: halls, error: hallError } = await supabase
    .from('halls')
    .select('id, name, venue_id')
    .limit(5);
  
  console.log('halls result:', {
    count: halls?.length,
    data: halls,
    error: hallError
  });
  
  // Check if we can query venues and theaters
  console.log('\n🎭 Testing theater ownership chain...');
  const { data: theaters, error: theaterError } = await supabase
    .from('theaters')
    .select('id, name, owner_id')
    .eq('owner_id', session?.user?.id);
  
  console.log('theaters owned by user:', {
    count: theaters?.length,
    data: theaters,
    error: theaterError
  });
  
  if (theaters && theaters.length > 0) {
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('id, name, theater_id')
      .eq('theater_id', theaters[0].id);
    
    console.log('venues for first theater:', {
      count: venues?.length,
      data: venues,
      error: venueError
    });
    
    if (venues && venues.length > 0) {
      const { data: hallsForVenue, error: hallVenueError } = await supabase
        .from('halls')
        .select('id, name, venue_id')
        .eq('venue_id', venues[0].id);
      
      console.log('halls for first venue:', {
        count: hallsForVenue?.length,
        data: hallsForVenue,
        error: hallVenueError
      });
    }
  }
  
  console.log('\n🔍 ===== SEAT LAYOUT DEBUG END =====');
};

/**
 * Check if RLS is enabled on a table
 */
export const checkRLSStatus = async (tableName) => {
  const { data, error } = await supabase.rpc('check_rls_status', {
    table_name: tableName
  });
  
  console.log(`RLS Status for ${tableName}:`, { data, error });
  return data;
};

/**
 * Test creating a seat layout config
 */
export const testCreateLayoutConfig = async (hallId) => {
  console.log('🧪 Testing create layout config for hall:', hallId);
  
  const testConfig = {
    hall_id: hallId,
    rows: 10,
    cols: 15,
    cell_size: 40,
    show_grid: true,
    label_type: 'letters'
  };
  
  const { data, error } = await supabase
    .from('seat_layout_configs')
    .insert(testConfig)
    .select()
    .single();
  
  console.log('Create result:', { data, error });
  return { data, error };
};

// Export for console access
if (typeof window !== 'undefined') {
  window.debugSeatLayout = {
    debugSeatLayoutTables,
    checkRLSStatus,
    testCreateLayoutConfig
  };
}
