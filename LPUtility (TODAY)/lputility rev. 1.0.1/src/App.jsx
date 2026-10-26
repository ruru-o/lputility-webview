import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SoftwareCatalog } from './modules/catalog/SoftwareCatalog';
import { ScheduleMaker } from './modules/scheduler/ScheduleMaker';
import { IPv4Suite } from './modules/networking/IPv4Suite';
import { SubnetPractice } from './modules/networking/SubnetPractice';
import { IPv6Suite } from './modules/networking/IPv6Suite';
import { PasswordSuite } from './modules/security/PasswordSuite';

import { 
  getStoredSelectedPackages, 
  saveStoredSelectedPackages 
} from './utils/storage';

export function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Selected packages state
  const [selectedPackages, setSelectedPackages] = useState(() => getStoredSelectedPackages());

  // Enforce permanent dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('lputility_theme', 'dark');
  }, []);

  // Apply is-electron class when running inside Electron
  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      document.documentElement.classList.add('is-electron');
      document.body.classList.add('is-electron');
    }
  }, []);

  // Persist selections
  useEffect(() => {
    saveStoredSelectedPackages(selectedPackages);
  }, [selectedPackages]);

  return (
    <div className="mica-app-shell app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        selectedCount={selectedPackages.length}
      />

      {/* Main Content Workspace */}
      <main className="main-content">
        {activeTab === 'catalog' && (
          <SoftwareCatalog 
            selectedPackages={selectedPackages}
            setSelectedPackages={setSelectedPackages}
          />
        )}

        {activeTab === 'scheduler' && (
          <ScheduleMaker />
        )}

        {activeTab === 'ipv4' && (
          <IPv4Suite />
        )}

        {activeTab === 'practice' && (
          <SubnetPractice />
        )}

        {activeTab === 'ipv6' && (
          <IPv6Suite />
        )}

        {activeTab === 'passwords' && (
          <PasswordSuite />
        )}
      </main>
    </div>
  );
}

export default App;
