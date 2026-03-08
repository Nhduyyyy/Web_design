import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const DebugPanel = ({ venueId }) => {
  const [debugInfo, setDebugInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    const info = {}

    try {
      // Check user
      const { data: { user } } = await supabase.auth.getUser()
      info.user = user ? { id: user.id, email: user.email } : null

      // Check profile
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        info.profile = profile
      }

      // Check venue
      const { data: venue } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single()
      info.venue = venue

      // Check theater
      if (venue?.theater_id) {
        const { data: theater } = await supabase
          .from('theaters')
          .select('*')
          .eq('id', venue.theater_id)
          .single()
        info.theater = theater

        // Check organization if theater has one
        if (theater?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', theater.organization_id)
            .single()
          info.organization = org
        }
      }

      setDebugInfo(info)
    } catch (error) {
      info.error = error.message
      setDebugInfo(info)
    } finally {
      setLoading(false)
    }
  }

  if (!debugInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={runDebug}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
        >
          {loading ? '🔍 Đang kiểm tra...' : '🐛 Debug RLS'}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-red-500 rounded-lg p-4 max-w-md max-h-96 overflow-auto shadow-2xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-red-400 font-bold">🐛 Debug Info</h3>
        <button
          onClick={() => setDebugInfo(null)}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* User */}
        <div>
          <div className="text-slate-400 font-semibold mb-1">User:</div>
          {debugInfo.user ? (
            <div className="bg-green-900/30 border border-green-700 rounded p-2">
              <div>✅ Logged in</div>
              <div>ID: {debugInfo.user.id}</div>
              <div>Email: {debugInfo.user.email}</div>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-700 rounded p-2">
              ❌ Not logged in
            </div>
          )}
        </div>

        {/* Profile */}
        <div>
          <div className="text-slate-400 font-semibold mb-1">Profile:</div>
          {debugInfo.profile ? (
            <div className="bg-green-900/30 border border-green-700 rounded p-2">
              <div>✅ Profile exists</div>
              <div>Role: {debugInfo.profile.role}</div>
              <div>Name: {debugInfo.profile.full_name || 'N/A'}</div>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-700 rounded p-2">
              ❌ No profile found
            </div>
          )}
        </div>

        {/* Venue */}
        <div>
          <div className="text-slate-400 font-semibold mb-1">Venue:</div>
          {debugInfo.venue ? (
            <div className="bg-green-900/30 border border-green-700 rounded p-2">
              <div>✅ Venue exists</div>
              <div>Name: {debugInfo.venue.name}</div>
              <div>Theater ID: {debugInfo.venue.theater_id || '❌ NULL'}</div>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-700 rounded p-2">
              ❌ Venue not found
            </div>
          )}
        </div>

        {/* Theater */}
        <div>
          <div className="text-slate-400 font-semibold mb-1">Theater:</div>
          {debugInfo.theater ? (
            <div className="bg-green-900/30 border border-green-700 rounded p-2">
              <div>✅ Theater exists</div>
              <div>Name: {debugInfo.theater.name}</div>
              <div>Owner: {debugInfo.theater.owner_id}</div>
              <div className="mt-1">
                {debugInfo.user?.id === debugInfo.theater.owner_id ? (
                  <span className="text-green-400">✅ You are the owner</span>
                ) : (
                  <span className="text-red-400">❌ You are NOT the owner</span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-700 rounded p-2">
              ❌ Theater not found
            </div>
          )}
        </div>

        {/* Organization */}
        <div>
          <div className="text-slate-400 font-semibold mb-1">Organization:</div>
          {debugInfo.organization ? (
            <div className="bg-green-900/30 border border-green-700 rounded p-2">
              <div>✅ Organization exists</div>
              <div>Name: {debugInfo.organization.legal_name}</div>
              <div>Owner: {debugInfo.organization.owner_id}</div>
            </div>
          ) : (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded p-2">
              ⚠️ No organization linked
            </div>
          )}
        </div>

        {/* Error */}
        {debugInfo.error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-2">
            <div className="text-red-400 font-semibold">Error:</div>
            <div className="text-red-300">{debugInfo.error}</div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-slate-700">
          <button
            onClick={runDebug}
            className="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => {
              console.log('Debug Info:', debugInfo)
              alert('Debug info logged to console (F12)')
            }}
            className="w-full mt-2 px-3 py-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 text-xs"
          >
            📋 Copy to Console
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugPanel
