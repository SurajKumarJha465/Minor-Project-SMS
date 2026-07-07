import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookMarked, ShieldCheck, GraduationCap, Users, UserCog } from 'lucide-react'
import Button from '../../../components/ui/Button.jsx'
import roleConfig from '../../../config/roleConfig.js'

const ROLE_OPTIONS = [
  { key: 'superAdmin', label: 'Super Admin', icon: ShieldCheck },
  { key: 'hod', label: 'HOD', icon: UserCog },
  { key: 'teacher', label: 'Teacher', icon: Users },
  { key: 'student', label: 'Student', icon: GraduationCap }
]

/**
 * Login — a single entry point that routes to the correct dashboard based on
 * the selected role. Today this is a role switcher (no backend yet); once
 * auth exists, replace handleLogin's body with a real API call and use the
 * returned role instead of the manually selected one.
 */
export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('superAdmin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password to continue.')
      return
    }
    setError('')
    navigate(roleConfig[role].base)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <BookMarked size={22} className="text-indigo" />
          <span className="font-display font-semibold text-xl">SMS Registry</span>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white border border-paper-line rounded-card shadow-lifted p-6"
        >
          <span className="label-tab text-indigo">Sign in</span>
          <h1 className="font-display text-xl mb-5 mt-1">Welcome back</h1>

          <label className="label-tab block mb-1.5">I AM SIGNING IN AS</label>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {ROLE_OPTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-sm font-medium
                            border transition-colors
                            ${role === key
                              ? 'bg-indigo text-white border-indigo'
                              : 'bg-white text-ink-soft border-paper-line hover:border-indigo/40'}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-tab block mb-1.5">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sms.edu"
                className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                           text-sm outline-none focus:border-indigo/50"
              />
            </div>
            <div>
              <label className="label-tab block mb-1.5">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                           text-sm outline-none focus:border-indigo/50"
              />
            </div>
          </div>

          {error && <p className="text-xs text-brick mt-3">{error}</p>}

          <Button type="submit" className="w-full justify-center mt-5">
            Sign in as {ROLE_OPTIONS.find((r) => r.key === role)?.label}
          </Button>
        </form>

        <p className="text-center text-xs text-ink-faint mt-4">
          This is a role switcher for the prototype — real credential checking
          plugs in here once the API is connected.
        </p>
      </div>
    </div>
  )
}