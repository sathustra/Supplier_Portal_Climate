import client from './client'
import type { PCFRecord, PCFRecordCreate } from '@/types'

export const listPCFRecords = (submissionId: string) =>
  client.get<PCFRecord[]>(`/api/submissions/${submissionId}/pcf-records`).then((r) => r.data)

export const createPCFRecord = (submissionId: string, data: PCFRecordCreate) =>
  client.post<PCFRecord>(`/api/submissions/${submissionId}/pcf-records`, data).then((r) => r.data)

export const updatePCFRecord = (id: string, data: PCFRecordCreate) =>
  client.put<PCFRecord>(`/api/pcf-records/${id}`, data).then((r) => r.data)

export const deletePCFRecord = (id: string) =>
  client.delete(`/api/pcf-records/${id}`)
