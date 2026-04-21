import client from './client'
import type { ReductionTarget, ReductionTargetUpsert } from '@/types'

export const getReductionTarget = (submissionId: string) =>
  client.get<ReductionTarget>(`/api/submissions/${submissionId}/reduction-target`).then((r) => r.data)

export const upsertReductionTarget = (submissionId: string, data: ReductionTargetUpsert) =>
  client.put<ReductionTarget>(`/api/submissions/${submissionId}/reduction-target`, data).then((r) => r.data)
