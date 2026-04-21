import client from './client'
import type { AdminSubmissionDetail, SubmissionDetail, SubmissionStatus } from '@/types'

export const adminListSubmissions = (status?: SubmissionStatus) =>
  client
    .get<AdminSubmissionDetail[]>('/api/admin/submissions', { params: status ? { status } : {} })
    .then((r) => r.data)

export const adminGetSubmission = (id: string) =>
  client.get<AdminSubmissionDetail>(`/api/admin/submissions/${id}`).then((r) => r.data)

export const reviewSubmission = (id: string, status: 'approved' | 'rejected', comment?: string) =>
  client
    .patch<SubmissionDetail>(`/api/admin/submissions/${id}/review`, { status, comment })
    .then((r) => r.data)

export const adminListPCFRecords = (submissionId: string) =>
  client.get(`/api/admin/submissions/${submissionId}/pcf-records`).then((r) => r.data)

export const adminGetReductionTarget = (submissionId: string) =>
  client.get(`/api/admin/submissions/${submissionId}/reduction-target`).then((r) => r.data)

export const adminListMeasures = (submissionId: string) =>
  client.get(`/api/admin/submissions/${submissionId}/measures`).then((r) => r.data)

export const exportPCF = async (year?: number, status?: SubmissionStatus) => {
  const response = await client.get('/api/admin/export/pcf', {
    params: { ...(year ? { year } : {}), ...(status ? { status } : {}) },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `pcf_export_${year ?? 'all'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const exportMeasures = async (year?: number) => {
  const response = await client.get('/api/admin/export/measures', {
    params: year ? { year } : {},
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `measures_export_${year ?? 'all'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
