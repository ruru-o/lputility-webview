import React from 'react';
import { Menu, X, Gauge } from 'lucide-react';

export function Header({ 
  onToggleMobileMenu, 
  isMobileMenuOpen, 
  onQuickNavigate 
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
          <span className="header-title">LPUtility</span>
        </div>
      </div>

      <div className="header-right">
        <button 
          className="header-action-btn"
          onClick={() => onQuickNavigate('bufferbloat')}
        >
          <Gauge size={14} />
          <span>Bufferbloat Test</span>
        </button>
      </div>
    </header>
  );
}
