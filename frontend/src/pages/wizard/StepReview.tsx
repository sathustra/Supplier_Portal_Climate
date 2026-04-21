import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { listPCFRecords } from '@/api/pcfRecords'
import { getReductionTarget } from '@/api/reductionTargets'
import { listMeasures } from '@/api/reductionMeasures'
import { submitSubmission } from '@/api/submissions'
import { useToast } from '@/context/ToastContext'
import type { PCFRecord, ReductionMeasure, ReductionTarget } from '@/types'
import type { WizardOutletContext } from './WizardLayout'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { SBTI_STATUS_LABELS } from '@/utils/enums'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={ok ? 'text-green-500' : 'text-gray-400'}>{ok ? '☑' : '☐'}</span>
      <span className={ok ? 'text-gray-800' : 'text-gray-500'}>{label}</span>
    </div>
  )
}

export default function StepReview() {
  const { submission, readOnly } = useOutletContext<WizardOutletContext>()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [pcfRecords, setPcfRecords] = useState<PCFRecord[]>([])
  const [target, setTarget] = useState<ReductionTarget | null>(null)
  const [measures, setMeasures] = useState<ReductionMeasure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      listPCFRecords(submission.id),
      getReductionTarget(submission.id).catch(() => null),
      listMeasures(submission.id),
    ])
      .then(([pcf, t, m]) => {
        setPcfRecords(pcf)
        setTarget(t)
        setMeasures(m)
      })
      .catch(() => addToast('Daten konnten nicht geladen werden', 'error'))
      .finally(() => setIsLoading(false))
  }, [submission.id])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await submitSubmission(submission.id)
      addToast('Erfolgreich eingereicht!', 'success')
      navigate('/dashboard')
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Fehler beim Einreichen', 'error')
    } finally {
      setIsSubmitting(false)
      setConfirmOpen(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" className="text-secondary" /></div>
  }

  const avgPCF = pcfRecords.length > 0
    ? pcfRecords.reduce((s, r) => s + r.pcf_total, 0) / pcfRecords.length
    : 0
  const totalSavings = measures.reduce((s, m) => s + (m.expected_savings_tco2e ?? 0), 0)
  const hasPCF = pcfRecords.length > 0

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-6">Übersicht & Einreichen</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="PCF-Daten">
          <p className="text-2xl font-bold text-primary">{pcfRecords.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Artikel erfasst</p>
          {pcfRecords.length > 0 && (
            <p className="text-xs text-gray-600 mt-2">
              Ø PCF: <strong>{avgPCF.toFixed(3)} kg CO₂e</strong>
            </p>
          )}
        </Card>

        <Card title="Klimaziele">
          {target ? (
            <div>
              <p className="text-sm font-semibold text-gray-800">{SBTI_STATUS_LABELS[target.sbti_status]}</p>
              {target.base_year && (
                <p className="text-xs text-gray-500 mt-1">Basisjahr: {target.base_year}</p>
              )}
              {target.near_term_target_year && (
                <p className="text-xs text-gray-500">Zieljahr: {target.near_term_target_year}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Nicht ausgefüllt</p>
          )}
        </Card>

        <Card title="Reduktionsmaßnahmen">
          <p className="text-2xl font-bold text-primary">{measures.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Maßnahmen erfasst</p>
          {totalSavings > 0 && (
            <p className="text-xs text-gray-600 mt-2">
              Σ Einsparung: <strong>{totalSavings.toFixed(1)} t CO₂e/a</strong>
            </p>
          )}
        </Card>
      </div>

      {/* Current status */}
      <div className="mb-4">
        <span className="text-sm text-gray-600 mr-2">Status:</span>
        <StatusBadge status={submission.status} />
        {submission.reviewer_comment && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Kommentar des Prüfers:</strong> {submission.reviewer_comment}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Vollständigkeit</h3>
        <div className="space-y-2">
          <Check ok={hasPCF} label={`Mindestens 1 PCF-Eintrag vorhanden (${pcfRecords.length} erfasst)`} />
          <Check ok={!!target} label="Klimaziele ausgefüllt (optional, aber empfohlen)" />
          <Check ok={measures.length > 0} label={`Maßnahmen erfasst (optional, ${measures.length} vorhanden)`} />
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!hasPCF}
            className="px-6 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✓ Einreichen
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Submission einreichen"
        message="Nach dem Einreichen können Sie die Daten nicht mehr bearbeiten. Möchten Sie fortfahren?"
        confirmLabel="Jetzt einreichen"
        onConfirm={handleSubmit}
        onClose={() => setConfirmOpen(false)}
        isLoading={isSubmitting}
      />
    </div>
  )
}
