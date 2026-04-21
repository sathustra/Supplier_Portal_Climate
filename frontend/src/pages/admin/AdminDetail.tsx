import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminGetSubmission, adminListPCFRecords, adminGetReductionTarget, adminListMeasures, reviewSubmission } from '@/api/admin'
import { useToast } from '@/context/ToastContext'
import type { AdminSubmissionDetail, PCFRecord, ReductionMeasure, ReductionTarget } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import DataTable, { type Column } from '@/components/DataTable'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  SYSTEM_BOUNDARY_LABELS,
  METHODOLOGY_LABELS,
  SBTI_STATUS_LABELS,
  AFFECTED_SCOPE_LABELS,
  MEASURE_STATUS_LABELS,
  RELEVANCE_LABELS,
} from '@/utils/enums'

type Tab = 'pcf' | 'targets' | 'measures'

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<AdminSubmissionDetail | null>(null)
  const [pcfRecords, setPcfRecords] = useState<PCFRecord[]>([])
  const [target, setTarget] = useState<ReductionTarget | null>(null)
  const [measures, setMeasures] = useState<ReductionMeasure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pcf')
  const [comment, setComment] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      adminGetSubmission(id),
      adminListPCFRecords(id),
      adminGetReductionTarget(id).catch(() => null),
      adminListMeasures(id),
    ])
      .then(([sub, pcf, t, m]) => {
        setSubmission(sub)
        setPcfRecords(pcf)
        setTarget(t)
        setMeasures(m)
        setComment(sub.reviewer_comment ?? '')
      })
      .catch(() => addToast('Daten konnten nicht geladen werden', 'error'))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!id) return
    setIsReviewing(true)
    try {
      await reviewSubmission(id, status, comment || undefined)
      addToast(status === 'approved' ? 'Submission genehmigt' : 'Submission abgelehnt', 'success')
      navigate('/admin')
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Fehler beim Review', 'error')
    } finally {
      setIsReviewing(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" className="text-secondary" /></div>
  }
  if (!submission) return null

  const pcfColumns: Column<PCFRecord>[] = [
    { header: 'Artikelnr.', accessor: 'article_number' },
    { header: 'Produkt', accessor: 'product_name' },
    { header: 'PCF [kg CO₂e]', accessor: (r) => r.pcf_total.toFixed(3) },
    { header: 'Einheit', accessor: 'functional_unit' },
    { header: 'Systemgrenze', accessor: (r) => SYSTEM_BOUNDARY_LABELS[r.system_boundary] },
    { header: 'Methodik', accessor: (r) => METHODOLOGY_LABELS[r.methodology] },
    { header: 'Verifiziert', accessor: (r) => r.externally_verified ? '✓' : '—' },
  ]

  const measureColumns: Column<ReductionMeasure>[] = [
    { header: 'Maßnahme', accessor: 'measure_name' },
    { header: 'Scope', accessor: (m) => AFFECTED_SCOPE_LABELS[m.affected_scope] },
    { header: 'Status', accessor: (m) => MEASURE_STATUS_LABELS[m.status] },
    { header: 'Jahr', accessor: (m) => m.implementation_year ?? '—' },
    { header: 'Einsparung [t CO₂e/a]', accessor: (m) => m.expected_savings_tco2e?.toFixed(1) ?? '—' },
    { header: 'Relevanz', accessor: (m) => RELEVANCE_LABELS[m.relevant_to_our_supply] },
  ]

  const canReview = submission.status === 'submitted' || submission.status === 'under_review'

  return (
    <div>
      <button onClick={() => navigate('/admin')} className="text-secondary text-sm hover:underline mb-4 block">
        ← Alle Submissions
      </button>

      {/* Supplier info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">{submission.supplier_company_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{submission.supplier_contact_email} · {submission.supplier_country}</p>
          </div>
          <div className="text-right">
            <div className="mb-1"><StatusBadge status={submission.status} /></div>
            <p className="text-xs text-gray-500">Berichtsjahr: <strong>{submission.reporting_year}</strong></p>
            {submission.submitted_at && (
              <p className="text-xs text-gray-400">Eingereicht: {new Date(submission.submitted_at).toLocaleDateString('de-DE')}</p>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-secondary">{submission.pcf_count}</div>
            <div className="text-xs text-gray-500">PCF-Einträge</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-secondary">{submission.measures_count}</div>
            <div className="text-xs text-gray-500">Maßnahmen</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-secondary">{submission.has_target ? '✓' : '—'}</div>
            <div className="text-xs text-gray-500">Klimaziel</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(['pcf', 'targets', 'measures'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
          >
            {t === 'pcf' ? 'PCF-Daten' : t === 'targets' ? 'Klimaziele' : 'Maßnahmen'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        {tab === 'pcf' && (
          <DataTable columns={pcfColumns} data={pcfRecords} keyFn={(r) => r.id} emptyTitle="Keine PCF-Einträge" />
        )}
        {tab === 'targets' && (
          target ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['Klimaziel', target.has_climate_target ? 'Ja' : 'Nein'],
                ['SBTi-Status', SBTI_STATUS_LABELS[target.sbti_status]],
                ['Basisjahr', target.base_year ?? '—'],
                ['Near-Term Zieljahr', target.near_term_target_year ?? '—'],
                ['Net-Zero Zieljahr', target.net_zero_target_year ?? '—'],
                ['Reduktion Scope 1+2', target.scope_1_2_reduction_pct != null ? `${target.scope_1_2_reduction_pct}%` : '—'],
                ['Reduktion Scope 3', target.scope_3_reduction_pct != null ? `${target.scope_3_reduction_pct}%` : '—'],
                ['Int. CO₂-Preis', target.internal_carbon_price != null ? `${target.internal_carbon_price} €/t` : '—'],
                ['CDP-Teilnahme', target.cdp_participation ? 'Ja' : 'Nein'],
                ['CDP-Score', target.cdp_score ?? '—'],
              ].map(([label, value]) => (
                <div key={String(label)} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="font-medium text-gray-800">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-8">Kein Klimaziel erfasst</p>
          )
        )}
        {tab === 'measures' && (
          <DataTable columns={measureColumns} data={measures} keyFn={(m) => m.id} emptyTitle="Keine Maßnahmen" />
        )}
      </div>

      {/* Review section */}
      {canReview && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Review</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Optionaler Kommentar für den Supplier…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-accent resize-none mb-4"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleReview('rejected')}
              disabled={isReviewing}
              className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isReviewing && <LoadingSpinner size="sm" />}
              ✕ Ablehnen
            </button>
            <button
              onClick={() => handleReview('approved')}
              disabled={isReviewing}
              className="px-5 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isReviewing && <LoadingSpinner size="sm" />}
              ✓ Genehmigen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
