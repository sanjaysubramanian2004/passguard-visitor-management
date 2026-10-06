import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LocationProvider } from './context/LocationContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, NavTab } from './components/layout/Sidebar.tsx';
import { PopulatedVisit, VisitorRequest } from './types/index.ts';
import { api } from './services/api.ts';

// Main Role Views (Exact High-Fidelity Design)
import { FrontDeskVisitsView } from './pages/FrontDeskVisitsView.tsx';
import { HostApprovalsView } from './pages/HostApprovalsView.tsx';
import { AdminComplianceHQView } from './pages/AdminComplianceHQView.tsx';
import { EmployeesPage } from './pages/EmployeesPage.tsx';
import { UsersPage } from './pages/UsersPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';

// Modals
import { VisitorRegistrationModal } from './components/visitor/VisitorRegistrationModal.tsx';
import { VisitorBadgeModal } from './components/visitor/VisitorBadgeModal.tsx';
import { VisitorActionModal, ActionType } from './components/visitor/VisitorActionModal.tsx';
import { VisitorDetailsModal } from './components/visitor/VisitorDetailsModal.tsx';
import { QuickCheckInScannerModal } from './components/visitor/QuickCheckInScannerModal.tsx';
import { DatabaseStatusModal } from './components/common/DatabaseStatusModal.tsx';

function MainApp() {
  const { user, role, isEmployee, isAdmin, isReceptionist } = useAuth();
  
  // Default tab based on role
  const getDefaultTab = (): NavTab => {
    if (isEmployee) return 'host_approvals';
    if (isAdmin) return 'audit_reports';
    return 'front_desk';
  };

  const [activeTab, setActiveTab] = useState<NavTab>('front_desk');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Counts for sidebar badges
  const [pendingCount, setPendingCount] = useState(0);
  const [insideCount, setInsideCount] = useState(0);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  
  const [selectedVisitorForBadge, setSelectedVisitorForBadge] = useState<any>(null);
  const [selectedVisitorForDetails, setSelectedVisitorForDetails] = useState<any>(null);
  const [actionModalState, setActionModalState] = useState<{
    isOpen: boolean;
    visitor: any | null;
    actionType: ActionType | null;
  }>({
    isOpen: false,
    visitor: null,
    actionType: null
  });

  const refreshCounts = async () => {
    try {
      const empId = isEmployee ? user?.employeeId : undefined;
      const metrics = await api.getMetrics(empId);
      setPendingCount(isEmployee ? (metrics.myPendingRequests || 0) : metrics.pendingRequests);
      setInsideCount(metrics.visitorsCurrentlyInside);
    } catch (e) {
      console.error('Failed to refresh counts', e);
    }
  };

  useEffect(() => {
    if (user) {
      setActiveTab(getDefaultTab());
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 5000);
    const handleFocus = () => refreshCounts();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, isEmployee]);

  const handleOpenAction = (visitor: any, actionType: ActionType) => {
    setActionModalState({
      isOpen: true,
      visitor,
      actionType
    });
  };

  const handleActionSuccess = () => {
    refreshCounts();
  };

  const handleRegisterSuccess = (newVisitor: VisitorRequest) => {
    refreshCounts();
    setSelectedVisitorForBadge(newVisitor);
  };

  const handleNavSelect = (tab: NavTab) => {
    setIsMobileMenuOpen(false);
    if (tab === 'register') {
      setIsRegisterOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  if (!user) {
    return <LoginPage onSuccess={() => setActiveTab(getDefaultTab())} />;
  }

  return (
    <div className="min-h-screen bg-ambient-canvas flex flex-col font-sans">
      
      {/* 3-Zone Responsive Header */}
      <Header
        onOpenNewVisitor={() => setIsRegisterOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Role-Based Sidebar (Responsive Desktop & Mobile Drawer) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavSelect}
          onOpenRegisterModal={() => {
            setIsMobileMenuOpen(false);
            setIsRegisterOpen(true);
          }}
          pendingApprovalsCount={pendingCount}
          currentlyInsideCount={insideCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full min-w-0 scroll-smooth">
          {activeTab === 'front_desk' && (
            <FrontDeskVisitsView
              onOpenRegister={() => setIsRegisterOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenBadge={v => setSelectedVisitorForBadge(v)}
              onOpenAction={handleOpenAction}
              onOpenDetails={v => setSelectedVisitorForDetails(v)}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'host_approvals' && (
            <HostApprovalsView
              onOpenBadge={v => setSelectedVisitorForBadge(v)}
              onOpenAction={handleOpenAction}
              onOpenDetails={v => setSelectedVisitorForDetails(v)}
            />
          )}

          {activeTab === 'audit_reports' && (
            <AdminComplianceHQView />
          )}

          {activeTab === 'employees' && (
            <EmployeesPage />
          )}

          {activeTab === 'users' && (
            <UsersPage />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <VisitorRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      <VisitorBadgeModal
        visitor={selectedVisitorForBadge}
        isOpen={Boolean(selectedVisitorForBadge)}
        onClose={() => setSelectedVisitorForBadge(null)}
      />

      <VisitorActionModal
        isOpen={actionModalState.isOpen}
        visitor={actionModalState.visitor}
        actionType={actionModalState.actionType}
        onClose={() => setActionModalState({ isOpen: false, visitor: null, actionType: null })}
        onSuccess={handleActionSuccess}
      />

      <VisitorDetailsModal
        visitor={selectedVisitorForDetails}
        isOpen={Boolean(selectedVisitorForDetails)}
        onClose={() => setSelectedVisitorForDetails(null)}
        onOpenBadge={v => setSelectedVisitorForBadge(v)}
        onOpenAction={handleOpenAction}
      />

      <QuickCheckInScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={refreshCounts}
      />

      <DatabaseStatusModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LocationProvider>
          <MainApp />
        </LocationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
