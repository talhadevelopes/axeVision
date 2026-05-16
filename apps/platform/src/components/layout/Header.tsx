// src/components/Header.tsx
import { useEffect, useState, type JSX } from "react";
import {
  Terminal,
  User as UserIcon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@axeVision/shared/components/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useMembersQuery } from "../../hooks/useMembers";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/websites", label: "Websites" },
  { to: "/manage", label: "Manage" },
  { to: "/chat", label: "Chat" },
] as const;

export default function Header(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const { data: members = [] } = useMembersQuery();
  const currentUserMember = members.find(
    (member: any) => member?.type === "Admin"
  );

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setMobileMenuOpen(false);
    setShowUserInfo(false);
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinkClass = (path: string) =>
    `block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
      isActive(path)
        ? "text-green-700 font-semibold bg-green-50"
        : "text-slate-700 hover:text-green-700 hover:bg-slate-50"
    }`;

  const desktopNavLinkClass = (path: string) =>
    `relative inline-flex items-end gap-2 px-1 py-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? "text-green-700 font-semibold underline underline-offset-4"
        : "text-slate-700 hover:text-green-700"
    }`;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="fixed top-2 md:top-4 left-1/2 z-50 w-[min(96%,1200px)] -translate-x-1/2">
        <div className="rounded-xl md:rounded-2xl bg-white/70 backdrop-blur-lg border border-green-100/50 shadow-lg px-3 py-2.5 md:px-4 md:py-3">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <Link
              to={user ? "/dashboard" : "/"}
              className="flex items-center gap-2 md:gap-3 min-w-0"
              onClick={closeMobileMenu}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg">
                  <Terminal className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="absolute -inset-0.5 rounded-lg md:rounded-xl bg-green-400/20 blur-sm animate-pulse opacity-60 pointer-events-none" />
              </div>

              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-sm md:text-base font-semibold text-slate-900 truncate">
                  axeVision
                </span>
                <span className="hidden sm:block text-xs text-slate-500">
                  AI · QA · Accessibility
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6" aria-label="Main">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className={desktopNavLinkClass(to)}>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 md:gap-3 relative">
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

              <button
                type="button"
                aria-label="Account"
                aria-expanded={showUserInfo}
                onClick={() => setShowUserInfo((prev) => !prev)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <UserIcon className="w-5 h-5 text-slate-700" />
              </button>

              {showUserInfo && user && (
                <div className="absolute top-full right-0 mt-2 z-[60] bg-white border border-slate-200 shadow-lg rounded-lg p-4 text-sm text-gray-600 w-64 max-w-[calc(100vw-2rem)]">
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

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors shadow-md"
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="hidden sm:block">
                  <Button
                    variant="outline"
                    className="border-green-200 cursor-pointer text-green-700 hover:bg-green-50 bg-transparent font-mono shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <Terminal className="mr-2 h-4 w-4" />$ Get Started
                  </Button>
                </Link>
              )}

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="sm:hidden p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="sm:hidden p-2 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
                  aria-label="Get started"
                >
                  <Terminal className="w-5 h-5" />
                </Link>
              )}

              <button
                type="button"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-700" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={closeMobileMenu}
          />
          <nav
            className="fixed top-[4.5rem] left-1/2 z-50 w-[min(96%,1200px)] -translate-x-1/2 md:hidden"
            aria-label="Mobile"
          >
            <div className="rounded-2xl bg-white/95 backdrop-blur-lg border border-green-100/50 shadow-xl p-3 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={navLinkClass(to)}
                    onClick={closeMobileMenu}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              {!user && (
                <Link
                  to="/login"
                  className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm shadow-md"
                  onClick={closeMobileMenu}
                >
                  <Terminal className="w-4 h-4" />
                  Get Started
                </Link>
              )}

              {user && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="px-4 text-xs text-slate-500 mb-1">Signed in as</p>
                  <p className="px-4 text-sm font-medium text-slate-800 truncate mb-3">
                    {user.email || user.userId}
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500 text-white font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
