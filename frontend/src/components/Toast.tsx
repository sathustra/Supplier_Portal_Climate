import { useToast } from '@/context/ToastContext'

const typeStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-secondary text-white',
}

const typeIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export default function Toast() {
  const { toasts } = useToast()
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${typeStyles[t.type]}`}
        >
          <span className="text-base leading-none mt-0.5">{typeIcons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
