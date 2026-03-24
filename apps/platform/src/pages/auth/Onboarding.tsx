import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Shield, User, Crown, Briefcase, ArrowRight, Sparkles, CheckCircle2, Zap, Code2 } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { useOnboardMutation } from "../../mutations/useAuthMutations"

const OnboardingPage: React.FC = () => {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [type, setType] = useState<"Admin" | "Member">("Member")
  const [error, setError] = useState("")

  const { user, updateAuthData } = useAuthStore()
  const navigate = useNavigate()

  const onboardMutation = useOnboardMutation({
    onSuccess: (data) => {
      updateAuthData(
        data.token,
        user!.userId,
        data.onboarded,
        data.member.memberId,
        data.member.type
      )
      alert("Onboarding complete! Welcome to axeVision.")
      navigate("/dashboard")
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during onboarding."
      setError(message)
      console.error("Onboarding error:", err)
    }
  })

  const isLoading = onboardMutation.status === "pending"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !role.trim() || !type) {
      setError("All fields are required.")
      return
    }

    if (!user?.userId) {
      setError("Authentication error. Please log in again.")
      return
    }

    onboardMutation.mutate({ name, role, type })
  }

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.onboarded && !isLoading) {
      navigate("/dashboard")
    }
  }, [user?.onboarded, navigate, isLoading])

  if (user?.onboarded && !isLoading) return null

  const roleOptions = [
    "QA Engineer", "Senior QA Engineer", "Lead QA Engineer", "QA Manager",
    "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer",
    "UI/UX Designer", "Product Manager", "Scrum Master", "Tech Lead",
    "Accessibility Specialist", "Performance Engineer", "Security Engineer", "Other"
  ]

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

      <div className="w-full max-w-lg relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-green-400/20 blur-lg animate-pulse opacity-60" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 bg-clip-text text-transparent font-heading">
            Welcome to axeVision
          </h1>
          <p className="text-slate-600 font-medium mt-2">Let's set up your profile to get started</p>
        </div>

        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100/50 p-8 relative overflow-hidden transition-all duration-300 hover:shadow-3xl hover:-translate-y-2">
          {/* Card background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-gradient-to-br from-green-500/10 to-emerald-600/10" />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-heading text-slate-800 mb-2">Complete Your Profile</h2>
              <p className="text-slate-600">Set up your team member profile to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-green-200/50 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-200 placeholder:text-slate-400"
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="role">
                  Professional Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Briefcase className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-green-200/50 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-200 placeholder:text-slate-400"
                    placeholder="e.g., Senior QA Engineer"
                    required
                    list="role-suggestions"
                  />
                  <datalist id="role-suggestions">
                    {roleOptions.map(option => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Start typing to see suggestions</p>
              </div>

              {/* Account Type */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Account Type
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Member Option */}
                  <div 
                    onClick={() => setType("Member")}
                    className={`group relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      type === "Member" 
                        ? 'border-green-400 bg-green-50/50 shadow-md' 
                        : 'border-green-200/50 bg-white/50 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                        type === "Member" 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 scale-110' 
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                      }`}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">Team Member</h3>
                          {type === "Member" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Standard access for QA testing, snapshots, and accessibility checks
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="type"
                      value="Member"
                      checked={type === "Member"}
                      onChange={(e) => setType(e.target.value as "Admin" | "Member")}
                      className="sr-only"
                    />
                  </div>

                  {/* Admin Option */}
                  <div 
                    onClick={() => setType("Admin")}
                    className={`group relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      type === "Admin" 
                        ? 'border-amber-400 bg-amber-50/50 shadow-md' 
                        : 'border-green-200/50 bg-white/50 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                        type === "Admin" 
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 scale-110' 
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                      }`}>
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">Team Admin</h3>
                          {type === "Admin" && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Full access including team management, reports, and advanced Team Management
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="type"
                      value="Admin"
                      checked={type === "Admin"}
                      onChange={(e) => setType(e.target.value as "Admin" | "Member")}
                      className="sr-only"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-3 mt-3">
                  <p className="text-xs text-blue-700 flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You can change your account type later in team Management page. Admins can manage team members and access advanced features.</span>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-center gap-3 relative z-10">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <span>Complete Onboarding</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </form>
          </div>

          {/* Tech badges */}
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-60">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="w-8 h-0.5 bg-green-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
           
          </div>
          <p className="text-xs text-slate-500">Step 2 of 2 • Profile Setup</p>
        </div>

        {/* Bottom features */}
        <div className="mt-6 text-center opacity-80">
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

export default OnboardingPage