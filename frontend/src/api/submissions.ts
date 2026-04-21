import client from './client'
import type { SubmissionDetail, SubmissionOut } from '@/types'

export const createSubmission = (reporting_year: number) =>
  client.post<SubmissionOut>('/api/submissions', { reporting_year }).then((r) => r.data)

export const listSubmissions = () =>
  client.get<SubmissionOut[]>('/api/submissions').then((r) => r.data)

export const getSubmission = (id: string) =>
  client.get<SubmissionDetail>(`/api/submissions/${id}`).then((r) => r.data)

export const submitSubmission = (id: string) =>
  client.patch<SubmissionOut>(`/api/submissions/${id}/submit`).then((r) => r.data)
