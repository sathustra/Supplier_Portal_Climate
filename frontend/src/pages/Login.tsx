import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { login as apiLogin, getMe } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { loginSchema, type LoginFormData } from '@/utils/validation'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Login() {
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const token = await apiLogin(data.email, data.password)
      localStorage.setItem('token', token.access_token)
      const supplier = await getMe()
      login(token.access_token, supplier)
      navigate('/dashboard')
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Login fehlgeschlagen', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8 text-center">
            <div className="text-3xl mb-2">🌱</div>
            <h1 className="text-2xl font-bold text-primary">Supplier PCF Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Melden Sie sich an</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-accent"
                placeholder="max@firma.de"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-accent"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : null}
              Anmelden
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-secondary font-medium hover:underline">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
