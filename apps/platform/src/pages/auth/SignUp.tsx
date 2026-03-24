import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Shield, UserPlus, Eye, EyeOff, Mail, Lock, CheckCircle2, ArrowRight, Zap, Code2 } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { useRegisterMutation } from "../../mutations/useAuthMutations"

const Signup: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const { updateAuthData } = useAuthStore()
  const navigate = useNavigate()

  const registerMutation = useRegisterMutation({
    onSuccess: (data) => {
      updateAuthData(data.token, data.userId, data.onboarded)
      if (!data.onboarded) {
        navigate("/onboard")
      } else {
        navigate("/dashboard")
      }
    },
    onError: (err: any) => {
      setError(err.message || "Registration failed")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password || !confirmPassword) {
      setError("All fields are required")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    registerMutation.mutate({ email, password })
  }

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: "" }
    if (pass.length < 6) return { strength: 1, label: "Weak" }
    if (pass.length < 8) return { strength: 2, label: "Fair" }
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return { strength: 4, label: "Strong" }
    return { strength: 3, label: "Good" }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-300/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-green-100/40 to-teal-200/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-green-50/50 to-emerald-100/30 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating grid pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">


        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100/50 p-8 relative overflow-hidden transition-all duration-300 hover:shadow-3xl hover:-translate-y-2">
          {/* Card background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-gradient-to-br from-green-500/10 to-emerald-600/10" />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-heading text-slate-800 mb-2">Create Account</h2>
              <p className="text-slate-600">Get started with AI-powered QA testing</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-green-200/50 bg-white/50  focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-200 placeholder:text-slate-400"
                    placeholder="you@company.com"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/10 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="w-5 h-5  text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-green-200/50 bg-white/50  focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-200 placeholder:text-slate-400"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.strength === 1 ? 'bg-red-400 w-1/4' :
                              passwordStrength.strength === 2 ? 'bg-yellow-400 w-2/4' :
                                passwordStrength.strength === 3 ? 'bg-blue-400 w-3/4' :
                                  passwordStrength.strength === 4 ? 'bg-green-400 w-full' : 'w-0'
                            }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.strength === 1 ? 'text-red-600' :
                          passwordStrength.strength === 2 ? 'text-yellow-600' :
                            passwordStrength.strength === 3 ? 'text-blue-600' :
                              passwordStrength.strength === 4 ? 'text-green-600' : ''
                        }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle2 className={`w-5 h-5 transition-colors ${confirmPassword && password === confirmPassword ? 'text-green-500' : 'text-slate-400'
                      }`} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-white/80  focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 placeholder:text-slate-400 ${confirmPassword && password !== confirmPassword
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-green-200/50 focus:border-green-400'
                      }`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="group w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-center gap-3 relative z-10">
                  {registerMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-600">Already have an account?</span>
                <Link
                  to="/login"
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors relative group"
                >
                  Sign In
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300" />
                </Link>
              </div>
            </form>
          </div>

          {/* Tech badges */}
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-60">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>

            <div className="w-8 h-0.5 bg-green-300"></div>
            <div className="w-2 h-2 rounded-full bg-green-300"></div>
          </div>
          <p className="text-xs text-slate-500">Step 1 of 2 • Profile Setup</p>
        </div>
      </div>
    </div>
  )
}

export default Signup