import { useParams, useNavigate } from 'react-router-dom'

const VenueDetailTest = () => {
  const { hallId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background-dark p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          ← Quay lại
        </button>
        
        <div className="bg-surface-dark border border-border-gold rounded-xl p-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-4">
            VenueDetail Test Page
          </h1>
          
          <div className="space-y-4 text-slate-300">
            <p>✅ Route hoạt động!</p>
            <p>Hall ID từ URL: <span className="text-primary font-mono">{hallId}</span></p>
            
            <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 font-semibold mb-2">⚠️ Cần làm tiếp:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Chạy migration: <code className="bg-black/30 px-2 py-1 rounded">cleanup_theater_types.sql</code></li>
                <li>Chạy migration: <code className="bg-black/30 px-2 py-1 rounded">20260302_theater_management_simple.sql</code></li>
                <li>Thay VenueDetailTest bằng VenueDetail trong main.jsx</li>
              </ol>
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 font-semibold mb-2">📋 Checklist:</p>
              <ul className="space-y-2 text-sm">
                <li>□ Bảng floors đã tạo</li>
                <li>□ Bảng halls đã tạo</li>
                <li>□ Bảng seats đã tạo</li>
                <li>□ Bảng plays đã tạo</li>
                <li>□ Bảng performances đã tạo</li>
                <li>□ Bảng tickets đã tạo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VenueDetailTest
