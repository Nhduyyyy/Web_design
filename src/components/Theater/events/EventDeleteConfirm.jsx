const EventDeleteConfirm = ({ event, onConfirm, onCancel }) => {
  if (!event) return null

  const hasParticipants = (event.current_participants || 0) > 0
  const isLockedStatus =
    event.status === 'completed' || event.status === 'cancelled'

  const cannotDeleteReason = hasParticipants
    ? 'Sự kiện đã có người đăng ký, không thể xóa.'
    : isLockedStatus
    ? 'Không thể xóa sự kiện đã kết thúc hoặc đã hủy.'
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border-gold bg-surface-dark p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Xóa sự kiện?
            </h2>
            <p className="text-xs text-slate-400">
              Hành động này không thể hoàn tác. Hãy chắc chắn rằng bạn muốn xóa
              sự kiện:
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-background-dark/80 px-3 py-2 text-sm text-slate-200">
          <p className="line-clamp-2 font-medium">{event.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            Trạng thái: <span className="font-semibold">{event.status}</span> •{' '}
            Đã đăng ký: {event.current_participants || 0} /{' '}
            {event.max_participants || 0}
          </p>
        </div>

        {cannotDeleteReason ? (
          <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            {cannotDeleteReason}
          </div>
        ) : (
          <p className="mb-4 text-xs text-slate-400">
            Bạn chắc chắn muốn xóa sự kiện này khỏi hệ thống?
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border-gold px-4 py-2 text-sm font-medium text-slate-200 hover:bg-background-dark"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!!cannotDeleteReason}
            onClick={() => onConfirm?.(event)}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventDeleteConfirm

