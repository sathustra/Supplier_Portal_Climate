import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listSubmissions, createSubmission } from '@/api/submissions'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import type { SubmissionOut } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { YEAR_OPTIONS } from '@/utils/enums'

export default function Dashboard() {
  const { supplier } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<SubmissionOut[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listSubmissions()
      .then(setSubmissions)
      .catch(() => addToast('Submissions konnten nicht geladen werden', 'error'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const sub = await createSubmission(selectedYear)
      addToast('Neue Abfrage erstellt', 'success')
      navigate(`/submissions/${sub.id}/pcf`)
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Fehler beim Erstellen', 'error')
    } finally {
      setCreating(false)
      setShowNewModal(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Willkommen, {supplier?.company_name}</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors"
        >
          + Neue Abfrage
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" className="text-secondary" />
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          title="Noch keine Abfragen"
          description="Starten Sie Ihre erste PCF-Datenerfassung."
          action={
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors"
            >
              Erste Abfrage starten
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Berichtsjahr</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PCF-Einträge</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Letzte Änderung</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/submissions/${sub.id}/pcf`)}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{sub.reporting_year}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {(sub as any).pcf_count ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {sub.updated_at
                      ? new Date(sub.updated_at).toLocaleDateString('de-DE')
                      : new Date(sub.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-secondary text-xs font-medium">Öffnen →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New submission modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Neue Abfrage starten</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berichtsjahr</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-accent focus:outline-none focus:ring-2 focus:ring-secondary mb-6"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 text-sm rounded-lg bg-secondary text-white hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <LoadingSpinner size="sm" />}
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
