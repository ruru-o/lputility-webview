import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Copy, 
  Check, 
  Info, 
  Split, 
  Layers, 
  Cpu, 
  Hash, 
  Binary, 
  BookOpen 
} from 'lucide-react';
import { calculateSubnet, splitSubnet, isValidIpv4 } from '../../utils/ipv4';

const PRESETS = [
  { label: 'Home LAN (Class C)', ip: '192.168.1.1', cidr: 24 },
  { label: 'Corporate Branch (Class B)', ip: '172.16.10.1', cidr: 24 },
  { label: 'Enterprise Core (Class A)', ip: '10.0.0.1', cidr: 16 },
  { label: 'Carrier-Grade NAT (CGNAT)', ip: '100.64.1.1', cidr: 24 },
  { label: 'Point-to-Point Link', ip: '192.168.100.1', cidr: 30 },
  { label: 'Public Edge (Cloudflare)', ip: '1.1.1.1', cidr: 24 },
];

const CIDR_SHORTCUTS = [8, 16, 20, 24, 25, 26, 27, 28, 29, 30];

export function IPv4Suite() {
  const [ip, setIp] = useState('192.168.1.50');
  const [cidr, setCidr] = useState(24);
  const [targetSplitCidr, setTargetSplitCidr] = useState(26);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const isValid = useMemo(() => isValidIpv4(ip), [ip]);

  const subnetResult = useMemo(() => {
    if (!isValid) return null;
    try {
      return calculateSubnet(ip, cidr);
    } catch {
      return null;
    }
  }, [ip, cidr, isValid]);

  const subnetsList = useMemo(() => {
    if (!isValid || targetSplitCidr <= cidr) return [];
    try {
      return splitSubnet(ip, cidr, targetSplitCidr);
    } catch {
      return [];
    }
  }, [ip, cidr, targetSplitCidr, isValid]);

  const copyVal = (key, val) => {
    if (!val) return;
    navigator.clipboard.writeText(String(val));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Binary Representation of the IP address and Mask
  const binaryDetails = useMemo(() => {
    if (!isValid || !subnetResult) return null;
    const ipOctets = ip.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0'));
    const maskOctets = subnetResult.subnetMask.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0'));
    
    // Total bits = 32
    return {
      ipBinary: ipOctets.join(' . '),
      maskBinary: maskOctets.join(' . '),
      ipOctets,
      maskOctets,
    };
  }, [ip, isValid, subnetResult]);

  // IP Classification & Scope
  const ipClassification = useMemo(() => {
    if (!isValid) return null;
    const firstOctet = parseInt(ip.split('.')[0], 10);
    let ipClass = 'Class A';
    if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D (Multicast)';
    else if (firstOctet >= 240) ipClass = 'Class E (Experimental)';

    let scope = 'Public Internet';
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
      scope = 'RFC 1918 Private Intranet';
    } else if (ip.startsWith('127.')) {
      scope = 'Loopback';
    } else if (ip.startsWith('169.254.')) {
      scope = 'APIPA (Link-Local)';
    } else if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) {
      scope = 'RFC 6598 Carrier-Grade NAT';
    }

    return { ipClass, scope };
  }, [ip, isValid]);

  return (
    <div className="network-suite-workspace">
      {/* Header */}
      <div className="suite-header">
        <h1 className="suite-title">
          <Network className="text-accent" size={24} />
          IPv4 Subnet & Boundary Analyzer
        </h1>
        <p className="suite-subtitle">
          Bitwise network boundaries, usable host allocations, 32-bit binary octet visualization, and VLSM subnet partitioning.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="winui-card suite-input-card">
        <div className="ipv4-input-grid">
          {/* IP Input */}
          <div className="input-field-group">
            <label className="input-label">IPv4 Host Address</label>
            <input 
              type="text"
              className={`winui-input font-mono ${!isValid ? 'input-error' : ''}`}
              value={ip}
              onChange={(e) => setIp(e.target.value.trim())}
              placeholder="e.g. 192.168.1.1"
            />
            {!isValid && (
              <span className="field-error-text">Enter a valid IPv4 address (0.0.0.0 to 255.255.255.255)</span>
            )}

            {/* Presets */}
            <div className="quick-presets-row" style={{ marginTop: '10px' }}>
              <span className="preset-label">Presets:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  className={`preset-chip ${ip === p.ip && cidr === p.cidr ? 'active' : ''}`}
                  onClick={() => {
                    setIp(p.ip);
                    setCidr(p.cidr);
                    setTargetSplitCidr(Math.min(30, p.cidr + 2));
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mask / CIDR Slider & Buttons */}
          <div className="input-field-group">
            <div className="slider-header-row">
              <label className="input-label">Prefix Mask: /{cidr}</label>
              <span className="mask-preview font-mono">{subnetResult?.subnetMask}</span>
            </div>

            <input 
              type="range"
              min={1}
              max={32}
              value={cidr}
              onChange={(e) => {
                const newCidr = parseInt(e.target.value, 10);
                setCidr(newCidr);
                if (targetSplitCidr <= newCidr) {
                  setTargetSplitCidr(Math.min(30, newCidr + 2));
                }
              }}
              className="winui-range"
            />

            {/* CIDR Quick Shortcuts */}
            <div className="cidr-shortcuts-row">
              {CIDR_SHORTCUTS.map(c => (
                <button
                  key={c}
                  className={`cidr-btn ${cidr === c ? 'active' : ''}`}
                  onClick={() => {
                    setCidr(c);
                    if (targetSplitCidr <= c) setTargetSplitCidr(Math.min(30, c + 2));
                  }}
                >
                  /{c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {subnetResult && (
        <div className="suite-results-section">
          {/* Primary Cards Grid */}
          <div className="metrics-summary-grid">
            <div className="metric-card">
              <span className="metric-label">Network Address</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-accent">{subnetResult.networkAddress}/{cidr}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('net', `${subnetResult.networkAddress}/${cidr}`)}>
                  {copiedKey === 'net' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Broadcast Address</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-muted">{subnetResult.broadcastAddress}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('bcast', subnetResult.broadcastAddress)}>
                  {copiedKey === 'bcast' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="metric-card wide-card">
              <span className="metric-label">Usable Host Range</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-success">
                  {subnetResult.firstUsableHost} to {subnetResult.lastUsableHost}
                </span>
                <button className="copy-mini-btn" onClick={() => copyVal('range', `${subnetResult.firstUsableHost} - ${subnetResult.lastUsableHost}`)}>
                  {copiedKey === 'range' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Subnet Mask</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono">{subnetResult.subnetMask}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('mask', subnetResult.subnetMask)}>
                  {copiedKey === 'mask' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Wildcard Mask</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono">{subnetResult.wildcardMask}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('wildcard', subnetResult.wildcardMask)}>
                  {copiedKey === 'wildcard' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Usable Hosts</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono font-bold">{subnetResult.usableHosts.toLocaleString()}</span>
              </div>
              <span className="metric-subtext">Total addresses: {subnetResult.totalHosts.toLocaleString()}</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Class & Scope</span>
              <div className="metric-val-row">
                <span className="metric-value text-sm font-bold text-accent">{ipClassification?.ipClass}</span>
              </div>
              <span className="metric-subtext">{ipClassification?.scope}</span>
            </div>
          </div>

          {/* 32-Bit Binary Octet Architecture Card */}
          {binaryDetails && (
            <div className="winui-card binary-card">
              <div className="flex-row items-center justify-between" style={{ marginBottom: '12px' }}>
                <h3 className="card-subheading flex-row items-center gap-2">
                  <Binary size={16} className="text-accent" />
                  32-Bit Binary Octet Subnet Architecture
                </h3>
                <span className="badge-optimal text-xs">
                  {cidr} Network Bits | {32 - cidr} Host Bits
                </span>
              </div>

              <div className="binary-rows-wrap font-mono">
                <div className="binary-row">
                  <span className="binary-label">IP Binary:</span>
                  <div className="binary-octets">
                    {binaryDetails.ipOctets.map((oct, oIdx) => (
                      <span key={oIdx} className="octet-block">
                        {oct.split('').map((bit, bIdx) => {
                          const globalBitIndex = oIdx * 8 + bIdx;
                          const isNetBit = globalBitIndex < cidr;
                          return (
                            <span 
                              key={bIdx} 
                              className={`bit-span ${isNetBit ? 'net-bit' : 'host-bit'}`}
                            >
                              {bit}
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="binary-row">
                  <span className="binary-label">Mask Binary:</span>
                  <div className="binary-octets">
                    {binaryDetails.maskOctets.map((oct, oIdx) => (
                      <span key={oIdx} className="octet-block">
                        {oct.split('').map((bit, bIdx) => {
                          const globalBitIndex = oIdx * 8 + bIdx;
                          const isNetBit = globalBitIndex < cidr;
                          return (
                            <span 
                              key={bIdx} 
                              className={`bit-span ${isNetBit ? 'net-bit' : 'host-bit'}`}
                            >
                              {bit}
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="binary-legend" style={{ marginTop: '12px' }}>
                <span className="legend-item"><span className="legend-box net-bit-box" /> Network Identification Bits ({cidr})</span>
                <span className="legend-item"><span className="legend-box host-bit-box" /> Usable Host Addressing Bits ({32 - cidr})</span>
              </div>
            </div>
          )}

          {/* VLSM Subnet Splitter */}
          {cidr < 30 && (
            <div className="winui-card subnet-split-card">
              <div className="split-card-header">
                <div>
                  <h3 className="card-subheading flex-row items-center gap-2">
                    <Split size={16} className="text-accent" />
                    Subnet Partitioning (VLSM Splitter)
                  </h3>
                  <p className="subtext text-sm text-secondary">
                    Subdivide this /{cidr} block ({subnetResult.usableHosts} hosts) into smaller /{targetSplitCidr} subnets.
                  </p>
                </div>

                <div className="split-target-select">
                  <label className="text-sm">Target Subnet Prefix:</label>
                  <select 
                    className="winui-select"
                    value={targetSplitCidr}
                    onChange={(e) => setTargetSplitCidr(parseInt(e.target.value, 10))}
                  >
                    {Array.from({ length: 32 - cidr - 1 }, (_, i) => cidr + 1 + i).map(c => (
                      <option key={c} value={c}>/{c} ({Math.pow(2, c - cidr)} subnets)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="split-table-wrap">
                <table className="split-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Subnet CIDR</th>
                      <th>Usable Host Range</th>
                      <th>Broadcast</th>
                      <th>Usable Hosts</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subnetsList.slice(0, 16).map((sub, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="font-mono text-accent font-bold">{sub.networkAddress}/{targetSplitCidr}</td>
                        <td className="font-mono">{sub.firstUsableHost} to {sub.lastUsableHost}</td>
                        <td className="font-mono text-muted">{sub.broadcastAddress}</td>
                        <td className="font-mono">{sub.usableHosts}</td>
                        <td>
                          <button
                            className="copy-mini-btn"
                            onClick={() => copyVal(`sub_${idx}`, `${sub.networkAddress}/${targetSplitCidr}`)}
                            title="Copy subnet"
                          >
                            {copiedKey === `sub_${idx}` ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subnetsList.length > 16 && (
                  <div className="table-overflow-note">
                    Showing first 16 of {subnetsList.length} generated subnets.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subnet Reference Cheat Sheet Toggle */}
          <div className="winui-card cheat-sheet-card">
            <div className="flex-row items-center justify-between">
              <h3 className="card-subheading flex-row items-center gap-2">
                <BookOpen size={16} className="text-accent" />
                CIDR Subnet Reference Matrix
              </h3>
              <button 
                className="winui-btn winui-btn-subtle text-sm"
                onClick={() => setShowCheatSheet(!showCheatSheet)}
              >
                {showCheatSheet ? 'Hide Cheat Sheet' : 'Show Cheat Sheet'}
              </button>
            </div>

            {showCheatSheet && (
              <div className="cheat-sheet-table-wrap" style={{ marginTop: '12px' }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Prefix</th>
                      <th>Subnet Mask</th>
                      <th>Total Hosts</th>
                      <th>Usable Hosts</th>
                      <th>Class Equiv</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cidr: 24, mask: '255.255.255.0', total: 256, usable: 254, desc: '1 Class C' },
                      { cidr: 25, mask: '255.255.255.128', total: 128, usable: 126, desc: '1/2 Class C' },
                      { cidr: 26, mask: '255.255.255.192', total: 64, usable: 62, desc: '1/4 Class C' },
                      { cidr: 27, mask: '255.255.255.224', total: 32, usable: 30, desc: '1/8 Class C' },
                      { cidr: 28, mask: '255.255.255.240', total: 16, usable: 14, desc: '1/16 Class C' },
                      { cidr: 29, mask: '255.255.255.248', total: 8, usable: 6, desc: 'Small Subnet' },
                      { cidr: 30, mask: '255.255.255.252', total: 4, usable: 2, desc: 'Point-to-Point' },
                      { cidr: 31, mask: '255.255.255.254', total: 2, usable: 2, desc: 'RFC 3021 Router Link' },
                      { cidr: 32, mask: '255.255.255.255', total: 1, usable: 1, desc: 'Single Host Route' },
                    ].map(row => (
                      <tr key={row.cidr} className={cidr === row.cidr ? 'active-cidr-row' : ''}>
                        <td className="font-mono font-bold text-accent">/{row.cidr}</td>
                        <td className="font-mono">{row.mask}</td>
                        <td className="font-mono">{row.total}</td>
                        <td className="font-mono text-success font-bold">{row.usable}</td>
                        <td className="text-secondary text-sm">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
