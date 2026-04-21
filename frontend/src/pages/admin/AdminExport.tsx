import { useState } from 'react'
import { exportMeasures, exportPCF } from '@/api/admin'
import { useToast } from '@/context/ToastContext'
import type { SubmissionStatus } from '@/types'
import { SUBMISSION_STATUS_LABELS, YEAR_OPTIONS } from '@/utils/enums'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AdminExport() {
  const { addToast } = useToast()
  const [year, setYear] = useState<number | ''>('')
  const [status, setStatus] = useState<SubmissionStatus | ''>('approved')
  const [loadingPCF, setLoadingPCF] = useState(false)
  const [loadingMeasures, setLoadingMeasures] = useState(false)

  const handleExportPCF = async () => {
    setLoadingPCF(true)
    try {
      await exportPCF(year || undefined, status || undefined)
      addToast('PCF-Export gestartet', 'success')
    } catch {
      addToast('Export fehlgeschlagen', 'error')
    } finally {
      setLoadingPCF(false)
    }
  }

  const handleExportMeasures = async () => {
    setLoadingMeasures(true)
    try {
      await exportMeasures(year || undefined)
      addToast('Maßnahmen-Export gestartet', 'success')
    } catch {
      addToast('Export fehlgeschlagen', 'error')
    } finally {
      setLoadingMeasures(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">CSV Export</h1>
        <p className="text-sm text-gray-500 mt-0.5">Daten als CSV herunterladen</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berichtsjahr</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-accent focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Alle Jahre</option>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubmissionStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-accent focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Alle Status</option>
              {(Object.entries(SUBMISSION_STATUS_LABELS) as [SubmissionStatus, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportPCF}
            disabled={loadingPCF}
            className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50"
          >
            {loadingPCF ? <LoadingSpinner size="sm" /> : '⬇'}
            PCF-Daten exportieren (CSV)
          </button>
          <button
            onClick={handleExportMeasures}
            disabled={loadingMeasures}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-secondary text-secondary rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {loadingMeasures ? <LoadingSpinner size="sm" className="text-secondary" /> : '⬇'}
            Maßnahmen exportieren (CSV)
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 italic">
          Hinweis: Status-Filter gilt nur für PCF-Export. Maßnahmen-Export filtert nur nach Jahr.
        </p>
      </div>
    </div>
  )
}
