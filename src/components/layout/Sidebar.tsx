import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  Building2, 
  UserPlus, 
  ChevronsUpDown,
  Shield,
  Users,
  UserCog,
  X
} from 'lucide-react';

export type NavTab = 
  | 'front_desk'
  | 'register'
  | 'host_approvals'
  | 'audit_reports'
  | 'employees'
  | 'users';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenRegisterModal: () => void;
  pendingApprovalsCount?: number;
  currentlyInsideCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenRegisterModal,
  pendingApprovalsCount = 0,
  currentlyInsideCount = 0,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { isAdmin, isReceptionist, isEmployee } = useAuth();

  const navItems = [
    ...(isReceptionist ? [
      {
        id: 'front_desk' as NavTab,
        label: 'Front Desk & Visits',
        icon: (props: any) => (
          <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        badge: currentlyInsideCount > 0 ? currentlyInsideCount : undefined,
        badgeLabel: 'Inside'
      },
      {
        id: 'register' as NavTab,
        label: 'Register Visitor',
        icon: UserPlus,
        isAction: true
      }
    ] : []),
    ...(isEmployee ? [
      {
        id: 'host_approvals' as NavTab,
        label: 'Host Approvals',
        icon: (props: any) => (
          <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        badgeLabel: 'Pending'
      }
    ] : []),
    ...(isAdmin ? [
      {
        id: 'audit_reports' as NavTab,
        label: 'Audit & Reports',
        icon: (props: any) => (
          <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      {
        id: 'employees' as NavTab,
        label: 'Manage Employees',
        icon: Users
      },
      {
        id: 'users' as NavTab,
        label: 'User Management',
        icon: UserCog
      }
    ] : [])
  ];

  const { logout } = useAuth();

  const handleItemClick = (item: typeof navItems[0]) => {
    onCloseMobile?.();
    if (item.isAction) {
      onOpenRegisterModal();
    } else {
      onSelectTab(item.id);
    }
  };

  const renderNavContent = () => (
    <>
      {/* Navigation Links */}
      <div className="p-3 flex-1 overflow-y-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 block">
          Main Management
        </span>

        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {Boolean(item.badge && item.badge > 0) && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${isActive ? 'bg-teal-900 text-teal-100' : 'bg-amber-100 text-amber-900'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 min-h-[calc(100vh-57px)] select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-teal-400 shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-950">
              PassGuard
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-full">
            Secure
          </span>
        </div>

        {renderNavContent()}
      </aside>

      {/* 2. Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white shadow-2xl z-10 select-none animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-teal-400 shadow-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold tracking-tight text-slate-950">
                  PassGuard
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
