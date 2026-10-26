import React, { useMemo, useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { generateSecurePassword } from '../../utils/crypto';

const SETS = [
  { key: 'useLower', label: 'a–z', name: 'Lowercase' },
  { key: 'useUpper', label: 'A–Z', name: 'Uppercase' },
  { key: 'useNumbers', label: '0–9', name: 'Numbers' },
  { key: 'useSymbols', label: '!@#', name: 'Symbols' },
];

const MIN_LEN = 8;
const MAX_LEN = 64;
const NIST_MIN = 15;

function tierColor(tier) {
  if (tier === 'Very Weak' || tier === 'Weak') return 'var(--accent-brand-text)';
  if (tier === 'Moderate') return 'var(--accent-warning)';
  return 'var(--accent-success)';
}

export function PasswordSuite() {
  const [length, setLength] = useState(16);
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
    // nonce forces a fresh password on "Generate"
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
    if (sets[key] && activeCount === 1) return; // keep at least one set on
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
          Password Generator
        </h2>
      </div>

      {/* Output */}
      <div className="winui-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {result.error ? (
          <div className="winui-codebox" style={{ color: 'var(--accent-brand-text)' }}>
            {result.error}
          </div>
        ) : (
          <div
            className="winui-codebox"
            style={{
              fontSize: '1.05rem',
              padding: '14px 16px',
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              userSelect: 'all',
              letterSpacing: '0.02em',
            }}
          >
            {d.password}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="winui-btn winui-btn-primary" onClick={copy} disabled={!d}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="winui-btn" onClick={() => setNonce((n) => n + 1)}>
            <RefreshCw size={14} />
            Generate
          </button>
        </div>

        {d && (
          <>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color }}>{d.tier}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {d.entropyBits} bits
                </span>
              </div>
              <div
                style={{
                  height: '5px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${d.percentage}%`,
                    height: '100%',
                    background: color,
                    opacity: 0.85,
                    transition: 'width 0.2s ease, background 0.2s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="winui-badge">Length {d.length}</span>
              <span className="winui-badge">Pool {d.poolSize}</span>
              <span className="winui-badge">Crack time: {d.crackTime}</span>
            </div>

            {d.nistWarning && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-brand-subtle)',
                  border: '1px solid var(--accent-brand-border)',
                  color: 'var(--accent-brand-text)',
                  fontSize: '0.78rem',
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                Under {NIST_MIN} characters. NIST advises {NIST_MIN}+.
              </div>
            )}
          </>
        )}
      </div>

      {/* Options */}
      <div className="winui-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <label
              htmlFor="pw-length"
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              Length
            </label>
            <span className="winui-badge winui-badge-brand">{length}</span>
          </div>
          <input
            id="pw-length"
            type="range"
            min={MIN_LEN}
            max={MAX_LEN}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-brand-hover)', cursor: 'pointer' }}
          />
        </div>

        <div>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Characters
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
            {SETS.map((s) => {
              const on = sets[s.key];
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  title={s.name}
                  onClick={() => toggleSet(s.key)}
                  className={`winui-card${on ? ' winui-card-selected' : ''}`}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: on ? 'var(--accent-brand-text)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                  }}
                >
                  {s.label}
                  {on && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
