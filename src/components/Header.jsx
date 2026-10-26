import React from 'react';
import { Menu, X, Play, Gauge } from 'lucide-react';

export function Header({ 
  onToggleMobileMenu, 
  isMobileMenuOpen, 
  onQuickNavigate,
  activeTab 
}) {
  return (
    <header className="winui-header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="header-brand" onClick={() => onQuickNavigate('bufferbloat')}>
          <div className="header-logo">LP</div>
          <div className="header-brand-info">
            <span className="header-title">LPUtility</span>
            <span className="header-subtag">Network Benchmark</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {activeTab !== 'bufferbloat' && (
          <button 
            className="header-action-btn"
            onClick={() => onQuickNavigate('bufferbloat')}
          >
            <Gauge size={14} />
            <span>Bufferbloat Test</span>
          </button>
        )}
      </div>
    </header>
  );
}
