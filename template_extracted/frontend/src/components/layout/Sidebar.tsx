import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Tag,
  History,
  UserCheck,
  Store,
  BarChart3,
  PackageSearch,
  CheckCircle,
  MailCheck,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user } = useAuth()

  const customerLinks = [
    { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customer/offers', label: 'Personalized Offers', icon: Tag },
    { to: '/customer/history', label: 'Redemptions & Savings', icon: History },
    { to: '/customer/profile', label: 'Profile & Preferences', icon: UserCheck },
  ]

  const merchantLinks = [
    { to: '/merchant/dashboard', label: 'Overview & KPIs', icon: Store },
    { to: '/merchant/analytics', label: 'Profit Analytics', icon: BarChart3 },
    { to: '/merchant/catalog', label: 'Catalog & Inventory', icon: PackageSearch },
    { to: '/merchant/offers', label: 'Recommendations', icon: CheckCircle },
    { to: '/merchant/email-preview', label: 'Email Campaign Preview', icon: MailCheck },
    { to: '/merchant/profile', label: 'Business Settings', icon: Sliders },
  ]

  const links = role === 'merchant' ? merchantLinks : customerLinks

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed lg:sticky top-16 lg:top-[93px] z-30 h-[calc(100vh-4rem)] lg:h-[calc(100vh-93px)] w-64 shrink-0 border-r border-slate-200/90 bg-white flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="space-y-6">
          {/* Workspace Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  role === 'merchant' ? 'bg-indigo-500' : 'bg-emerald-500'
                )}
              />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {role === 'merchant' ? 'Merchant Portal' : 'Customer Portal'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {role === 'merchant' ? 'Little Fern Café' : `${user?.name || 'Priya Sharma'}`}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
            {links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Settings Section */}
          <div className="pt-2 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Preferences
            </p>
            <NavLink
              to="/settings/notifications"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )
              }
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Notification Settings</span>
            </NavLink>
          </div>
        </div>

        {/* Bottom ML Formula Explainer Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md">
          <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ML Profit Rule</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 font-mono leading-relaxed">
            E[Profit] = P(Accept) × Margin
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-start gap-1.5 text-[10px] text-slate-400">
            <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
            <span>Predictions are calibrated estimates, not guaranteed margins.</span>
          </div>
        </div>
      </aside>
    </>
  )
}
