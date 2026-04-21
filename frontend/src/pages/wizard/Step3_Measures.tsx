import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { listMeasures, createMeasure, updateMeasure, deleteMeasure } from '@/api/reductionMeasures'
import { useToast } from '@/context/ToastContext'
import type { ReductionMeasure } from '@/types'
import type { WizardOutletContext } from './WizardLayout'
import DataTable, { type Column } from '@/components/DataTable'
import ConfirmDialog from '@/components/ConfirmDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { measureSchema, type MeasureFormData } from '@/utils/validation'
import {
  AFFECTED_SCOPE_LABELS,
  MEASURE_STATUS_LABELS,
  RELEVANCE_LABELS,
  YEAR_OPTIONS,
} from '@/utils/enums'

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-accent'
const selectCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-accent'

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 italic mt-0.5">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

export default function Step3_Measures() {
  const { submission, readOnly } = useOutletContext<WizardOutletContext>()
  const { addToast } = useToast()
  const [measures, setMeasures] = useState<ReductionMeasure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ReductionMeasure | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReductionMeasure | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = () => {
    listMeasures(submission.id)
      .then(setMeasures)
      .catch(() => addToast('Maßnahmen konnten nicht geladen werden', 'error'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [submission.id])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeasureFormData>({
    resolver: zodResolver(measureSchema),
    defaultValues: { relevant_to_our_supply: 'partially' },
  })

  const openAdd = () => {
    setEditTarget(null)
    reset({ relevant_to_our_supply: 'partially' })
    setModalOpen(true)
  }
  const openEdit = (m: ReductionMeasure) => {
    setEditTarget(m)
    reset(m as any)
    setModalOpen(true)
  }

  const onSubmit = async (data: MeasureFormData) => {
    setIsSaving(true)
    try {
      if (editTarget) {
        await updateMeasure(editTarget.id, data as any)
      } else {
        await createMeasure(submission.id, data as any)
      }
      addToast(editTarget ? 'Maßnahme aktualisiert' : 'Maßnahme hinzugefügt', 'success')
      load()
      setModalOpen(false)
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Fehler beim Speichern', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteMeasure(deleteTarget.id)
      addToast('Maßnahme gelöscht', 'success')
      load()
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Fehler beim Löschen', 'error')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const totalSavings = measures.reduce((s, m) => s + (m.expected_savings_tco2e ?? 0), 0)
  const totalCapex = measures.reduce((s, m) => s + (m.capex_eur ?? 0), 0)

  const columns: Column<ReductionMeasure>[] = [
    { header: 'Maßnahme', accessor: 'measure_name' },
    { header: 'Scope', accessor: (m) => AFFECTED_SCOPE_LABELS[m.affected_scope] },
    { header: 'Status', accessor: (m) => MEASURE_STATUS_LABELS[m.status] },
    { header: 'Jahr', accessor: (m) => m.implementation_year ?? '—' },
    {
      header: 'Einsparung [t CO₂e/a]',
      accessor: (m) => m.expected_savings_tco2e != null ? m.expected_savings_tco2e.toFixed(1) : '—',
    },
    { header: 'Relevanz', accessor: (m) => RELEVANCE_LABELS[m.relevant_to_our_supply] },
  ]

  const footer = measures.length > 0 ? (
    <tr>
      <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-gray-600 text-right">Summe:</td>
      <td className="px-4 py-2 text-xs font-semibold text-gray-800">
        {totalSavings.toFixed(1)} t CO₂e/a
        {totalCapex > 0 && <span className="ml-2 text-gray-500">/ {totalCapex.toLocaleString('de-DE')} €</span>}
      </td>
      <td />
    </tr>
  ) : undefined

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Reduktionsmaßnahmen</h2>
        {!readOnly && (
          <button onClick={openAdd} className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors">
            + Maßnahme hinzufügen
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={measures}
        isLoading={isLoading}
        keyFn={(m) => m.id}
        emptyTitle="Keine Maßnahmen"
        emptyDescription="Erfassen Sie Ihre Klimaschutzmaßnahmen."
        onEdit={readOnly ? undefined : openEdit}
        onDelete={readOnly ? undefined : setDeleteTarget}
        footerRow={footer}
      />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {editTarget ? 'Maßnahme bearbeiten' : 'Neue Maßnahme'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <Field label="Maßnahmenname *" error={errors.measure_name?.message}>
                <input {...register('measure_name')} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Betroffener Scope *" error={errors.affected_scope?.message}>
                  <select {...register('affected_scope')} className={selectCls}>
                    <option value="">Bitte wählen…</option>
                    {Object.entries(AFFECTED_SCOPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status *" error={errors.status?.message}>
                  <select {...register('status')} className={selectCls}>
                    <option value="">Bitte wählen…</option>
                    {Object.entries(MEASURE_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Umsetzungsjahr">
                  <select {...register('implementation_year', { valueAsNumber: true })} className={selectCls}>
                    <option value="">Keine Angabe</option>
                    {[...YEAR_OPTIONS, ...Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i + 1)].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Erwartete Einsparung [t CO₂e/a]">
                  <input type="number" min={0} step={0.1} {...register('expected_savings_tco2e', { valueAsNumber: true })} className={inputCls} />
                </Field>
                <Field label="Investitionskosten [EUR]">
                  <input type="number" min={0} step={1000} {...register('capex_eur', { valueAsNumber: true })} className={inputCls} />
                </Field>
                <Field label="Relevanz für unsere Lieferkette">
                  <select {...register('relevant_to_our_supply')} className={selectCls}>
                    {Object.entries(RELEVANCE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Bemerkungen">
                <textarea {...register('remarks')} rows={2} className={`${inputCls} resize-none`} />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Abbrechen
                </button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSaving && <LoadingSpinner size="sm" />}
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Maßnahme löschen"
        message={`Möchten Sie "${deleteTarget?.measure_name}" wirklich löschen?`}
        confirmLabel="Löschen"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  )
}
