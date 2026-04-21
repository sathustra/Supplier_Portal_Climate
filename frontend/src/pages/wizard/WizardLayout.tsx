import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { getSubmission } from '@/api/submissions'
import { useToast } from '@/context/ToastContext'
import type { SubmissionDetail } from '@/types'
import WizardStepper from '@/components/WizardStepper'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'

const STEPS = [
  { label: 'PCF-Daten', path: 'pcf' },
  { label: 'Klimaziele', path: 'targets' },
  { label: 'Maßnahmen', path: 'measures' },
  { label: 'Übersicht', path: 'review' },
]

export interface WizardOutletContext {
  submission: SubmissionDetail
  readOnly: boolean
  refreshSubmission: () => void
}

export default function WizardLayout() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = () => {
    if (!id) return
    getSubmission(id)
      .then(setSubmission)
      .catch(() => {
        addToast('Submission nicht gefunden', 'error')
        navigate('/dashboard')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [id])

  const currentStep = STEPS.findIndex((s) => location.pathname.endsWith(s.path))
  const stepIndex = currentStep < 0 ? 0 : currentStep
  const readOnly = submission ? submission.status !== 'draft' : false

  const goToStep = (idx: number) => navigate(`/submissions/${id}/${STEPS[idx].path}`)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    )
  }
  if (!submission) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-secondary text-sm hover:underline">
          ← Dashboard
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-primary">
              Berichtsjahr {submission.reporting_year}
            </h1>
            <StatusBadge status={submission.status} />
          </div>
          {readOnly && (
            <p className="text-xs text-amber-600 mt-0.5">
              Diese Submission ist schreibgeschützt (Status: {submission.status})
            </p>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-6">
        <WizardStepper steps={STEPS} currentIndex={stepIndex} />
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <Outlet context={{ submission, readOnly, refreshSubmission: load } satisfies WizardOutletContext} />
      </div>

      {/* Bottom navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => stepIndex > 0 ? goToStep(stepIndex - 1) : navigate('/dashboard')}
          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {stepIndex > 0 ? '← Zurück' : '← Dashboard'}
        </button>
        {stepIndex < STEPS.length - 1 && (
          <button
            onClick={() => goToStep(stepIndex + 1)}
            className="px-5 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-primary transition-colors"
          >
            Weiter →
          </button>
        )}
      </div>
    </div>
  )
}
