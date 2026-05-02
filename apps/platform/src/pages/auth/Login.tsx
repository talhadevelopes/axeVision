import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Terminal, Shield, Code2, Eye, EyeOff, ArrowRight, GitBranch, Zap, User, Crown } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import type { MemberProfile } from "@axeVision/shared"
import { useLoginMutation, useSelectMemberMutation } from "../../mutations/useAuthMutations"

const Login: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [memberChoices, setMemberChoices] = useState<MemberProfile[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { updateAuthData } = useAuthStore()
  const navigate = useNavigate()

  // login mutation
  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      try {
        const { token, userId, onboarded, memberId, memberType, members } = data

        if (members && members.length > 1) {
          // Multiple members — let user select
          setMemberChoices(members)
          setCurrentUserId(userId)
        } else {
          // Single member or none → update auth immediately
          updateAuthData(token, userId, onboarded, memberId, memberType)
          navigate("/dashboard")
        }
      } catch (err) {
        console.error("Error processing login response:", err)
        setError("An error occurred during login. Please try again.")
      }
    },
    onError: (err: any) => {
      console.error("Login error:", err)
      setPassword("")
      setError(err.message || "Login failed. Please try again.")
    },
  })

  // select member mutation
  const selectMemberMutation = useSelectMemberMutation({
    onSuccess: (data) => {
      try {
        const { token, userId, onboarded, memberId, memberType } = data
        updateAuthData(token, userId, onboarded, memberId, memberType)
        navigate("/dashboard")
      } catch (err) {
        console.error("Error updating auth:", err)
        setError("An error occurred. Please try again.")
      }
    },
    onError: (err: any) => {
      console.error("Member selection error:", err)
      setError(err.message || "Failed to select member profile.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setError("")
    setMemberChoices([])

    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }
    if (password.length < 1) {
      setError("Password is required")
      return
    }

    loginMutation.mutate({ email, password })
  }

  const handleMemberSelect = async (memberId: string) => {
    if (!currentUserId) {
      setError("User ID not found for member selection.")
      return
    }
    try {
      await selectMemberMutation.mutateAsync({ userId: currentUserId, memberId })
    } catch (err) {
      console.error("Member selection error:", err)
    }
  }

  const handleGoBack = () => {
    setMemberChoices([])
    setCurrentUserId(null)
    setError("")
    setEmail("")
    setPassword("")
  }

  const isLoading = loginMutation.isPending || selectMemberMutation.isPending

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

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {memberChoices.length > 0 ? (
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <GitBranch className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-slate-800 mb-2">Choose Your Profile</h3>
                <p className="text-slate-600">Multiple profiles detected. Select one to continue.</p>
              </div>

              <div className="space-y-3 mb-8">
                {memberChoices.map((member, index) => (
                  <button
                    key={member.memberId}
                    onClick={() => handleMemberSelect(member.memberId)}
                    disabled={isLoading}
                    className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-white to-green-50/50 border border-green-100/50 p-4 text-left transition-all duration-300 hover:shadow-xl hover:border-green-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${member.type === 'Admin'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-green-500 to-emerald-600'
                          }`}>
                          {member.type === 'Admin' ? (
                            <Crown className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-lg">{member.name}</div>
                          <div className="text-sm text-slate-600 font-medium">
                            {member.role} • {member.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGoBack}
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold font-heading text-slate-800 mb-2">Welcome Back</h2>
                <p className="text-slate-600">Sign in to your axeVision dashboard</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
                    Email Address (demo: demo@axevision.dev)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      className="w-full px-4 py-3 rounded-xl border border-green-200/50 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-200 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="demo@axevision.dev"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                    Password (demo: demo@1234)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-green-200/50 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-200 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
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
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="group w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing you in...</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>Access Dashboard</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-slate-600">New to axeVision?</span>
                  <Link
                    to="/signup"
                    className="font-semibold text-green-600 hover:text-green-700 transition-colors relative group"
                  >
                    Create Account
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300" />
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* Tech badges */}
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-60">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Bottom features */}
        <div className="mt-8 text-center opacity-80">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-green-500" />
              <span>Developer-First</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login