import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BufferbloatWorkspace } from './modules/bufferbloat/BufferbloatWorkspace';
import { IPv4Suite } from './modules/networking/IPv4Suite';
import { IPv6Suite } from './modules/networking/IPv6Suite';
import { PasswordSuite } from './modules/security/PasswordSuite';
import { TelemetryHistory } from './modules/history/TelemetryHistory';

export function App() {
  const [activeTab, setActiveTab] = useState('bufferbloat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Enforce dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <div className="lputility-app-shell">
      {/* Top Header */}
      <Header 
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onQuickNavigate={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        activeTab={activeTab}
      />

      <div className="app-body-container">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content with Error Boundary */}
        <main className="main-content">
          <ErrorBoundary onReset={() => setActiveTab('bufferbloat')}>
            {activeTab === 'bufferbloat' && (
              <BufferbloatWorkspace 
                onNavigateHistory={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'ipv4' && (
              <IPv4Suite />
            )}

            {activeTab === 'ipv6' && (
              <IPv6Suite />
            )}

            {activeTab === 'passwords' && (
              <PasswordSuite />
            )}

            {activeTab === 'history' && (
              <TelemetryHistory 
                onStartBufferbloat={() => setActiveTab('bufferbloat')}
                onRerun={() => setActiveTab('bufferbloat')}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
