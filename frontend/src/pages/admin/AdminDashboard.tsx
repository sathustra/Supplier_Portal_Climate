import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminListSubmissions } from '@/api/admin'
import { useToast } from '@/context/ToastContext'
import type { AdminSubmissionDetail, SubmissionStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { SUBMISSION_STATUS_LABELS } from '@/utils/enums'

const STATUS_OPTIONS: Array<{ value: SubmissionStatus | ''; label: string }> = [
  { value: '', label: 'Alle Status' },
  { value: 'draft', label: SUBMISSION_STATUS_LABELS.draft },
  { value: 'submitted', label: SUBMISSION_STATUS_LABELS.submitted },
  { value: 'under_review', label: SUBMISSION_STATUS_LABELS.under_review },
  { value: 'approved', label: SUBMISSION_STATUS_LABELS.approved },
  { value: 'rejected', label: SUBMISSION_STATUS_LABELS.rejected },
]

export default function AdminDashboard() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<AdminSubmissionDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('')

  const load = (status: SubmissionStatus | '') => {
    setIsLoading(true)
    adminListSubmissions(status || undefined)
      .then(setSubmissions)
      .catch(() => addToast('Submissions konnten nicht geladen werden', 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Alle Submissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin-Übersicht</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | '')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" className="text-secondary" />
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState title="Keine Submissions gefunden" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Firma</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Land</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Berichtsjahr</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Eingereicht am</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => navigate(`/admin/${sub.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{sub.supplier_company_name}</td>
                  <td className="px-5 py-3 text-gray-600">{sub.supplier_country}</td>
                  <td className="px-5 py-3 text-gray-700">{sub.reporting_year}</td>
                  <td className="px-5 py-3"><StatusBadge status={sub.status} /></td>
                  <td className="px-5 py-3 text-gray-500">
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-secondary text-xs font-medium">Details →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
