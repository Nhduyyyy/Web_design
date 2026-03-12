const statusConfig = {
  active: { label: 'Đang hoạt động', classes: 'bg-green-500/10 text-green-400 border-green-500/30' },
  inactive: { label: 'Ngừng hoạt động', classes: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
  pending: { label: 'Chờ duyệt', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  suspended: { label: 'Bị đình chỉ', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
  approved: { label: 'Đã duyệt', classes: 'bg-green-500/10 text-green-400 border-green-500/30' },
  rejected: { label: 'Từ chối', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

const TheaterProfileHeader = ({ theater, onEdit }) => {
  const status = statusConfig[theater?.status] || statusConfig.inactive

  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold overflow-hidden mb-6">
      <div
        className="h-72 relative"
        style={{
          backgroundImage: theater?.cover_image_url ? `url(${theater.cover_image_url})` : 'linear-gradient(135deg, #7c2d12, #1f2937)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative h-full flex items-end px-8 pb-6 gap-6">
          <div className="h-24 w-24 rounded-xl border-4 border-border-gold bg-background-dark overflow-hidden flex-shrink-0">
            {theater?.logo_url ? (
              <img
                src={theater.logo_url}
                alt="Theater logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                {theater?.name?.[0]?.toUpperCase() || 'T'}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-50 mb-1">
                {theater?.name || 'Nhà hát của bạn'}
              </h1>
              <p className="text-slate-300 text-sm mb-1">
                {theater?.city || 'Chưa cập nhật thành phố'}
              </p>
              <p className="text-slate-400 text-xs max-w-2xl">
                {theater?.description || 'Cập nhật mô tả để khán giả hiểu rõ hơn về nhà hát của bạn.'}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${status.classes}`}>
                {status.label}
              </span>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-background-dark text-sm font-semibold hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TheaterProfileHeader

