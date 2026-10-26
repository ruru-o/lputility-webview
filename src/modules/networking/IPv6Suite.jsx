import React, { useState, useMemo } from 'react';
import { 
  Globe2, 
  Copy, 
  Check, 
  Layers, 
  Cpu, 
  Hash, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  Compass 
} from 'lucide-react';
import { calculateIpv6, parseAndExpandIpv6, compressIpv6 } from '../../utils/ipv6';

const PRESETS = [
  { label: 'Google Public DNS', ip: '2001:4860:4860::8888', prefix: 64 },
  { label: 'Cloudflare Edge DNS', ip: '2606:4700:4700::1111', prefix: 64 },
  { label: 'RFC 3849 Documentation', ip: '2001:db8:abcd::', prefix: 48 },
  { label: 'Unique Local (ULA)', ip: 'fd00:cafe:babe::1', prefix: 64 },
  { label: 'Link-Local Unicast', ip: 'fe80::1', prefix: 64 },
  { label: 'IPv4-Mapped IPv6', ip: '::ffff:192.168.1.1', prefix: 128 },
  { label: 'Local Loopback', ip: '::1', prefix: 128 },
];

const PREFIX_CHIPS = [32, 48, 56, 60, 64, 128];

export function IPv6Suite() {
  const [ip, setIp] = useState('2001:4860:4860::8888');
  const [prefix, setPrefix] = useState(64);
  const [copiedKey, setCopiedKey] = useState(null);

  const { result, error } = useMemo(() => {
    try {
      const calc = calculateIpv6(ip.trim(), prefix);
      return { result: calc, error: null };
    } catch (err) {
      return { result: null, error: err.message };
    }
  }, [ip, prefix]);

  const copyVal = (key, val) => {
    if (!val) return;
    navigator.clipboard.writeText(String(val));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Reverse DNS ip6.arpa PTR record synthesis
  const reverseDns = useMemo(() => {
    if (!result?.expanded) return '';
    try {
      const cleanHex = result.expanded.replace(/:/g, '').toLowerCase();
      return cleanHex.split('').reverse().join('.') + '.ip6.arpa';
    } catch {
      return '';
    }
  }, [result]);

  // Visual Hextet Breakdown (8 blocks of 16-bits each)
  const hextets = useMemo(() => {
    if (!result?.expanded) return [];
    const blocks = result.expanded.split(':');
    return blocks.map((block, idx) => {
      const startBit = idx * 16;
      const endBit = startBit + 16;
      let role = 'Interface ID (Host)';
      if (endBit <= prefix) {
        role = 'Prefix Bit';
      } else if (startBit < prefix) {
        role = 'Subnet Split';
      }
      return {
        hex: block,
        index: idx,
        startBit,
        endBit,
        role,
        isNetwork: endBit <= prefix,
      };
    });
  }, [result, prefix]);

  return (
    <div className="network-suite-workspace">
      {/* Header */}
      <div className="suite-header">
        <h1 className="suite-title">
          <Globe2 className="text-accent" size={24} />
          IPv6 128-Bit CIDR & RFC 5952 Calculator
        </h1>
        <p className="suite-subtitle">
          Arbitrary-precision 128-bit BigInt math, canonical RFC 5952 compression, SLAAC /64 subnet counts, and address scope classification.
        </p>
      </div>

      {/* Input Card */}
      <div className="winui-card suite-input-card">
        <div className="ipv6-input-grid">
          {/* Address Input */}
          <div className="input-field-group">
            <label className="input-label">IPv6 Address or Hex Notation</label>
            <input 
              type="text"
              className={`winui-input font-mono ${error ? 'input-error' : ''}`}
              value={ip}
              onChange={(e) => setIp(e.target.value.trim())}
              placeholder="e.g. 2001:db8::1 or 2606:4700:4700::1111"
            />
            {error && (
              <span className="field-error-text">{error}</span>
            )}
            
            {/* Quick Presets */}
            <div className="quick-presets-row" style={{ marginTop: '10px' }}>
              <span className="preset-label">Presets:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  className={`preset-chip ${ip === p.ip && prefix === p.prefix ? 'active' : ''}`}
                  onClick={() => {
                    setIp(p.ip);
                    setPrefix(p.prefix);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prefix Length Slider */}
          <div className="input-field-group">
            <div className="slider-header-row">
              <label className="input-label">Prefix Mask Length: /{prefix}</label>
              <span className="mask-preview font-mono">
                {prefix <= 64 ? `${64 - prefix} bits for /64 LANs` : 'Host Interface Allocation'}
              </span>
            </div>

            <input 
              type="range"
              min={1}
              max={128}
              value={prefix}
              onChange={(e) => setPrefix(parseInt(e.target.value, 10))}
              className="winui-range"
            />

            {/* Quick Prefix Chips */}
            <div className="cidr-shortcuts-row">
              {PREFIX_CHIPS.map(c => (
                <button
                  key={c}
                  className={`cidr-btn ${prefix === c ? 'active' : ''}`}
                  onClick={() => setPrefix(c)}
                >
                  /{c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="suite-results-section">
          <div className="metrics-summary-grid">
            {/* Compressed */}
            <div className="metric-card wide-card">
              <span className="metric-label">RFC 5952 Canonical Compressed Address</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-accent font-bold">{result.compressed}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('comp', result.compressed)}>
                  {copiedKey === 'comp' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Full 128-Bit Expanded */}
            <div className="metric-card wide-card">
              <span className="metric-label">Full 128-Bit Expanded Hex Form</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-sm">{result.expanded}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('exp', result.expanded)}>
                  {copiedKey === 'exp' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Scope / Type */}
            <div className="metric-card">
              <span className="metric-label">Address Scope & Type</span>
              <div className="metric-val-row">
                <span className="metric-value badge-optimal text-sm font-bold">{result.type}</span>
              </div>
            </div>

            {/* CIDR Block */}
            <div className="metric-card">
              <span className="metric-label">CIDR Prefix Block</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-accent font-bold">{result.compressed}/{prefix}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('cidr', `${result.compressed}/${prefix}`)}>
                  {copiedKey === 'cidr' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* /64 Subnets */}
            <div className="metric-card wide-card">
              <span className="metric-label">Contained /64 Standard Subnets (BigInt Math)</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-success font-bold">{result.slash64Subnets}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('s64', result.slash64BigIntCount)}>
                  {copiedKey === 's64' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
              <span className="metric-subtext">2^({Math.max(0, 64 - prefix)}) standard SLAAC-capable IPv6 LAN subnets</span>
            </div>
          </div>

          {/* 128-Bit Hextet Visual Architecture */}
          <div className="winui-card binary-card">
            <h3 className="card-subheading flex-row items-center gap-2" style={{ marginBottom: '14px' }}>
              <Layers size={16} className="text-accent" />
              128-Bit Hextet Structural Breakdown (8 x 16-Bit Blocks)
            </h3>

            <div className="hextet-blocks-grid">
              {hextets.map(h => (
                <div 
                  key={h.index} 
                  className={`hextet-card ${h.isNetwork ? 'hextet-net' : 'hextet-host'}`}
                >
                  <span className="hextet-bits text-xs text-muted">Bits {h.startBit}–{h.endBit - 1}</span>
                  <span className="hextet-val font-mono font-bold">{h.hex}</span>
                  <span className="hextet-role text-xs">{h.role}</span>
                </div>
              ))}
            </div>

            <div className="binary-legend" style={{ marginTop: '14px' }}>
              <span className="legend-item"><span className="legend-box net-bit-box" /> Routing / Network Prefix Bits</span>
              <span className="legend-item"><span className="legend-box host-bit-box" /> Interface Identifier (Host Bits)</span>
            </div>
          </div>

          {/* Reverse DNS Card */}
          {reverseDns && (
            <div className="winui-card rfc-context-card">
              <div className="flex-row items-center justify-between" style={{ marginBottom: '8px' }}>
                <h3 className="card-subheading flex-row items-center gap-2">
                  <Compass size={16} className="text-accent" />
                  Reverse DNS PTR Zone Record (ip6.arpa)
                </h3>
                <button className="copy-mini-btn" onClick={() => copyVal('ptr', reverseDns)}>
                  {copiedKey === 'ptr' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
              <p className="font-mono text-xs text-secondary" style={{ wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                {reverseDns}
              </p>
            </div>
          )}

          {/* RFC Context Card */}
          <div className="winui-card rfc-context-card">
            <h3 className="card-subheading flex-row items-center gap-2">
              <Cpu size={16} className="text-accent" />
              RFC 5952 Recommendation Compliance
            </h3>
            <p className="rfc-notes text-sm text-secondary">
              RFC 5952 enforces strictly deterministic IPv6 formatting: leading zeros inside a 16-bit field must be removed, double colons (<code>::</code>) must represent the longest run of consecutive 16-bit zeros (and cannot be used to shorten a single 16-bit zero), and characters <code>a-f</code> must always be lowercase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
