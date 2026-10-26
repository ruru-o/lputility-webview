import React, { useState } from 'react';
import { 
  Activity, 
  Globe2, 
  Server, 
  Network, 
  KeyRound, 
  ExternalLink, 
  Zap, 
  ArrowRight,
  Search
} from 'lucide-react';
import capabilitiesData from '../../data/capabilities.json';

export function CapabilityCatalog({ onSelectCapability }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = capabilitiesData.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (cat) => {
    switch (cat) {
      case 'active-telemetry': return Activity;
      case 'routing-bgp': return Server;
      case 'protocol-engine': return Network;
      case 'security-crypto': return KeyRound;
      default: return Zap;
    }
  };

  return (
    <div className="catalog-workspace">
      <div className="catalog-header">
        <div>
          <h2 className="section-title">Tools & Utilities</h2>
          <p className="section-subtitle">
            Diagnostic tools, protocol calculators, and security utilities.
          </p>
        </div>

        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input 
            type="text"
            className="winui-input search-input"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="tools-grid">
        {filtered.map((cap) => {
          const Icon = getIcon(cap.category);
          return (
            <div key={cap.id} className="winui-card tool-card">
              <div className="tool-card-top">
                <div className="tool-icon-wrap">
                  <Icon size={18} />
                </div>
                <span className="badge-tag">{cap.badge}</span>
              </div>

              <h3 className="tool-name">{cap.name}</h3>
              <p className="tool-desc">{cap.purpose}</p>

              <div className="tool-footer">
                <button 
                  className="winui-btn winui-btn-primary tool-open-btn"
                  onClick={() => onSelectCapability(cap)}
                >
                  <span>Open Tool</span>
                  <ArrowRight size={13} />
                </button>

                <a 
                  href={cap.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="doc-link-btn"
                  title="Official documentation"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
