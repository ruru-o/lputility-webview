import React, { useMemo, useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';
import { generateSecurePassword } from '../../utils/crypto';

const SETS = [
  { key: 'useLower', label: 'a–z', name: 'Lowercase' },
  { key: 'useUpper', label: 'A–Z', name: 'Uppercase' },
  { key: 'useNumbers', label: '0–9', name: 'Numbers' },
  { key: 'useSymbols', label: '!@#', name: 'Symbols' },
];

const MIN_LEN = 8;
const MAX_LEN = 64;

function tierColor(tier) {
  if (tier === 'Very Weak' || tier === 'Weak') return '#ef4444';
  if (tier === 'Moderate') return '#f59e0b';
  return '#10b981';
}

export function PasswordSuite() {
  const [length, setLength] = useState(18);
  const [sets, setSets] = useState({
    useLower: true,
    useUpper: true,
    useNumbers: true,
    useSymbols: true,
  });
  const [nonce, setNonce] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeCount = SETS.filter((s) => sets[s.key]).length;

  const result = useMemo(() => {
    try {
      return { data: generateSecurePassword({ length, ...sets }) };
    } catch (err) {
      return { error: err.message };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, sets, nonce]);

  useEffect(() => {
    setCopied(false);
  }, [result]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const toggleSet = (key) => {
    if (sets[key] && activeCount === 1) return;
    setSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copy = async () => {
    if (!result.data) return;
    try {
      await navigator.clipboard.writeText(result.data.password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const d = result.data;
  const color = d ? tierColor(d.tier) : 'var(--text-muted)';

  return (
    <div className="wf-benchmark-wrapper">
      <div className="wf-top-bar">
        <div>
          <h1 className="wf-title">Password & Secret Generator</h1>
          <p className="wf-subtitle">Cryptographically secure tokens with NIST SP 800-63B Shannon entropy metrics.</p>
        </div>
      </div>

      <div className="winui-card wf-password-card">
        {/* Output Box */}
        <div className="wf-pass-output-row">
          <div className="wf-pass-text font-mono">
            {d?.password || '...'}
          </div>

          <div className="wf-pass-actions">
            <button className="winui-btn winui-btn-primary" onClick={copy} disabled={!d}>
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className="winui-btn winui-btn-subtle" onClick={() => setNonce((n) => n + 1)}>
              <RefreshCw size={14} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        {d && (
          <div className="wf-strength-wrap">
            <div className="flex-row justify-between items-center" style={{ marginBottom: '6px' }}>
              <span className="font-bold text-sm" style={{ color }}>{d.tier}</span>
              <span className="font-mono text-xs text-muted">{d.entropyBits} bits entropy</span>
            </div>
            <div className="wf-strength-track">
              <div 
                className="wf-strength-bar" 
                style={{ width: `${d.percentage}%`, backgroundColor: color }} 
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="wf-pass-controls-grid">
          {/* Length Slider */}
          <div className="wf-pass-ctrl-col">
            <div className="flex-row justify-between items-center" style={{ marginBottom: '8px' }}>
              <label className="wf-field-label">Length: {length} chars</label>
            </div>
            <input
              type="range"
              min={MIN_LEN}
              max={MAX_LEN}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="winui-range"
            />
          </div>

          {/* Character Toggles */}
          <div className="wf-pass-ctrl-col">
            <label className="wf-field-label">Character Sets</label>
            <div className="wf-chips-row">
              {SETS.map((s) => {
                const on = sets[s.key];
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`wf-chip ${on ? 'active' : ''}`}
                    onClick={() => toggleSet(s.key)}
                  >
                    <span>{s.label}</span>
                    <span className="text-xs text-muted">({s.name})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
