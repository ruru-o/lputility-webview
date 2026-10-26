import React from 'react';
import { 
  Package, 
  Calendar, 
  Network, 
  BookOpen,
  Globe2, 
  KeyRound, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed, 
  selectedCount
}) {
  const navItems = [
    {
      id: 'catalog',
      label: 'Software Catalog',
      icon: Package,
      badge: selectedCount > 0 ? selectedCount : null,
    },
    {
      id: 'scheduler',
      label: 'Class Schedule',
      icon: Calendar,
    },
    {
      id: 'ipv4',
      label: 'IPv4 Subnets',
      icon: Network,
    },
    {
      id: 'practice',
      label: 'Subnet Practice',
      icon: BookOpen,
    },
    {
      id: 'ipv6',
      label: 'IPv6 Calculator',
      icon: Globe2,
    },
    {
      id: 'passwords',
      label: 'Password Generator',
      icon: KeyRound,
    },
  ];

  return (
    <aside className={`winui-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div>
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="brand-badge" title="LPUtility - A electron based application for students that provides All-In-One Software and Utilities Commonly used in Academics and IT">
              <div className="brand-icon">LP</div>
              <span className="brand-title">LPUtility</span>
            </div>
          )}
          <button 
            className="winui-btn winui-btn-subtle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            style={{ padding: '4px' }}
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
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="nav-icon" />
                  {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="winui-badge winui-badge-brand">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
