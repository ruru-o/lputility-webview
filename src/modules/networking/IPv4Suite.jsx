import React, { useState, useMemo } from 'react';
import { Network, Copy, Check, Info, Layers, Split } from 'lucide-react';
import { calculateSubnet, splitSubnet, isValidIpv4 } from '../../utils/ipv4';

export function IPv4Suite() {
  const [ip, setIp] = useState('192.168.1.50');
  const [cidr, setCidr] = useState(24);
  const [targetSplitCidr, setTargetSplitCidr] = useState(26);
  const [copiedKey, setCopiedKey] = useState(null);

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
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Binary octet representation of subnet mask
  const binaryMask = useMemo(() => {
    if (!subnetResult) return '';
    return subnetResult.subnetMask
      .split('.')
      .map(o => parseInt(o, 10).toString(2).padStart(8, '0'))
      .join(' . ');
  }, [subnetResult]);

  return (
    <div className="network-suite-workspace">
      <div className="suite-header">
        <h1 className="suite-title">
          <Network className="text-accent" size={24} />
          IPv4 Subnet & Boundary Analyzer
        </h1>
        <p className="suite-subtitle">
          Bitwise network boundary computation, wildcard mask synthesis, binary octet analysis, and VLSM subnet partitioning.
        </p>
      </div>

      {/* Input Form */}
      <div className="winui-card suite-input-card">
        <div className="ipv4-input-grid">
          <div className="input-field-group">
            <label className="input-label">IPv4 Host Address</label>
            <input 
              type="text"
              className={`winui-input ${!isValid ? 'input-error' : ''}`}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g., 192.168.1.1"
            />
            {!isValid && (
              <span className="field-error-text">Please enter a valid IPv4 address (0.0.0.0 â€“ 255.255.255.255)</span>
            )}
          </div>

          <div className="input-field-group">
            <div className="slider-header-row">
              <label className="input-label">Prefix Mask Length: /{cidr}</label>
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
          </div>
        </div>
      </div>

      {/* Calculated Results Grid */}
      {subnetResult && (
        <div className="suite-results-section">
          <div className="metrics-summary-grid">
            {[
              { key: 'network', label: 'Network Address', val: subnetResult.networkAddress },
              { key: 'broadcast', label: 'Broadcast Address', val: subnetResult.broadcastAddress },
              { key: 'first', label: 'First Usable Host', val: subnetResult.firstUsableHost },
              { key: 'last', label: 'Last Usable Host', val: subnetResult.lastUsableHost },
              { key: 'mask', label: 'Subnet Mask', val: subnetResult.subnetMask },
              { key: 'wildcard', label: 'Wildcard Mask', val: subnetResult.wildcardMask },
              { key: 'hosts', label: 'Usable Host Count', val: subnetResult.usableHosts.toLocaleString() },
              { key: 'cidr', label: 'CIDR Notation', val: `${subnetResult.networkAddress}/${cidr}` },
            ].map(item => (
              <div key={item.key} className="metric-card">
                <span className="metric-label">{item.label}</span>
                <div className="metric-val-row">
                  <span className="metric-value font-mono">{item.val}</span>
                  <button 
                    className="copy-mini-btn"
                    onClick={() => copyVal(item.key, item.val)}
                    title="Copy value"
                  >
                    {copiedKey === item.key ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Binary Representation Card */}
          <div className="winui-card binary-card">
            <h3 className="card-subheading">
              <Info size={16} className="text-accent" />
              Binary Octet Subnet Mask Architecture
            </h3>
            <div className="binary-display font-mono">
              {binaryMask}
            </div>
            <div className="binary-legend">
              <span className="legend-item"><span className="legend-box net-bit" /> Network Bits ({cidr})</span>
              <span className="legend-item"><span className="legend-box host-bit" /> Host Bits ({32 - cidr})</span>
            </div>
          </div>

          {/* Subnet Splitting Section (VLSM) */}
          {cidr < 30 && (
            <div className="winui-card subnet-split-card">
              <div className="split-card-header">
                <div>
                  <h3 className="card-subheading">
                    <Split size={16} className="text-accent" />
                    Subnet Partitioning (VLSM Splitter)
                  </h3>
                  <p className="subtext">
                    Divide this /{cidr} block into smaller /{targetSplitCidr} subnets.
                  </p>
                </div>

                <div className="split-target-select">
                  <label className="text-sm">Target Subnet Mask:</label>
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
                    </tr>
                  </thead>
                  <tbody>
                    {subnetsList.slice(0, 16).map((sub, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="font-mono text-accent">{sub.networkAddress}/{targetSplitCidr}</td>
                        <td className="font-mono">{sub.firstUsableHost} â€“ {sub.lastUsableHost}</td>
                        <td className="font-mono text-muted">{sub.broadcastAddress}</td>
                        <td>{sub.usableHosts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subnetsList.length > 16 && (
                  <div className="table-overflow-note">
                    Showing first 16 of {subnetsList.length} subnets.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
