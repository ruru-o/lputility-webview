import React, { useState, useMemo } from 'react';
import { Globe2, Copy, Check, Layers, Cpu, ExternalLink } from 'lucide-react';
import { calculateIpv6, parseAndExpandIpv6, compressIpv6 } from '../../utils/ipv6';

const PRESETS = [
  { label: 'Google Public DNS', ip: '2001:4860:4860::8888', prefix: 64 },
  { label: 'Cloudflare DNS', ip: '2606:4700:4700::1111', prefix: 64 },
  { label: 'RFC 3849 Documentation Block', ip: '2001:db8:abcd::', prefix: 48 },
  { label: 'Unique Local Address (ULA)', ip: 'fd00::1', prefix: 64 },
  { label: 'Link-Local Unicast', ip: 'fe80::1', prefix: 64 },
  { label: 'Local Loopback', ip: '::1', prefix: 128 },
];

export function IPv6Suite() {
  const [ip, setIp] = useState('2001:4860:4860::8888');
  const [prefix, setPrefix] = useState(64);
  const [copiedKey, setCopiedKey] = useState(null);

  const { result, error } = useMemo(() => {
    try {
      const calc = calculateIpv6(ip, prefix);
      return { result: calc, error: null };
    } catch (err) {
      return { result: null, error: err.message };
    }
  }, [ip, prefix]);

  const copyVal = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="network-suite-workspace">
      <div className="suite-header">
        <h1 className="suite-title">
          <Globe2 className="text-accent" size={24} />
          IPv6 128-Bit CIDR & RFC 5952 Engine
        </h1>
        <p className="suite-subtitle">
          Arbitrary-precision 128-bit BigInt math, canonical RFC 5952 compression, zero-expansion, and address scope classification.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="winui-card suite-input-card">
        <div className="ipv6-input-grid">
          <div className="input-field-group">
            <label className="input-label">IPv6 Address or Hex Notation</label>
            <input 
              type="text"
              className={`winui-input font-mono ${error ? 'input-error' : ''}`}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g., 2001:db8::1 or 2606:4700:4700::1111"
            />
            {error && (
              <span className="field-error-text">{error}</span>
            )}
            
            {/* Quick Presets */}
            <div className="quick-presets-row" style={{ marginTop: '8px' }}>
              <span className="preset-label">Presets:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  className={`preset-chip ${ip === p.ip ? 'active' : ''}`}
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

          <div className="input-field-group">
            <div className="slider-header-row">
              <label className="input-label">Prefix Mask Length: /{prefix}</label>
              <span className="mask-preview font-mono">{prefix <= 64 ? `${64 - prefix} bits for /64 subnets` : 'Host allocation'}</span>
            </div>
            <input 
              type="range"
              min={1}
              max={128}
              value={prefix}
              onChange={(e) => setPrefix(parseInt(e.target.value, 10))}
              className="winui-range"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="suite-results-section">
          <div className="metrics-summary-grid">
            <div className="metric-card wide-card">
              <span className="metric-label">RFC 5952 Canonical Compressed Address</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-accent">{result.compressed}</span>
                <button 
                  className="copy-mini-btn"
                  onClick={() => copyVal('compressed', result.compressed)}
                >
                  {copiedKey === 'compressed' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="metric-card wide-card">
              <span className="metric-label">Full 128-Bit Expanded Hex Form</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono">{result.expanded}</span>
                <button 
                  className="copy-mini-btn"
                  onClick={() => copyVal('expanded', result.expanded)}
                >
                  {copiedKey === 'expanded' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Address Scope & Type</span>
              <div className="metric-val-row">
                <span className="metric-value badge-optimal text-sm">{result.type}</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">CIDR Prefix Block</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono">{result.compressed}/{prefix}</span>
              </div>
            </div>

            <div className="metric-card wide-card">
              <span className="metric-label">Contained /64 Standard Subnets (BigInt Math)</span>
              <div className="metric-val-row">
                <span className="metric-value font-mono text-accent">{result.slash64Subnets}</span>
                <button 
                  className="copy-mini-btn"
                  onClick={() => copyVal('slash64', result.slash64BigIntCount)}
                >
                  {copiedKey === 'slash64' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
              <span className="metric-subtext">2^({Math.max(0, 64 - prefix)}) possible standard IPv6 LAN /64 subnets</span>
            </div>
          </div>

          {/* RFC Context Card */}
          <div className="winui-card rfc-context-card">
            <h3 className="card-subheading">
              <Cpu size={16} className="text-accent" />
              RFC 5952 & IPv6 Architecture Notes
            </h3>
            <p className="rfc-notes">
              RFC 5952 defines the definitive rules for IPv6 string representation: leading zeros in each 16-bit block are omitted, the longest sequence of consecutive all-zero blocks is replaced with <code>::</code> (only once), and lowercase hexadecimal characters (<code>a-f</code>) must be used.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
