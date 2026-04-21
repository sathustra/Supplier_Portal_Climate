import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getReductionTarget, upsertReductionTarget } from '@/api/reductionTargets'
import { useToast } from '@/context/ToastContext'
import type { WizardOutletContext } from './WizardLayout'
import { targetSchema, type TargetFormData } from '@/utils/validation'
import { SBTI_STATUS_LABELS } from '@/utils/enums'
import LoadingSpinner from '@/components/LoadingSpinner'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const inputCls = (disabled: boolean) =>
  `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-accent'}`

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-secondary' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-100">
      {title}
    </h4>
  )
}

function FormRow({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 italic mt-0.5">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

export default function Step2_Targets() {
  const { submission, readOnly } = useOutletContext<WizardOutletContext>()
  const { addToast } = useToast()
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    watch,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      has_climate_target: false,
      sbti_status: 'none',
      cdp_participation: false,
    },
  })

  useEffect(() => {
    getReductionTarget(submission.id)
      .then((t) => reset(t as any))
      .catch((err) => {
        if (err.response?.status !== 404) {
          addToast('Klimaziele konnten nicht geladen werden', 'error')
        }
      })
  }, [submission.id])

  const watchHasTarget = watch('has_climate_target')
  const watchCDP = watch('cdp_participation')

  const save = async (data: TargetFormData) => {
    setSaveState('saving')
    try {
      await upsertReductionTarget(submission.id, data as any)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
      addToast('Fehler beim Speichern', 'error')
    }
  }

  // Debounced auto-save
  useEffect(() => {
    if (readOnly) return
    const subscription = watch((data) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        save(data as TargetFormData)
      }, 500)
    })
    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [watch, readOnly, submission.id])

  const saveIndicator = {
    idle: null,
    saving: <span className="text-xs text-gray-400 flex items-center gap-1"><LoadingSpinner size="sm" className="text-gray-400" /> Speichert…</span>,
    saved: <span className="text-xs text-green-600 font-medium">● Gespeichert ✓</span>,
    error: <span className="text-xs text-red-500">Fehler beim Speichern</span>,
  }[saveState]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Klimaziele</h2>
        {!readOnly && saveIndicator}
      </div>

      <form className="space-y-8 max-w-2xl">
        {/* Klimaziel */}
        <div>
          <SectionTitle title="Klimaziel" />
          <div className="flex items-center gap-3 mb-4">
            <Controller
              control={control}
              name="has_climate_target"
              render={({ field }) => (
                <Toggle value={field.value} onChange={field.onChange} disabled={readOnly} />
              )}
            />
            <span className="text-sm font-medium text-gray-700">
              Unternehmen hat ein Klimaziel
            </span>
          </div>
        </div>

        {watchHasTarget && (
          <>
            {/* SBTi */}
            <div>
              <SectionTitle title="SBTi (Science Based Targets)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormRow label="SBTi-Status">
                  <select {...register('sbti_status')} disabled={readOnly} className={inputCls(readOnly)}>
                    {Object.entries(SBTI_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Basisjahr">
                  <input type="number" min={2000} max={2030} {...register('base_year', { valueAsNumber: true })} disabled={readOnly} className={inputCls(readOnly)} placeholder="z.B. 2019" />
                </FormRow>
                <FormRow label="Near-Term Zieljahr">
                  <input type="number" min={2025} max={2050} {...register('near_term_target_year', { valueAsNumber: true })} disabled={readOnly} className={inputCls(readOnly)} placeholder="z.B. 2030" />
                </FormRow>
                <FormRow label="Net-Zero Zieljahr">
                  <input type="number" min={2030} max={2070} {...register('net_zero_target_year', { valueAsNumber: true })} disabled={readOnly} className={inputCls(readOnly)} placeholder="z.B. 2050" />
                </FormRow>
                <FormRow label="Reduktion Scope 1+2 [%]" hint="Gegenüber Basisjahr">
                  <input type="number" min={0} max={100} step={0.1} {...register('scope_1_2_reduction_pct', { valueAsNumber: true })} disabled={readOnly} className={inputCls(readOnly)} />
                </FormRow>
                <FormRow label="Reduktion Scope 3 [%]" hint="Gegenüber Basisjahr">
                  <input type="number" min={0} max={100} step={0.1} {...register('scope_3_reduction_pct', { valueAsNumber: true })} disabled={readOnly} className={inputCls(readOnly)} />
                </FormRow>
                <FormRow label="Net-Zero Reduktion [%]">
                  <input type="number" min={0} max={100} step={0.1} {...register('net_zero_reduction_pct', { valueAsNumber: true })} disabled={readOnly} className={inputCls(readOnly)} />
                </FormRow>
              </div>
            </div>

            {/* CO₂-Bepreisung & CDP */}
            <div>
              <SectionTitle title="CO₂-Bepreisung & CDP" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormRow label="Interner CO₂-Preis [EUR/t CO₂e]">
                  <input type="number" min={0} step={1} {...register('internal_carbon_price', { valueAsNumber: true })} disabled={readOnly} className={inputCls(readOnly)} placeholder="z.B. 50" />
                </FormRow>
                <div className="flex items-center gap-3 pt-6">
                  <Controller
                    control={control}
                    name="cdp_participation"
                    render={({ field }) => (
                      <Toggle value={field.value} onChange={field.onChange} disabled={readOnly} />
                    )}
                  />
                  <span className="text-sm font-medium text-gray-700">CDP-Teilnahme</span>
                </div>
                {watchCDP && (
                  <FormRow label="CDP-Score">
                    <input {...register('cdp_score')} disabled={readOnly} className={inputCls(readOnly)} placeholder="z.B. A, B, C…" />
                  </FormRow>
                )}
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
