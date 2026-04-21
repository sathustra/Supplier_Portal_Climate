import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { listPCFRecords, createPCFRecord, updatePCFRecord, deletePCFRecord } from '@/api/pcfRecords'
import { useToast } from '@/context/ToastContext'
import type { PCFRecord } from '@/types'
import type { WizardOutletContext } from './WizardLayout'
import DataTable, { type Column } from '@/components/DataTable'
import ConfirmDialog from '@/components/ConfirmDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { pcfRecordSchema, type PCFRecordFormData } from '@/utils/validation'
import {
  SYSTEM_BOUNDARY_LABELS,
  METHODOLOGY_LABELS,
  ALLOCATION_METHOD_LABELS,
  YEAR_OPTIONS,
} from '@/utils/enums'

const BREAKDOWN_FIELDS: Array<{ key: keyof PCFRecordFormData; label: string }> = [
  { key: 'raw_material_emissions', label: 'Rohstoffe' },
  { key: 'production_energy_emissions', label: 'Energie Produktion' },
  { key: 'upstream_transport_emissions', label: 'Transport vorgelagert' },
  { key: 'packaging_emissions', label: 'Verpackung' },
  { key: 'other_emissions', label: 'Sonstige' },
]

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-100">
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 italic mt-0.5">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

const inputCls = (disabled: boolean) =>
  `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-accent'}`

const selectCls = (disabled: boolean) =>
  `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-accent'}`

export default function Step1_PCF() {
  const { submission, readOnly } = useOutletContext<WizardOutletContext>()
  const { addToast } = useToast()
  const [records, setRecords] = useState<PCFRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<PCFRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PCFRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [apiWarnings, setApiWarnings] = useState<string[]>([])

  const load = () => {
    listPCFRecords(submission.id)
      .then(setRecords)
      .catch(() => addToast('PCF-Einträge konnten nicht geladen werden', 'error'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [submission.id])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<PCFRecordFormData>({
    resolver: zodResolver(pcfRecordSchema),
    defaultValues: { externally_verified: false, calculation_year: new Date().getFullYear() },
  })

  const watchVerified = watch('externally_verified')
  const watchPCFTotal = watch('pcf_total') ?? 0
  const watchBreakdown = BREAKDOWN_FIELDS.map((f) => watch(f.key as any) ?? 0)
  const breakdownSum = watchBreakdown.reduce((a: number, b: number) => a + (b || 0), 0)
  const deviation = watchPCFTotal > 0 ? Math.abs(breakdownSum - watchPCFTotal) / watchPCFTotal : 0

  const openAdd = () => {
    setEditRecord(null)
    reset({ externally_verified: false, calculation_year: new Date().getFullYear() })
    setApiWarnings([])
    setPanelOpen(true)
  }

  const openEdit = (rec: PCFRecord) => {
    setEditRecord(rec)
    reset(rec as any)
    setApiWarnings([])
    setPanelOpen(true)
  }

  const onSubmit = async (data: PCFRecordFormData) => {
    setIsSaving(true)
    try {
      let saved: PCFRecord
      if (editRecord) {
        saved = await updatePCFRecord(editRecord.id, data as any)
      } else {
        saved = await createPCFRecord(submission.id, data as any)
      }
      setApiWarnings(saved.warnings ?? [])
      addToast(editRecord ? 'PCF-Eintrag aktualisiert' : 'PCF-Eintrag hinzugefügt', 'success')
      load()
      if (!saved.warnings?.length) setPanelOpen(false)
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
      await deletePCFRecord(deleteTarget.id)
      addToast('PCF-Eintrag gelöscht', 'success')
      load()
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Fehler beim Löschen', 'error')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns: Column<PCFRecord>[] = [
    { header: 'Artikelnr.', accessor: 'article_number' },
    { header: 'Produktname', accessor: 'product_name' },
    {
      header: 'PCF [kg CO₂e]',
      accessor: (r) => <span className="font-mono">{r.pcf_total.toFixed(3)}</span>,
    },
    { header: 'Einheit', accessor: 'functional_unit' },
    {
      header: 'Systemgrenze',
      accessor: (r) => SYSTEM_BOUNDARY_LABELS[r.system_boundary],
    },
    {
      header: 'Methodik',
      accessor: (r) => METHODOLOGY_LABELS[r.methodology],
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">PCF-Daten erfassen</h2>
        {!readOnly && (
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors"
          >
            + Artikel hinzufügen
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        keyFn={(r) => r.id}
        emptyTitle="Keine PCF-Einträge"
        emptyDescription="Fügen Sie Ihren ersten Artikel hinzu."
        onEdit={readOnly ? undefined : openEdit}
        onDelete={readOnly ? undefined : setDeleteTarget}
      />

      {/* Slide-over panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPanelOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {editRecord ? 'Eintrag bearbeiten' : 'Neuer Artikel'}
              </h3>
              <button onClick={() => setPanelOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {apiWarnings.length > 0 && (
              <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Hinweis</p>
                {apiWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600">{w}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-6 py-4">
              <FieldGroup title="Stammdaten">
                <Field label="Artikelnummer *" error={errors.article_number?.message}>
                  <input {...register('article_number')} className={inputCls(false)} />
                </Field>
                <Field label="Produktname *" error={errors.product_name?.message}>
                  <input {...register('product_name')} className={inputCls(false)} />
                </Field>
                <Field label="Funktionelle Einheit *" hint='z.B. "1 kg", "1 Stück"' error={errors.functional_unit?.message}>
                  <input {...register('functional_unit')} className={inputCls(false)} />
                </Field>
                <Field label="Berechnungsjahr *" error={errors.calculation_year?.message}>
                  <select {...register('calculation_year', { valueAsNumber: true })} className={selectCls(false)}>
                    {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
              </FieldGroup>

              <FieldGroup title="Methodik">
                <Field label="Systemgrenze *" error={errors.system_boundary?.message}>
                  <select {...register('system_boundary')} className={selectCls(false)}>
                    <option value="">Bitte wählen…</option>
                    {Object.entries(SYSTEM_BOUNDARY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Methodik *" error={errors.methodology?.message}>
                  <select {...register('methodology')} className={selectCls(false)}>
                    <option value="">Bitte wählen…</option>
                    {Object.entries(METHODOLOGY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Primärdatenanteil [%]" hint="0–100" error={errors.primary_data_share?.message}>
                  <input type="number" min={0} max={100} step={0.1} {...register('primary_data_share', { valueAsNumber: true })} className={inputCls(false)} />
                </Field>
                <Field label="Allokationsmethode">
                  <select {...register('allocation_method')} className={selectCls(false)}>
                    <option value="">Keine Angabe</option>
                    {Object.entries(ALLOCATION_METHOD_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>

              <FieldGroup title="Emissionen">
                <div className="sm:col-span-2">
                  <Field label="PCF gesamt * [kg CO₂e / funkionelle Einheit]" error={errors.pcf_total?.message}>
                    <input type="number" min={0} step={0.001} {...register('pcf_total', { valueAsNumber: true })} className={inputCls(false)} />
                  </Field>
                </div>
                {BREAKDOWN_FIELDS.map((f) => (
                  <Field key={f.key} label={`${f.label} [kg CO₂e]`}>
                    <input type="number" min={0} step={0.001} {...register(f.key as any, { valueAsNumber: true })} className={inputCls(false)} />
                  </Field>
                ))}
                {watchBreakdown.some((v) => v > 0) && (
                  <div className="sm:col-span-2">
                    <div className={`text-xs p-2 rounded-lg ${deviation > 0.2 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700'}`}>
                      Summe Aufschlüsselung: <strong>{breakdownSum.toFixed(3)}</strong> kg CO₂e
                      {watchPCFTotal > 0 && (
                        <span className="ml-2">
                          (Abweichung: {(deviation * 100).toFixed(1)}%{deviation > 0.2 ? ' ⚠' : ' ✓'})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </FieldGroup>

              <FieldGroup title="Materialzusammensetzung">
                <Field label="Recyclinganteil [%]" error={errors.recycled_content_share?.message}>
                  <input type="number" min={0} max={100} step={0.1} {...register('recycled_content_share', { valueAsNumber: true })} className={inputCls(false)} />
                </Field>
                <Field label="Biobasierter Anteil [%]" error={errors.bio_based_share?.message}>
                  <input type="number" min={0} max={100} step={0.1} {...register('bio_based_share', { valueAsNumber: true })} className={inputCls(false)} />
                </Field>
              </FieldGroup>

              <FieldGroup title="Verifizierung">
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Controller
                      control={control}
                      name="externally_verified"
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${field.value ? 'bg-secondary' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      )}
                    />
                    <span className="text-sm font-medium text-gray-700">Extern verifiziert</span>
                  </label>
                </div>
                {watchVerified && (
                  <div className="sm:col-span-2">
                    <Field label="Verifizierungsstandard">
                      <input {...register('verification_standard')} className={inputCls(false)} placeholder="z.B. ISO 14067:2018" />
                    </Field>
                  </div>
                )}
              </FieldGroup>

              <FieldGroup title="Sonstiges">
                <Field label="Biogene Emissionen [kg CO₂e]">
                  <input type="number" step={0.001} {...register('biogenic_emissions', { valueAsNumber: true })} className={inputCls(false)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Bemerkungen">
                    <textarea {...register('remarks')} rows={3} className={`${inputCls(false)} resize-none`} />
                  </Field>
                </div>
              </FieldGroup>

              <div className="pt-2 pb-6 flex justify-end gap-3">
                <button type="button" onClick={() => setPanelOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
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
        title="Eintrag löschen"
        message={`Möchten Sie "${deleteTarget?.product_name}" wirklich löschen?`}
        confirmLabel="Löschen"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  )
}
