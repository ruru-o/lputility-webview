import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TelemetryWorkspace } from './modules/telemetry/TelemetryWorkspace';
import { CapabilityCatalog } from './modules/catalog/CapabilityCatalog';
import { IPv4Suite } from './modules/networking/IPv4Suite';
import { IPv6Suite } from './modules/networking/IPv6Suite';
import { PasswordSuite } from './modules/security/PasswordSuite';
import { TelemetryHistory } from './modules/history/TelemetryHistory';

export function App() {
  const [activeTab, setActiveTab] = useState('diagnostics');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Diagnostic parameters passed from tools catalog
  const [target, setTarget] = useState('1.1.1.1');
  const [measurementType, setMeasurementType] = useState('ping');

  // Enforce dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const handleSelectCapability = (cap) => {
    if (cap.actionType === 'telemetry') {
      setTarget(cap.defaultTarget || '1.1.1.1');
      setMeasurementType(cap.measurementType || 'ping');
      setActiveTab('diagnostics');
    } else if (cap.targetTab) {
      setActiveTab(cap.targetTab);
    }
    setIsMobileMenuOpen(false);
  };

  const handleRerun = (newTarget, newType) => {
    setTarget(newTarget);
    setMeasurementType(newType);
    setActiveTab('diagnostics');
    setIsMobileMenuOpen(false);
  };

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

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'diagnostics' && (
            <TelemetryWorkspace 
              initialTarget={target}
              initialType={measurementType}
            />
          )}

          {activeTab === 'tools' && (
            <CapabilityCatalog 
              onSelectCapability={handleSelectCapability}
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
              onRerun={handleRerun}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
