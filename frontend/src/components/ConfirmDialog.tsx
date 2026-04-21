interface Props {
  isOpen: boolean
  title?: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  title = 'Bestätigung',
  message,
  confirmLabel = 'Bestätigen',
  onConfirm,
  onClose,
  isLoading,
}: Props) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-lg bg-secondary text-white hover:bg-primary transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Lädt…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
