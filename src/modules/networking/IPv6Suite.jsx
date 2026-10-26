import React, { useState, useMemo } from 'react';
import { 
  Globe2, 
  Copy, 
  Check, 
  Layers, 
  Compass 
} from 'lucide-react';
import { calculateIpv6 } from '../../utils/ipv6';

const PRESETS = [
  { label: 'Cloudflare Edge (/64)', ip: '2606:4700:4700::1111', prefix: 64 },
  { label: 'Google Public DNS (/64)', ip: '2001:4860:4860::8888', prefix: 64 },
  { label: 'RFC 3849 Doc (/48)', ip: '2001:db8:abcd::', prefix: 48 },
  { label: 'Unique Local ULA (/64)', ip: 'fd00:cafe:babe::1', prefix: 64 },
  { label: 'Link-Local (/64)', ip: 'fe80::1', prefix: 64 },
  { label: 'IPv4-Mapped (/128)', ip: '::ffff:192.168.1.1', prefix: 128 },
  { label: 'Loopback (/128)', ip: '::1', prefix: 128 },
];

const PREFIX_CHIPS = [32, 48, 56, 60, 64, 128];

export function IPv6Suite() {
  const [ip, setIp] = useState('2606:4700:4700::1111');
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

  const reverseDns = useMemo(() => {
    if (!result?.expanded) return '';
    try {
      const cleanHex = result.expanded.replace(/:/g, '').toLowerCase();
      return cleanHex.split('').reverse().join('.') + '.ip6.arpa';
    } catch {
      return '';
    }
  }, [result]);

  const hextets = useMemo(() => {
    if (!result?.expanded) return [];
    const blocks = result.expanded.split(':');
    return blocks.map((block, idx) => {
      const startBit = idx * 16;
      const endBit = startBit + 16;
      return {
        hex: block,
        index: idx,
        startBit,
        endBit,
        isNetwork: endBit <= prefix,
      };
    });
  }, [result, prefix]);

  return (
    <div className="wf-benchmark-wrapper">
      {/* Header */}
      <div className="wf-top-bar">
        <div>
          <h1 className="wf-title">IPv6 Calculator & Engine</h1>
          <p className="wf-subtitle">Canonical RFC 5952 compression, 128-bit BigInt math, and prefix allocation.</p>
        </div>
      </div>

      {/* Control Card */}
      <div className="winui-card wf-input-card">
        <div className="wf-input-flex-row">
          {/* IP Input */}
          <div className="wf-input-col">
            <label className="wf-field-label">IPv6 Address or Hex Notation</label>
            <input 
              type="text"
              className={`winui-input font-mono ${error ? 'input-error' : ''}`}
              value={ip}
              onChange={(e) => setIp(e.target.value.trim())}
              placeholder="2606:4700:4700::1111"
            />
            {error && (
              <span className="field-error-text">{error}</span>
            )}
            
            {/* Presets */}
            <div className="wf-chips-row">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  className={`wf-chip ${ip === p.ip && prefix === p.prefix ? 'active' : ''}`}
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

          {/* Prefix Slider */}
          <div className="wf-input-col">
            <div className="flex-row justify-between items-center" style={{ marginBottom: '6px' }}>
              <label className="wf-field-label">Prefix Mask Length: /{prefix}</label>
              <span className="font-mono text-accent text-sm">
                {prefix <= 64 ? `${64 - prefix} bits for /64 LANs` : 'Host Allocation'}
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

            {/* Quick Chips */}
            <div className="wf-chips-row">
              {PREFIX_CHIPS.map(c => (
                <button
                  key={c}
                  className={`wf-chip ${prefix === c ? 'active' : ''}`}
                  onClick={() => setPrefix(c)}
                >
                  /{c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="wf-results-stack">
          {/* Metric Grid */}
          <div className="wf-grid-4">
            <div className="wf-stat-tile winui-card span-2">
              <span className="wf-stat-k">Canonical Compressed (RFC 5952)</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono text-accent font-bold">{result.compressed}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('comp', result.compressed)}>
                  {copiedKey === 'comp' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card span-2">
              <span className="wf-stat-k">Full 128-Bit Expanded Form</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono text-sm">{result.expanded}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('exp', result.expanded)}>
                  {copiedKey === 'exp' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">Address Scope</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v text-sm font-bold text-success">{result.type}</span>
              </div>
            </div>

            <div className="wf-stat-tile winui-card">
              <span className="wf-stat-k">CIDR Prefix Block</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono text-accent font-bold">{result.compressed}/{prefix}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('cidr', `${result.compressed}/${prefix}`)}>
                  {copiedKey === 'cidr' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="wf-stat-tile winui-card span-2">
              <span className="wf-stat-k">Contained /64 Standard Subnets (BigInt)</span>
              <div className="wf-stat-v-row">
                <span className="wf-stat-v font-mono text-accent font-bold">{result.slash64Subnets}</span>
                <button className="copy-mini-btn" onClick={() => copyVal('s64', result.slash64BigIntCount)}>
                  {copiedKey === 's64' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* 128-Bit Hextet Structural Breakdown */}
          <div className="winui-card wf-hextet-card">
            <div className="flex-row items-center justify-between" style={{ marginBottom: '12px' }}>
              <span className="wf-col-title flex-row items-center gap-2">
                <Layers size={15} className="text-accent" />
                128-Bit Hextet Architecture (8 x 16-Bit Blocks)
              </span>
              <span className="wf-pill-tag">
                /{prefix} Boundary
              </span>
            </div>

            <div className="wf-hextet-grid">
              {hextets.map(h => (
                <div 
                  key={h.index} 
                  className={`wf-hextet-box ${h.isNetwork ? 'hextet-net' : 'hextet-host'}`}
                >
                  <span className="wf-hextet-range">Bits {h.startBit} to {h.endBit - 1}</span>
                  <span className="wf-hextet-val font-mono">{h.hex}</span>
                  <span className="wf-hextet-type">{h.isNetwork ? 'Prefix' : 'Interface ID'}</span>
                </div>
              ))}
            </div>

            <div className="wf-binary-legend" style={{ marginTop: '12px' }}>
              <span className="legend-item"><span className="legend-dot dot-net" /> Routing Prefix ({prefix} bits)</span>
              <span className="legend-item"><span className="legend-dot dot-host" /> Interface ID ({128 - prefix} bits)</span>
            </div>
          </div>

          {/* Reverse DNS PTR Zone */}
          {reverseDns && (
            <div className="winui-card wf-ptr-card">
              <div className="flex-row items-center justify-between" style={{ marginBottom: '6px' }}>
                <span className="wf-col-title flex-row items-center gap-2">
                  <Compass size={14} className="text-accent" />
                  Reverse DNS PTR Zone Record (ip6.arpa)
                </span>
                <button className="copy-mini-btn" onClick={() => copyVal('ptr', reverseDns)}>
                  {copiedKey === 'ptr' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono text-xs text-muted" style={{ wordBreak: 'break-all', background: 'rgba(0,0,0,0.35)', padding: '10px', borderRadius: '6px' }}>
                {reverseDns}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
