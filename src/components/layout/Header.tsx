import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  Search, 
  ChevronDown, 
  Database,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  onOpenNewVisitor: () => void;
  onOpenScanner: () => void;
  onOpenDatabase: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDatabase,
  searchQuery,
  onSearchChange,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const { user, role, switchableUsers, switchUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-white border-b border-slate-200 shadow-2xs w-full">
      
      {/* Left: Hamburger button (mobile only) */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="lg:hidden p-2 -ml-1 mr-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-slate-800" />
        ) : (
          <Menu className="w-5 h-5 text-slate-800" />
        )}
      </button>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mr-2 sm:mr-4 min-w-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search visitor, host, badge ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Right Controls: Diagnostics, Notifications, User Persona */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

        {/* System Online Status Indicator */}
        <button
          onClick={onOpenDatabase}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-800 transition-colors cursor-pointer"
          title="System & Database Status"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online</span>
        </button>

        {/* User Persona Profile Pill with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2 pr-1 sm:pr-1.5 py-1 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                {role === 'RECEPTIONIST' ? 'Receptionist / Front Desk' : role === 'ADMIN' ? 'System Administrator' : `${user?.designation || 'Host Employee'}`}
              </div>
            </div>

            <div className="relative shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-800 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center ring-2 ring-white shadow-xs overflow-hidden">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Persona Switcher Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Switch Active Role Persona
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test and inspect role views:
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {switchableUsers.map((u) => {
                  const isCurrent = u.id === user?.id;
                  let roleColor = 'text-teal-700 bg-teal-50';
                  if (u.role === 'ADMIN') roleColor = 'text-purple-700 bg-purple-50';
                  if (u.role === 'EMPLOYEE') roleColor = 'text-blue-700 bg-blue-50';

                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-slate-50' : ''
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {u.name} {isCurrent && '✓'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {u.designation || u.department || u.email}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${roleColor} shrink-0`}>
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>


            </div>
          )}
        </div>

        {/* Direct Sign Out / Log Out Button (Moved to very end) */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
          title="Sign Out / Log Out"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
