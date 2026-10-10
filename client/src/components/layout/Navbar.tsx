import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles,
  MapPin,
  Bell,
  User as UserIcon,
  Store,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  Flame,
  Menu,
  X,
  Mail,
  Activity,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDemo } from '@/context/DemoContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LOCALITIES } from '@/utils/constants'
import { EmailHistoryDrawer } from '@/components/layout/EmailHistoryDrawer'
import { ApiClient } from '@/api/client'

interface NavbarProps {
  onMobileMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const { user, role, switchDemoRole, logout } = useAuth()
  const { locality, setLocality, isDemoMode, currentScenario, resetDemoData } = useDemo()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [showEmailDrawer, setShowEmailDrawer] = useState(false)
  const [emailLogs, setEmailLogs] = useState<any[]>([])

  const loadEmails = async () => {
    try {
      const logs = await ApiClient.getEmailHistory()
      setEmailLogs(logs)
    } catch {}
  }

  React.useEffect(() => {
    loadEmails()
    const intv = setInterval(loadEmails, 5000)
    return () => clearInterval(intv)
  }, [])

  const handleRoleSwitch = async () => {
    const nextRole = role === 'customer' ? 'merchant' : 'customer'
    await switchDemoRole(nextRole)
    setShowUserMenu(false)
    if (nextRole === 'customer') {
      navigate('/customer/dashboard')
    } else {
      navigate('/merchant/dashboard')
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      {/* Top Banner: ML Context / Demo Indicator */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <span className="flex items-center gap-1 font-semibold text-teal-400">
            <Sparkles className="w-3.5 h-3.5" />
            Decision Engine Active
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-slate-300">
            Current Scenario: <strong className="text-white">{currentScenario.day}, {currentScenario.time}</strong> • {currentScenario.temperature} {currentScenario.weather}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="teal" className="text-[11px] py-0 px-2 font-mono">
            {isDemoMode ? 'Demo Mode Active' : 'Production API'}
          </Badge>
          <button
            onClick={resetDemoData}
            title="Reset simulated changes"
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle + Logo */}
        <div className="flex items-center gap-3">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                Decisioned Offer <span className="text-indigo-600 font-extrabold">System</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mt-0.5">
                Expected Profit ML Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Locality Selector (Customer relevant) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-xs font-medium text-slate-500">Locality:</span>
          <select
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            {LOCALITIES.map((loc) => (
              <option key={loc} value={loc}>
                {loc}, Bengaluru
              </option>
            ))}
          </select>
        </div>

        {/* Right: Quick Role Switcher, Notification & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Toggle Pill Button */}
          <button
            onClick={handleRoleSwitch}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              role === 'merchant'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Switch demo experience between Customer and Merchant"
          >
            {role === 'merchant' ? (
              <>
                <Store className="w-3.5 h-3.5" />
                <span>Merchant Mode</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded font-mono ml-1">
                  Switch to Customer
                </span>
              </>
            ) : (
              <>
                <UserIcon className="w-3.5 h-3.5" />
                <span>Customer Mode (Priya)</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-950 px-1.5 py-0.2 rounded font-mono ml-1">
                  Switch to Merchant
                </span>
              </>
            )}
          </button>

          {/* Nodemailer Live Outbox Button */}
          <button
            onClick={() => setShowEmailDrawer(true)}
            className="flex items-center gap-1.5 p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Nodemailer Outbox & Email Logs"
            aria-label="Email Outbox"
          >
            <Mail className="w-5 h-5" />
            {emailLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-teal-600 text-white font-mono text-[10px] font-bold ring-2 ring-white">
                {emailLogs.length}
              </span>
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in-0 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">Recent Decisions</h4>
                  <Badge variant="teal">Live ML</Badge>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 text-xs">
                    <p className="font-semibold text-slate-900">Little Fern Café: 10% off</p>
                    <p className="text-slate-600 mt-0.5">
                      P(Accept) 68.4% • ₹15 savings • 2 min walk away in Koramangala
                    </p>
                    <span className="text-[10px] text-teal-700 font-medium block mt-1">Grounded offer sent</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <p className="font-semibold text-slate-900">Margin Guard Check Passed</p>
                    <p className="text-slate-600 mt-0.5">Min margin 13% protected. Cost ratio verified.</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                  <Link
                    to="/settings/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Manage Notification Settings
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-500 capitalize block leading-none">{role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in-0 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <Badge variant={role === 'merchant' ? 'violet' : 'teal'} className="mt-1.5 capitalize">
                      {role} Workspace
                    </Badge>
                  </div>

                  {role === 'customer' ? (
                    <>
                      <Link
                        to="/customer/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/customer/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Preferences & Context
                      </Link>
                      <Link
                        to="/customer/offers"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Personalized Offers
                      </Link>
                      <Link
                        to="/customer/history"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Redemption History
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/merchant/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Merchant Dashboard
                      </Link>
                      <Link
                        to="/merchant/analytics"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Profit Analytics
                      </Link>
                      <Link
                        to="/merchant/catalog"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Catalog & Inventory
                      </Link>
                      <Link
                        to="/merchant/offers"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Offer Recommendations
                      </Link>
                      <Link
                        to="/merchant/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        Business Settings
                      </Link>
                    </>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={handleRoleSwitch}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold cursor-pointer mb-1"
                  >
                    <span>Switch Role</span>
                    <span className="text-[10px] uppercase font-mono">{role === 'customer' ? 'Merchant' : 'Customer'}</span>
                  </button>

                  <Link
                    to="/settings/notifications"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Notification Settings
                  </Link>

                  <button
                    onClick={async () => {
                      await logout()
                      setShowUserMenu(false)
                      navigate('/login')
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Nodemailer Email Outbox Drawer */}
      <EmailHistoryDrawer
        isOpen={showEmailDrawer}
        onClose={() => setShowEmailDrawer(false)}
        history={emailLogs}
        onRefresh={loadEmails}
      />
    </header>
  )
}
