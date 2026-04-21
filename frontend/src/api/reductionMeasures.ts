import client from './client'
import type { ReductionMeasure, ReductionMeasureCreate } from '@/types'

export const listMeasures = (submissionId: string) =>
  client.get<ReductionMeasure[]>(`/api/submissions/${submissionId}/measures`).then((r) => r.data)

export const createMeasure = (submissionId: string, data: ReductionMeasureCreate) =>
  client.post<ReductionMeasure>(`/api/submissions/${submissionId}/measures`, data).then((r) => r.data)

export const updateMeasure = (id: string, data: ReductionMeasureCreate) =>
  client.put<ReductionMeasure>(`/api/measures/${id}`, data).then((r) => r.data)

export const deleteMeasure = (id: string) => client.delete(`/api/measures/${id}`)
