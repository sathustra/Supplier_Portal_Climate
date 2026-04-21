import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { register as apiRegister, login as apiLogin, getMe } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { registerSchema, type RegisterFormData } from '@/utils/validation'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Register() {
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await apiRegister(data)
      const token = await apiLogin(data.contact_email, data.password)
      localStorage.setItem('token', token.access_token)
      const supplier = await getMe()
      login(token.access_token, supplier)
      addToast('Registrierung erfolgreich – willkommen!', 'success')
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(typeof detail === 'string' ? detail : 'Registrierung fehlgeschlagen', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8 text-center">
            <div className="text-3xl mb-2">🌱</div>
            <h1 className="text-2xl font-bold text-primary">Konto erstellen</h1>
            <p className="text-sm text-gray-500 mt-1">Registrieren Sie Ihr Unternehmen</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {([
              { name: 'company_name', label: 'Firmenname', type: 'text', placeholder: 'Musterfirma GmbH' },
              { name: 'country', label: 'Land (ISO-Code)', type: 'text', placeholder: 'DE' },
              { name: 'contact_name', label: 'Ansprechpartner', type: 'text', placeholder: 'Max Mustermann' },
              { name: 'contact_email', label: 'E-Mail', type: 'email', placeholder: 'max@firma.de' },
              { name: 'password', label: 'Passwort (min. 8 Zeichen)', type: 'password', placeholder: '' },
            ] as const).map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  {...register(field.name)}
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-accent"
                />
                {errors[field.name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.name]?.message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : null}
              Registrieren
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Bereits registriert?{' '}
            <Link to="/login" className="text-secondary font-medium hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
