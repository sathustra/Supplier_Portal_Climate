import type { SubmissionStatus } from '@/types'
import { SUBMISSION_STATUS_LABELS } from '@/utils/enums'

const styles: Record<SubmissionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  )
}
