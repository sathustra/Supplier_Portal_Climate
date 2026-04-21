import client from './client'
import type { Supplier, TokenResponse } from '@/types'

export const login = (email: string, password: string) =>
  client.post<TokenResponse>('/api/auth/login', { email, password }).then((r) => r.data)

export const register = (data: {
  company_name: string
  country: string
  contact_name: string
  contact_email: string
  password: string
}) => client.post<Supplier>('/api/auth/register', data).then((r) => r.data)

export const getMe = () => client.get<Supplier>('/api/auth/me').then((r) => r.data)
