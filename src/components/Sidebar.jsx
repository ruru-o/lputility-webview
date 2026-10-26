import React from 'react';
import { 
  Gauge, 
  Network, 
  Globe2, 
  KeyRound, 
  History, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed,
  isMobileOpen,
  closeMobileMenu
}) {
  const navItems = [
    { id: 'bufferbloat', label: 'Bufferbloat Test', icon: Gauge },
    { id: 'ipv4', label: 'IPv4 Subnets', icon: Network },
    { id: 'ipv6', label: 'IPv6 Calculator', icon: Globe2 },
    { id: 'passwords', label: 'Password Generator', icon: KeyRound },
    { id: 'history', label: 'History', icon: History },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div className="mobile-backdrop" onClick={closeMobileMenu} />
      )}

      <aside className={`winui-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-header">
            {!isCollapsed && (
              <div className="brand-badge" onClick={() => handleNavClick('bufferbloat')}>
                <div className="brand-icon">LP</div>
                <span className="brand-title">LPUtility</span>
              </div>
            )}
            <button 
              className="winui-btn winui-btn-subtle desktop-toggle-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="nav-icon" size={17} />
                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
