import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Globe2, 
  Server, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { runCombinedTelemetry } from '../../services/telemetryAggregator';

const PRESET_TARGETS = [
  { label: 'Cloudflare (1.1.1.1)', value: '1.1.1.1', type: 'ping' },
  { label: 'Google (8.8.8.8)', value: '8.8.8.8', type: 'ping' },
  { label: 'GitHub (github.com)', value: 'github.com', type: 'http' },
  { label: 'Quad9 (9.9.9.9)', value: '9.9.9.9', type: 'dns' },
];

export function TelemetryWorkspace({ initialTarget, initialType }) {
  const [target, setTarget] = useState(initialTarget || '1.1.1.1');
  const [measurementType, setMeasurementType] = useState(initialType || 'ping');
  const [selectedContinents, setSelectedContinents] = useState(['EU', 'AS', 'NA']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [expandedProbe, setExpandedProbe] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTarget) setTarget(initialTarget);
    if (initialType) setMeasurementType(initialType);
  }, [initialTarget, initialType]);

  // Run on mount
  useEffect(() => {
    handleRun({ isSimulatedFailure: false });
  }, []);

  const handleRun = async ({ isSimulatedFailure = false, overrideTarget = null } = {}) => {
    const activeTarget = overrideTarget || target;
    if (!activeTarget.trim()) return;

    setLoading(true);
    setError(null);

    const locations = selectedContinents.map(c => ({ continent: c, limit: 1 }));

    try {
      const data = await runCombinedTelemetry({
        type: measurementType,
        target: activeTarget,
        locations: locations.length > 0 ? locations : [{ continent: 'EU', limit: 1 }],
        isSimulatedFailure,
      });
      setResult(data);
    } catch (err) {
      setError(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleContinent = (code) => {
    setSelectedContinents(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="telemetry-workspace">
      {/* Control Card */}
      <div className="winui-card diagnostic-form-card">
        <div className="form-header">
          <div>
            <h2 className="section-title">Network Diagnostics</h2>
            <p className="section-subtitle">
              Distributed latency probes (Globalping API) correlated with BGP routing (RIPE Stat API).
            </p>
          </div>
        </div>

        <div className="target-input-row">
          <input 
            type="text"
            className="winui-input target-input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter hostname or IP (e.g. google.com, 1.1.1.1)"
            disabled={loading}
          />
          <button 
            className="winui-btn winui-btn-primary run-btn"
            onClick={() => handleRun({ isSimulatedFailure: false })}
            disabled={loading || !target.trim()}
          >
            {loading ? (
              <>
                <RefreshCw className="spin-icon" size={15} />
                Testing...
              </>
            ) : (
              'Run Test'
            )}
          </button>
        </div>

        {/* Quick Presets & Controls */}
        <div className="presets-and-options">
          <div className="presets-group">
            <span className="label-text">Presets:</span>
            {PRESET_TARGETS.map(p => (
              <button
                key={p.value}
                className={`preset-pill ${target === p.value ? 'active' : ''}`}
                onClick={() => {
                  setTarget(p.value);
                  setMeasurementType(p.type);
                }}
                disabled={loading}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="type-selector-group">
            <div className="segmented-tabs">
              {[
                { id: 'ping', label: 'Ping' },
                { id: 'dns', label: 'DNS' },
                { id: 'http', label: 'HTTP' },
                { id: 'traceroute', label: 'Trace' },
              ].map(t => (
                <button
                  key={t.id}
                  className={`tab-btn ${measurementType === t.id ? 'active' : ''}`}
                  onClick={() => setMeasurementType(t.id)}
                  disabled={loading}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Continent Toggles & Failure Simulation */}
        <div className="continents-bar">
          <div className="continents-list">
            <span className="label-text">Probes:</span>
            {[
              { code: 'EU', label: 'Europe' },
              { code: 'AS', label: 'Asia' },
              { code: 'NA', label: 'N. America' },
              { code: 'OC', label: 'Oceania' },
            ].map(c => (
              <button
                key={c.code}
                className={`continent-btn ${selectedContinents.includes(c.code) ? 'selected' : ''}`}
                onClick={() => toggleContinent(c.code)}
                disabled={loading}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="subtle-test-actions">
            <button
              className="text-link-btn"
              onClick={() => handleRun({ isSimulatedFailure: true })}
              disabled={loading}
              title="Test application error state handling"
            >
              Simulate error
            </button>
            <span className="divider">&bull;</span>
            <button
              className="text-link-btn"
              onClick={() => handleRun({ overrideTarget: 'trigger-empty-state' })}
              disabled={loading}
              title="Test empty response handling"
            >
              Simulate empty
            </button>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="winui-card error-card">
          <div className="state-content">
            <AlertCircle size={24} className="text-danger" />
            <div>
              <h3 className="state-title">Diagnostics Failed</h3>
              <p className="state-desc">{error.message || 'Unable to complete test.'}</p>
            </div>
          </div>
          <button 
            className="winui-btn winui-btn-primary state-retry-btn"
            onClick={() => handleRun({ isSimulatedFailure: false, overrideTarget: '1.1.1.1' })}
          >
            Retry with 1.1.1.1
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {result?.isEmpty && !loading && (
        <div className="winui-card empty-card">
          <div className="state-content">
            <Globe2 size={24} className="text-secondary" />
            <div>
              <h3 className="state-title">No Data Found</h3>
              <p className="state-desc">No active probes or routing records matched "{result.target}".</p>
            </div>
          </div>
          <button 
            className="winui-btn winui-btn-subtle state-retry-btn"
            onClick={() => handleRun({ overrideTarget: '1.1.1.1' })}
          >
            Reset to 1.1.1.1
          </button>
        </div>
      )}

      {/* SUCCESS RESULTS */}
      {result && !result.isEmpty && !loading && (
        <div className="results-container">
          {/* Target Summary Card */}
          <div className="winui-card summary-card">
            <div className="summary-main">
              <div className="target-title-row">
                <span className="target-name font-mono">{result.target}</span>
                {result.ripestat?.resolvedIp && result.ripestat.resolvedIp !== result.target && (
                  <span className="resolved-chip font-mono">
                    {result.ripestat.resolvedIp}
                  </span>
                )}
                <span className="mode-chip">{result.type.toUpperCase()}</span>
              </div>
              <div className="target-as-row">
                <strong>{result.ripestat?.primaryAsn || 'N/A'}</strong>
                <span className="as-name">{result.ripestat?.asHolder || 'Unknown AS'}</span>
                <span>&bull;</span>
                <span className="font-mono text-muted">{result.ripestat?.prefix || ''}</span>
              </div>
            </div>

            <div className="summary-stats">
              <div className="stat-pill">
                <span className="stat-label">Average RTT</span>
                <span className="stat-value font-mono">
                  {result.globalping?.avgLatency !== null ? `${result.globalping.avgLatency} ms` : 'N/A'}
                </span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Probes Sampled</span>
                <span className="stat-value font-mono">
                  {result.globalping?.probesCount || 0}
                </span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Total Time</span>
                <span className="stat-value font-mono">
                  {result.durations?.total} ms
                </span>
              </div>
            </div>
          </div>

          {/* Dual Panel: Probes & BGP Info */}
          <div className="results-grid">
            {/* Probes List */}
            <div className="winui-card grid-card">
              <div className="card-header">
                <div className="header-label">
                  <Globe2 size={16} />
                  <span>Probe Measurements</span>
                </div>
                <span className="badge-tag">Globalping</span>
              </div>

              <div className="probes-table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Network</th>
                      <th>Latency</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.globalping?.probes?.map((probe, i) => {
                      const isExpanded = expandedProbe === i;
                      return (
                        <React.Fragment key={i}>
                          <tr>
                            <td>
                              <span className="country-code">{probe.country}</span>
                              <span className="city-name">{probe.city}</span>
                            </td>
                            <td className="text-muted text-sm">{probe.network || `AS${probe.asn}`}</td>
                            <td className="font-mono font-bold">
                              {probe.latency !== null ? `${probe.latency} ms` : 'N/A'}
                            </td>
                            <td className="action-col">
                              <button 
                                className="icon-btn"
                                onClick={() => setExpandedProbe(isExpanded ? null : i)}
                                title="Show console trace"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="trace-row">
                              <td colSpan={4}>
                                <pre className="trace-pre">{probe.rawOutput || probe.summary}</pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BGP & AS Information */}
            <div className="winui-card grid-card">
              <div className="card-header">
                <div className="header-label">
                  <Server size={16} />
                  <span>BGP & Autonomous System</span>
                </div>
                <span className="badge-tag">RIPE Stat</span>
              </div>

              <div className="details-table">
                <div className="data-row">
                  <span className="data-key">Autonomous System</span>
                  <span className="data-val font-bold font-mono text-accent">
                    {result.ripestat?.primaryAsn || 'N/A'}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-key">Organization</span>
                  <span className="data-val">{result.ripestat?.asHolder || 'Unknown'}</span>
                </div>
                <div className="data-row">
                  <span className="data-key">Announced Prefix</span>
                  <span className="data-val font-mono">{result.ripestat?.prefix || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="data-key">RIR Registry</span>
                  <span className="data-val">{result.ripestat?.asBlock || 'Global'}</span>
                </div>
                <div className="data-row">
                  <span className="data-key">Status</span>
                  <span className="data-val text-success">
                    {result.ripestat?.asAnnounced ? 'Announced & Active' : 'Unannounced'}
                  </span>
                </div>
                {result.ripestat?.dnsDetails?.ttl && (
                  <div className="data-row">
                    <span className="data-key">DNS TTL</span>
                    <span className="data-val font-mono">{result.ripestat.dnsDetails.ttl}s</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raw JSON toggle */}
          <div className="raw-toggle-wrap">
            <button 
              className="text-link-btn"
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? 'Hide raw JSON data' : 'View raw JSON data'}
            </button>

            {showRaw && (
              <div className="raw-container">
                <div className="raw-header">
                  <span>Diagnostic JSON</span>
                  <button 
                    className="icon-btn"
                    onClick={() => handleCopy(JSON.stringify(result, null, 2))}
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre className="raw-pre">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
