import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Copy, 
  Check, 
  Split, 
  Binary, 
  BookOpen 
} from 'lucide-react';
import { calculateSubnet, splitSubnet, isValidIpv4 } from '../../utils/ipv4';

const PRESETS = [
  { label: 'Home LAN (/24)', ip: '192.168.1.1', cidr: 24 },
  { label: 'Corporate Branch (/24)', ip: '172.16.10.1', cidr: 24 },
  { label: 'Enterprise Core (/16)', ip: '10.0.0.1', cidr: 16 },
  { label: 'CGNAT (/10)', ip: '100.64.1.1', cidr: 10 },
  { label: 'Point-to-Point (/30)', ip: '192.168.100.1', cidr: 30 },
  { label: 'Public Edge (/24)', ip: '1.1.1.1', cidr: 24 },
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

  const binaryDetails = useMemo(() => {
    if (!isValid || !subnetResult) return null;
    const ipOctets = ip.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0'));
    const maskOctets = subnetResult.subnetMask.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0'));
    return { ipOctets, maskOctets };
  }, [ip, isValid, subnetResult]);

  const ipClassification = useMemo(() => {
    if (!isValid) return null;
    const firstOctet = parseInt(ip.split('.')[0], 10);
    let ipClass = 'Class A';
    if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D';
    else if (firstOctet >= 240) ipClass = 'Class E';

    let scope = 'Public Internet';
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
      scope = 'RFC 1918 Private';
    } else if (ip.startsWith('127.')) {
      scope = 'Loopback';
    } else if (ip.startsWith('169.254.')) {
      scope = 'APIPA';
    } else if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) {
      scope = 'RFC 6598 CGNAT';
    }

    return { ipClass, scope };
  }, [ip, isValid]);

  return (
    <div className="wf-benchmark-wrapper">
      {/* Header */}
      <div className="wf-top-bar">
        <div>
          <h1 className="wf-title">IPv4 Subnet Calculator</h1>
          <p className="wf-subtitle">Bitwise network boundaries, usable host allocations, and VLSM subnet partitioning.</p>
        </div>
      </div>

      {/* Control Card */}
      <div className="winui-card wf-input-card">
        <div className="wf-input-flex-row">
          {/* IP Input */}
          <div className="wf-input-col">
            <label className="wf-field-label">Host IP Address</label>
            <input 
              type="text"
              className={`winui-input font-mono ${!isValid ? 'input-error' : ''}`}
              value={ip}
              onChange={(e) => setIp(e.target.value.trim())}
              placeholder="192.168.1.1"
            />
            {!isValid && (
              <span className="field-error-text">Invalid IPv4 address format</span>
            )}

            {/* Quick Presets */}
            <div className="wf-chips-row">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  className={`wf-chip ${ip === p.ip && cidr === p.cidr ? 'active' : ''}`}
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

          {/* Mask Slider */}
          <div className="wf-input-col">
            <div className="flex-row justify-between items-center" style={{ marginBottom: '6px' }}>
              <label className="wf-field-label">Subnet Mask: /{cidr}</label>
              <span className="font-mono text-accent text-sm">{subnetResult?.subnetMask}</span>
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

            {/* CIDR Shortcuts */}
            <div className="wf-chips-row">
              {CIDR_SHORTCUTS.map(c => (
                <button
                  key={c}
                  className={`wf-chip ${cidr === c ? 'active' : ''}`}
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

      {/* Results */}
      {subnetResult && (
        <div className="wf-results-stack">
          {/* 2x4 Metric Grid */}
          <div className="wf-grid-4">
            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">Network Address</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono text-accent">{subnetResult.networkAddress}/{cidr}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('net', `${subnetResult.networkAddress}/${cidr}`)}>
                  {copiedKey === 'net' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">Broadcast Address</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono text-muted">{subnetResult.broadcastAddress}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('bcast', subnetResult.broadcastAddress)}>
                  {copiedKey === 'bcast' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card span-2">
              <span className="wf-stat-k">Usable Host Range</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono text-success">
                  {subnetResult.firstUsableHost} to {subnetResult.lastUsableHost}
                </span>
                <button className="copy-mini-btn" onClick={() => copyVal('range', `${subnetResult.firstUsableHost} to ${subnetResult.lastUsableHost}`)}>
                  {copiedKey === 'range' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">Subnet Mask</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono">{subnetResult.subnetMask}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('mask', subnetResult.subnetMask)}>
                  {copiedKey === 'mask' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">Wildcard Mask</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono">{subnetResult.wildcardMask}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('wildcard', subnetResult.wildcardMask)}>
                  {copiedKey === 'wildcard' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">Usable Host Capacity</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono font-bold">{subnetResult.usableHosts.toLocaleString()}</span>
                <span className="text-muted text-xs font-mono">({subnetResult.totalHosts.toLocaleString()} total)</span>
              </div>
            </div>

            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">Class & Scope</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v text-sm font-bold text-accent">{ipClassification?.ipClass}</span>
                <span className="text-muted text-xs font-mono">{ipClassification?.scope}</span>
              </div>
            </div>
          </div>

          {/* 32-Bit Binary Visualizer */}
          {binaryDetails && (
            <div className="winui-card wf-binary-card">
              <div className="flex-row items-center justify-between" style={{ marginBottom: '10px' }}>
                <span className="wf-col-title flex-row items-center gap-2">
                  <Binary size={15} className="text-accent" />
                  32-Bit Binary Mask Structure
                </span>
                <span className="wf-pill-tag">
                  {cidr} Network Bits / {32 - cidr} Host Bits
                </span>
              </div>

              <div className="wf-binary-display font-mono">
                <div className="wf-binary-row">
                  <span className="wf-binary-lbl">Host:</span>
                  <div className="wf-octets-row">
                    {binaryDetails.ipOctets.map((oct, oIdx) => (
                      <span key={oIdx} className="wf-octet-box">
                        {oct.split('').map((bit, bIdx) => {
                          const isNetBit = (oIdx * 8 + bIdx) < cidr;
                          return (
                            <span key={bIdx} className={isNetBit ? 'bit-net' : 'bit-host'}>
                              {bit}
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="wf-binary-row">
                  <span className="wf-binary-lbl">Mask:</span>
                  <div className="wf-octets-row">
                    {binaryDetails.maskOctets.map((oct, oIdx) => (
                      <span key={oIdx} className="wf-octet-box">
                        {oct.split('').map((bit, bIdx) => {
                          const isNetBit = (oIdx * 8 + bIdx) < cidr;
                          return (
                            <span key={bIdx} className={isNetBit ? 'bit-net' : 'bit-host'}>
                              {bit}
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="wf-binary-legend">
                <span className="legend-item"><span className="legend-dot dot-net" /> Network Identifier ({cidr} bits)</span>
                <span className="legend-item"><span className="legend-dot dot-host" /> Host Space ({32 - cidr} bits)</span>
              </div>
            </div>
          )}

          {/* VLSM Subnet Splitter */}
          {cidr < 30 && (
            <div className="winui-card wf-split-card">
              <div className="vlsm-header-row">
                <div className="vlsm-title-group">
                  <Split size={16} className="text-accent" />
                  <span className="wf-col-title">Subnet Partitioning (VLSM)</span>
                </div>

                <div className="vlsm-select-group">
                  <label htmlFor="vlsm-select-input" className="vlsm-select-label">Partition into:</label>
                  <select 
                    id="vlsm-select-input"
                    className="vlsm-dropdown"
                    value={targetSplitCidr}
                    onChange={(e) => setTargetSplitCidr(parseInt(e.target.value, 10))}
                  >
                    {Array.from({ length: 32 - cidr - 1 }, (_, i) => cidr + 1 + i).map(c => (
                      <option key={c} value={c}>/{c} ({Math.pow(2, c - cidr)} subnets)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="wf-table-wrap">
                <table className="wf-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Subnet</th>
                      <th>Usable Range</th>
                      <th>Broadcast</th>
                      <th>Hosts</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subnetsList.slice(0, 16).map((sub, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-muted">{idx + 1}</td>
                        <td className="font-mono font-bold text-accent">{sub.networkAddress}/{targetSplitCidr}</td>
                        <td className="font-mono">{sub.firstUsableHost} to {sub.lastUsableHost}</td>
                        <td className="font-mono text-muted">{sub.broadcastAddress}</td>
                        <td className="font-mono text-success">{sub.usableHosts}</td>
                        <td style={{ textAlign: 'right' }}>
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
              </div>
            </div>
          )}

          {/* Matrix Cheat Sheet */}
          <div className="wf-matrix-collapsible">
            <button 
              className="wf-matrix-toggle-btn"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
            >
              <div className="flex-row items-center gap-2">
                <BookOpen size={14} className="text-accent" />
                <span>CIDR Prefix Reference Matrix</span>
              </div>
              <span className="text-xs text-muted">{showCheatSheet ? 'Hide' : 'Show'}</span>
            </button>

            {showCheatSheet && (
              <div className="wf-table-wrap" style={{ marginTop: '10px' }}>
                <table className="wf-table">
                  <thead>
                    <tr>
                      <th>Prefix</th>
                      <th>Subnet Mask</th>
                      <th>Total</th>
                      <th>Usable Hosts</th>
                      <th>Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cidr: 24, mask: '255.255.255.0', total: 256, usable: 254, desc: 'Class C LAN' },
                      { cidr: 25, mask: '255.255.255.128', total: 128, usable: 126, desc: '1/2 Class C' },
                      { cidr: 26, mask: '255.255.255.192', total: 64, usable: 62, desc: '1/4 Class C' },
                      { cidr: 27, mask: '255.255.255.224', total: 32, usable: 30, desc: '1/8 Class C' },
                      { cidr: 28, mask: '255.255.255.240', total: 16, usable: 14, desc: 'Branch Office' },
                      { cidr: 29, mask: '255.255.255.248', total: 8, usable: 6, desc: 'Small Subnet' },
                      { cidr: 30, mask: '255.255.255.252', total: 4, usable: 2, desc: 'Point-to-Point' },
                      { cidr: 31, mask: '255.255.255.254', total: 2, usable: 2, desc: 'Router Links (RFC 3021)' },
                      { cidr: 32, mask: '255.255.255.255', total: 1, usable: 1, desc: 'Host Route' },
                    ].map(row => (
                      <tr key={row.cidr} className={cidr === row.cidr ? 'active-row' : ''}>
                        <td className="font-mono font-bold text-accent">/{row.cidr}</td>
                        <td className="font-mono">{row.mask}</td>
                        <td className="font-mono">{row.total}</td>
                        <td className="font-mono text-success font-bold">{row.usable}</td>
                        <td className="text-muted text-xs">{row.desc}</td>
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
