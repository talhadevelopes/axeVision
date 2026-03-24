// src/components/Header.tsx
import { useState, type JSX } from "react";
import {
  Terminal,
  Code2,
  ArrowRight,
  Search,
  Bell,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@axeVision/shared/components/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useMembersQuery } from "../../queries/useMemberQueries";

export default function Header(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserInfo, setShowUserInfo] = useState(false);

  const { user, logout } = useAuthStore();
  const { data: members = [] } = useMembersQuery();
  const currentUserMember = members.find(
    (member: any) => member?.type === "Admin"
  );
  console.log(currentUserMember);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout(); // clear user from store
    navigate("/login"); // redirect to login page after logout
  };

  return (
    <>
      {/* Floating glass navbar */}
      <header className="fixed top-4 left-1/2 z-50 w-[min(96%,1200px)] -translate-x-1/2">
        <div className="rounded-2xl bg-white/70 backdrop-blur-lg border border-green-100/50 shadow-lg px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: logo + brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="absolute -inset-0.5 rounded-xl bg-green-400/20 blur-sm animate-pulse opacity-60 pointer-events-none" />
              </div>

              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold text-slate-900">
                  axeVision
                </span>
                <span className="text-xs text-slate-500">
                  AI · QA · Accessibility
                </span>
              </div>
            </div>

            {/* Center: nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/dashboard"
                className={`relative inline-flex items-end gap-2 px-1 py-2 text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-green-700 font-semibold underline underline-offset-4"
                    : "text-slate-700 hover:text-green-700"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/websites"
                className={`relative inline-flex items-end gap-2 px-1 py-2 text-sm font-medium transition-colors ${
                  isActive("/websites")
                    ? "text-green-700 font-semibold underline underline-offset-4"
                    : "text-slate-700 hover:text-green-700"
                }`}
              >
                Websites
              </Link>
              <Link
                to="/manage"
                className={`relative inline-flex items-end gap-2 px-1 py-2 text-sm font-medium transition-colors ${
                  isActive("/manage")
                    ? "text-green-700 font-semibold underline underline-offset-4"
                    : "text-slate-700 hover:text-green-700"
                }`}
              >
                Manage
              </Link>
              <Link
                to="/chat"
                className={`relative inline-flex items-end gap-2 px-1 py-2 text-sm font-medium transition-colors ${
                  isActive("/chat")
                    ? "text-green-700 font-semibold underline underline-offset-4"
                    : "text-slate-700 hover:text-green-700"
                }`}
              >
                Chat
              </Link>
            </nav>

            {/* Right: utilities */}
            <div className="flex items-center gap-3">
              {/* ✅ Show user info if logged in */}
              {user && user.email && (
                <span className="hidden md:inline text-sm text-slate-600">
                  Logged in as: <strong>{user.email}</strong> ({user.memberType}
                  )
                  {currentUserMember && (
                    <div>
                      <p className="text-sm text-gray-500">Member ID</p>
                      <p className="text-gray-600 font-mono text-sm">
                        {currentUserMember.memberId}
                      </p>
                    </div>
                  )}
                </span>
              )}

              {/* account */}
              <button
                aria-label="Account"
                onClick={() => setShowUserInfo((prev) => !prev)}
                className="relative p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <UserIcon className="w-5 h-5 text-slate-700" />
              </button>
              {showUserInfo && user && (
                <div className="absolute top-12 right-4 bg-white border border-slate-200 shadow-lg rounded-lg p-4 text-sm text-gray-600 w-64">
                  <div className="font-medium">Logged in as:</div>
                  <div className="truncate mb-2">
                    {user.email || user.userId}
                  </div>

                  <div className="font-medium">Role:</div>
                  <div className="mb-3">{user.memberType}</div>

                  {currentUserMember && (
                    <div className="pt-3 border-t border-slate-200">
                      <div className="font-medium text-xs text-gray-500 uppercase tracking-wide">
                        Member ID
                      </div>
                      <div className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded mt-1 break-all">
                        {currentUserMember.memberId}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* ✅ Conditionally render Logout OR Sign-in / Sign-up */}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors shadow-md"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login">
                    <Button
                      variant="outline"
                      className="border-green-200 cursor-pointer text-green-700 hover:bg-green-50 bg-transparent font-mono shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <Terminal className="mr-2 h-4 w-4" />$ Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
