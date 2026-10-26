import React from 'react';
import { 
  Shield, 
  ExternalLink, 
  Users, 
  GitBranch, 
  Layers, 
  Activity, 
  Server, 
  FileText,
  Award,
  Smartphone
} from 'lucide-react';

const TEAM_MEMBERS = [
  { name: 'Arc Moreno Alvarez', role: 'System Architect & React Lead', contribution: 'Dual-API Aggregator, Electron-to-Web conversion, UI Architecture' },
  { name: 'Jose Carlo Fernandez', role: 'Android & Mobile Engineer', contribution: 'Native Android WebView Studio project, Kotlin MainActivity, Back navigation' },
  { name: 'Christofferson Lyle C. Garcia', role: 'API Integration Specialist', contribution: 'Globalping REST client, distributed probe normalizer, polling lifecycle' },
  { name: 'Raphael Ferrer', role: 'Network Protocol Engineer', contribution: 'IPv4 bitwise math engine, VLSM subnet partitioning, binary visualizer' },
  { name: 'Hench Lloyd Alvarez', role: 'Infrastructure Researcher', contribution: 'RIPE Stat BGP API client, Autonomous System (ASN) lookup, DoH resolver' },
  { name: 'Joseph Pimentel', role: 'IPv6 & BigInt Developer', contribution: '128-bit BigInt calculations, RFC 5952 compression/expansion engine' },
  { name: 'Josiah Oren Pinca', role: 'UI/UX & Responsive Designer', contribution: 'Obsidian WinUI 3 design system, CSS media queries, mobile drawer navigation' },
  { name: 'Juan Aundre Rubio', role: 'QA & CI/CD Automation Lead', contribution: 'Vitest automated test suite, GitHub Actions deployment workflow, PDF documentation' },
];

export function AboutView() {
  return (
    <div className="about-workspace">
      <div className="about-hero-card winui-card">
        <div className="about-hero-badge">
          <div className="hero-logo">NP</div>
          <div>
            <h1 className="hero-product-name">NetPulse</h1>
            <span className="hero-version-tag">Version 2.0.0 Production Release</span>
          </div>
        </div>
        <p className="hero-desc">
          A high-performance distributed network intelligence and diagnostic platform built for developers, network administrators, IT technicians, and cybersecurity students.
        </p>
        <div className="academic-meta-bar">
          <span><strong>Institution:</strong> Lyceum of the Philippines University â€“ Cavite</span>
          <span>â€¢</span>
          <span><strong>College:</strong> College of Information Technology and Computer Studies</span>
          <span>â€¢</span>
          <span><strong>Section:</strong> BSIT301NS (Group 1)</span>
        </div>
      </div>

      <div className="about-sections-grid">
        {/* Team Members & Contributions */}
        <div className="winui-card about-card">
          <div className="card-header-row">
            <Users size={18} className="text-accent" />
            <h2 className="about-card-title">Project Team & Member Contributions</h2>
          </div>
          <div className="team-list">
            {TEAM_MEMBERS.map((m, idx) => (
              <div key={idx} className="team-member-item">
                <div className="member-name-role">
                  <span className="member-name">{m.name}</span>
                  <span className="member-role">{m.role}</span>
                </div>
                <p className="member-contrib">{m.contribution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dual-API Integration Details */}
        <div className="winui-card about-card">
          <div className="card-header-row">
            <Activity size={18} className="text-accent" />
            <h2 className="about-card-title">Dual-API Integration Architecture</h2>
          </div>
          
          <div className="api-spec-item">
            <div className="api-spec-top">
              <strong>1. Globalping API (Active Probes)</strong>
              <a href="https://globalping.io/docs" target="_blank" rel="noreferrer" className="doc-link">
                Docs <ExternalLink size={12} />
              </a>
            </div>
            <p className="api-spec-desc">
              Provided by jsDelivr. Executes active distributed network measurements (Ping, DNS, HTTP, Traceroute) across 1,000+ community probes worldwide. Supports CORS with zero private secrets in client bundles.
            </p>
          </div>

          <div className="api-spec-item">
            <div className="api-spec-top">
              <strong>2. RIPE Stat Data API (Passive Routing)</strong>
              <a href="https://stat.ripe.net/docs/02.data_api/" target="_blank" rel="noreferrer" className="doc-link">
                Docs <ExternalLink size={12} />
              </a>
            </div>
            <p className="api-spec-desc">
              Provided by RIPE NCC (Regional Internet Registry). Supplies authoritative BGP routing tables, Autonomous System Number (ASN) ownership, prefix registry allocations, and routing visibility.
            </p>
          </div>

          <div className="synergy-highlight-box">
            <h4 className="synergy-title">How the Two APIs Work Together</h4>
            <p className="synergy-text">
              When investigating any target host, NetPulse concurrently dispatches active multi-continent probes via Globalping and queries authoritative BGP registries via RIPE Stat. The platform correlates measured probe latencies with destination Autonomous System peering, validating whether latency spikes stem from inter-AS transit or edge CDN caching.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
